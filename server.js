const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static('public'));

// Trust Railway's proxy so req.ip gives the real client IP
app.set('trust proxy', 1);

const parsedLimit = parseInt(process.env.DAILY_LIMIT, 10);
const DAILY_LIMIT = Number.isFinite(parsedLimit) ? parsedLimit : 20;
const ADMIN_IPS = (process.env.ADMIN_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);

const LEADS_PATH = path.join(__dirname, 'data', 'leads.json');

function loadLeads() {
  try {
    const parsed = JSON.parse(fs.readFileSync(LEADS_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function captureLead(email) {
  const leads = loadLeads();
  if (leads.some(lead => lead.email === email)) return { isNew: false };
  leads.push({ email, firstSeen: new Date().toISOString() });
  fs.mkdirSync(path.dirname(LEADS_PATH), { recursive: true });
  fs.writeFileSync(LEADS_PATH, JSON.stringify(leads, null, 2));
  notifyNewLead(email).catch(err => console.error('Lead notify failed:', err.message));
  return { isNew: true };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function emailFrom() {
  return process.env.EMAIL_FROM || 'Sticker Studio <onboarding@resend.dev>';
}

async function sendResendEmail({ to, subject, html, attachments }) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(attachments && attachments.length ? { attachments } : {})
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Resend ${res.status}`);
  return data;
}

async function notifyNewLead(email) {
  if (!process.env.RESEND_API_KEY || !process.env.BUSINESS_EMAIL) return;
  await sendResendEmail({
    to: process.env.BUSINESS_EMAIL,
    subject: 'New Sticker Studio email',
    html: `<p>New email captured:</p><p><strong>${escapeHtml(email)}</strong></p><p>${escapeHtml(new Date().toLocaleString())}</p>`
  });
}

// IP-based rate limiting store
const ipStore = new Map();

function getClientIP(req) {
  return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
}

function getRateLimit(ip) {
  if (!ipStore.has(ip)) {
    ipStore.set(ip, { used: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 });
  }
  const entry = ipStore.get(ip);
  // Reset after 24 hours
  if (Date.now() > entry.resetAt) {
    entry.used = 0;
    entry.resetAt = Date.now() + 24 * 60 * 60 * 1000;
  }
  return entry;
}

function isAdmin(req) {
  const ip = getClientIP(req);
  return ADMIN_IPS.includes(ip);
}

function normalizeEmail(raw) {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function remainingOf(entry) {
  return Math.max(0, DAILY_LIMIT - entry.used);
}

function checkRateLimit(req, res, emailRaw) {
  if (isAdmin(req) || DAILY_LIMIT <= 0) return { skipCount: true };

  const email = normalizeEmail(emailRaw);
  if (!email) {
    res.status(400).json({ error: 'Enter your email before generating.' });
    return null;
  }

  const emailLimit = getRateLimit(`email:${email}`);
  const ipLimit = getRateLimit(`ip:${getClientIP(req)}`);
  const remaining = Math.min(remainingOf(emailLimit), remainingOf(ipLimit));
  if (remaining <= 0) {
    const blocker = remainingOf(emailLimit) <= 0 ? emailLimit : ipLimit;
    const hoursLeft = Math.ceil((blocker.resetAt - Date.now()) / (1000 * 60 * 60));
    res.status(429).json({
      error: `Daily limit reached (${DAILY_LIMIT} designs per day). Try again in ~${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}.`,
      trialsRemaining: 0
    });
    return null;
  }
  return { emailLimit, ipLimit, skipCount: false };
}

function consumeLimit(limit) {
  if (!limit || limit.skipCount) return { trialsRemaining: null, unlimited: true };
  limit.emailLimit.used++;
  limit.ipLimit.used++;
  return {
    trialsRemaining: Math.min(remainingOf(limit.emailLimit), remainingOf(limit.ipLimit)),
    unlimited: false
  };
}

function trialsFor(req, emailRaw) {
  if (isAdmin(req) || DAILY_LIMIT <= 0) {
    return { trialsRemaining: null, unlimited: true };
  }
  const email = normalizeEmail(emailRaw);
  if (!email) {
    return { trialsRemaining: DAILY_LIMIT, unlimited: false, needsEmail: true };
  }
  return {
    trialsRemaining: Math.min(
      remainingOf(getRateLimit(`email:${email}`)),
      remainingOf(getRateLimit(`ip:${getClientIP(req)}`))
    ),
    unlimited: false
  };
}

// Content safety filter
const BLOCKED_WORDS = [
  'nude', 'naked', 'nsfw', 'porn', 'sex', 'sexual', 'erotic', 'hentai',
  'gore', 'blood', 'murder', 'kill', 'torture', 'mutilat', 'dismember',
  'gun', 'rifle', 'pistol', 'weapon', 'bomb', 'explos', 'terrorist',
  'drug', 'cocaine', 'heroin', 'meth',
  'racist', 'slur', 'hate', 'nazi', 'swastika',
  'suicide', 'self-harm', 'cutting'
];

function isPromptSafe(prompt) {
  const lower = prompt.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return false;
    }
  }
  return true;
}

// Style configurations
const styles = {
  realistic: {
    prompt: 'photorealistic, highly detailed, professional photography, 8k uhd, sharp focus',
  },
  cartoon: {
    prompt: 'cartoon style, colorful, fun, animated, disney pixar style, vibrant',
  },
  kawaii: {
    prompt: 'kawaii style, cute, chibi, adorable, pastel colors, japanese cute aesthetic, rounded shapes',
  },
  watercolor: {
    prompt: 'watercolor painting, soft colors, artistic, delicate brushstrokes, fine art, painterly',
  },
  '3d': {
    prompt: '3d render, clay render, blender style, cute 3d character, smooth, rounded, soft lighting',
  },
  minimalist: {
    prompt: 'minimalist design, simple shapes, clean lines, flat design, vector style, geometric',
  },
  vintage: {
    prompt: 'vintage style, retro, nostalgic, old fashioned, classic illustration, muted colors',
  },
  neon: {
    prompt: 'neon lights, glowing, cyberpunk, vibrant neon colors, dark background with bright glow, synthwave',
  }
};

const GEMINI_MODEL = 'gemini-3.1-flash-lite-image';
const GEMINI_GENERATION_CONFIG = {
  responseModalities: ['TEXT', 'IMAGE'],
  responseFormat: {
    image: {
      aspectRatio: 'ASPECT_RATIO_ONE_BY_ONE',
      imageSize: 'IMAGE_SIZE_ONE_K'
    }
  }
};

function extractLastImage(data) {
  let imageData = null;
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const inline = part.inlineData || part.inline_data;
    const mime = inline?.mimeType || inline?.mime_type || '';
    if (inline?.data && mime.startsWith('image/')) {
      imageData = inline.data;
    }
  }
  return imageData;
}

function parseInlineImage(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return null;
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  let mimeType = 'image/png';
  if (dataUrl.startsWith('data:image/jpeg')) mimeType = 'image/jpeg';
  else if (dataUrl.startsWith('data:image/webp')) mimeType = 'image/webp';
  return { mimeType, data: base64Data };
}

function coloringPagePrompt(userPrompt, fromPhoto) {
  const subject = String(userPrompt || '').trim() || 'a fun animal';
  const lead = fromPhoto
    ? `Turn this photo into a printable kids coloring-book page. Keep the main subject recognizable. Extra request: ${subject}.`
    : `Create a printable kids coloring-book page of: ${subject}.`;
  return `${lead}
Black ink outlines only on a pure white background.
No color, no gray shading, no gradients, no watercolor, no stickers, no die-cut.
Thick even lines, simple closed shapes a child can color with crayons, lots of open white space.
Centered full-page illustration. No watermark, no signature, no decorative frame.
Family-friendly. Do not add text unless the user asked for words.`;
}

async function generateGeminiImage(parts, generationConfig = GEMINI_GENERATION_CONFIG) {
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig,
      }),
    }
  );

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    console.error('Gemini error:', geminiResponse.status, errorText.slice(0, 500));
    if (geminiResponse.status === 429 && errorText.includes('free_tier')) {
      throw new Error('This Gemini key is on the free-tier bucket (quota 0). In AI Studio pick the billed project, create a new key, paste it in .env');
    }
    throw new Error(`Gemini API error: ${geminiResponse.status}`);
  }

  const data = await geminiResponse.json();
  const imageData = extractLastImage(data);
  if (!imageData) {
    console.error('No image in Gemini response:', JSON.stringify(data).substring(0, 500));
    throw new Error('No image generated. Try a different prompt.');
  }
  return imageData;
}

// API endpoint to generate sticker using Gemini
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, style } = req.body;
    const mode = req.body.mode === 'coloring' ? 'coloring' : 'sticker';
    const incoming = parseInlineImage(req.body.image);

    if (!prompt && !(mode === 'coloring' && incoming)) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured. Add GEMINI_API_KEY to Railway variables.' });
    }

    // Content safety check (skip for admin)
    if (!isAdmin(req) && prompt && !isPromptSafe(prompt)) {
      return res.status(400).json({ error: 'Your prompt contains content that is not allowed. Please keep it family-friendly!' });
    }

    const limit = checkRateLimit(req, res, req.body.email);
    if (!limit) return;

    const styleConfig = styles[style] || styles.realistic;
    const fullPrompt = mode === 'coloring'
      ? coloringPagePrompt(prompt, Boolean(incoming))
      : `Generate an image of a sticker design: ${prompt}. 
Style: ${styleConfig.prompt}. 
Important: White background, die-cut sticker style, centered composition, high quality, vibrant colors, clean edges suitable for printing as a physical sticker. Must be family-friendly and safe for all ages. No violence, nudity, weapons, or offensive content.`;

    console.log('Generating image with Gemini:', fullPrompt);

    const parts = incoming
      ? [{ inlineData: { mimeType: incoming.mimeType, data: incoming.data } }, { text: fullPrompt }]
      : [{ text: fullPrompt }];
    const imageData = await generateGeminiImage(parts);

    const usage = consumeLimit(limit);

    res.json({
      image: `data:image/png;base64,${imageData}`,
      ...usage
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

// API endpoint to EDIT an existing image using Gemini
app.post('/api/edit', async (req, res) => {
  try {
    const { editPrompt, currentImage } = req.body;
    const mode = req.body.mode === 'coloring' ? 'coloring' : 'sticker';

    if (!editPrompt) {
      return res.status(400).json({ error: 'Edit instructions are required' });
    }

    if (!currentImage) {
      return res.status(400).json({ error: 'Current image is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured.' });
    }

    // Content safety check (skip for admin)
    if (!isAdmin(req) && !isPromptSafe(editPrompt)) {
      return res.status(400).json({ error: 'Your prompt contains content that is not allowed. Please keep it family-friendly!' });
    }

    const limit = checkRateLimit(req, res, req.body.email);
    if (!limit) return;

    const incoming = parseInlineImage(currentImage);
    if (!incoming) {
      return res.status(400).json({ error: 'Current image is required' });
    }

    const fullPrompt = mode === 'coloring'
      ? `Edit this coloring-book page: ${editPrompt}.
Keep black ink outlines only on a pure white background. No color fills, no gray shading, thick even lines, printable kids coloring page.`
      : `Edit this sticker image: ${editPrompt}. 
Keep it as a sticker design with white background, die-cut style, centered composition, high quality, vibrant colors, clean edges suitable for printing. Must be family-friendly and safe for all ages. No violence, nudity, weapons, or offensive content.`;

    console.log('Editing image with Gemini:', fullPrompt);

    const imageData = await generateGeminiImage([
      { inlineData: { mimeType: incoming.mimeType, data: incoming.data } },
      { text: fullPrompt }
    ]);

    const usage = consumeLimit(limit);

    res.json({
      image: `data:image/png;base64,${imageData}`,
      ...usage
    });

  } catch (error) {
    console.error('Edit error:', error);
    res.status(500).json({ error: error.message || 'Failed to edit image' });
  }
});

// API endpoint to get remaining generations
app.get('/api/trials/:sessionId', (req, res) => {
  res.json(trialsFor(req, req.query.email));
});

app.post('/api/gate', (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) return res.status(400).json({ error: 'Enter a valid email.' });
  captureLead(email);
  res.json({ email, ...trialsFor(req, email) });
});

app.get('/api/dictation/status', (req, res) => {
  res.json({ available: Boolean(process.env.XAI_API_KEY) });
});

function buildSttMultipart(language, buffer, filename, mime) {
  const boundary = '----StickerDictation' + Date.now();
  const pre = [
    `--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\ntrue\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${language}\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`
  ].join('');
  return {
    body: Buffer.concat([Buffer.from(pre), buffer, Buffer.from(`\r\n--${boundary}--\r\n`)]),
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || '').join('').trim();
}

async function transcribeWithGemini(audio, mime, language) {
  const cleanMime = (mime || 'audio/webm').split(';')[0];
  const prompt = language === 'es'
    ? 'Transcribe este audio. Devuelve solo las palabras habladas, sin comillas ni explicacion.'
    : 'Transcribe this audio. Return only the spoken words, no quotes or explanation.';
  const geminiRes = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: cleanMime, data: audio } },
            { text: prompt }
          ]
        }]
      })
    }
  );
  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error('Gemini STT error:', geminiRes.status, errText.slice(0, 300));
    throw new Error('Transcription failed. Try again.');
  }
  const text = extractGeminiText(await geminiRes.json());
  return { text, language };
}

app.post('/api/dictation', async (req, res) => {
  const language = req.body.language === 'es' ? 'es' : 'en';
  const mime = typeof req.body.mime === 'string' ? req.body.mime : 'audio/webm';
  const audio = req.body.audio;
  if (!audio || typeof audio !== 'string') {
    return res.status(400).json({ error: 'Audio is required' });
  }
  const buffer = Buffer.from(audio, 'base64');
  if (!buffer.length) {
    return res.status(400).json({ error: 'Audio is required' });
  }
  try {
    if (process.env.XAI_API_KEY) {
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      const packed = buildSttMultipart(language, buffer, `dictation.${ext}`, mime);
      const sttRes = await fetch('https://api.x.ai/v1/stt', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          'Content-Type': packed.contentType
        },
        body: packed.body
      });
      if (!sttRes.ok) {
        const errText = await sttRes.text();
        console.error('STT error:', sttRes.status, errText.slice(0, 300));
        return res.status(502).json({ error: 'Transcription failed. Try again.' });
      }
      const data = await sttRes.json();
      return res.json({ text: data.text || '', language: data.language || language });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Speech is not configured.' });
    }
    const result = await transcribeWithGemini(audio, mime, language);
    res.json(result);
  } catch (error) {
    console.error('Dictation error:', error.message);
    res.status(500).json({ error: error.message || 'Transcription failed. Try again.' });
  }
});

// Generate a print-ready PDF with stickers tiled on A4
// imageBuffers: array of Buffers, slots: array of indices into imageBuffers
function generatePrintPDF(imageBuffers, sizeKey, slots) {
  return new Promise((resolve, reject) => {
    // A4 in points: 595.28 x 841.89
    const A4_W = 595.28;
    const A4_H = 841.89;
    const CM_TO_PT = 28.35;
    const MARGIN = 0.3 * CM_TO_PT;
    const GAP = 0.2 * CM_TO_PT;

    const sizeMap = {
      'Medium (7×7cm)': 7,
      'Large (10×10cm)': 10
    };
    const sizeCm = sizeMap[sizeKey] || 7;
    const sizePt = sizeCm * CM_TO_PT;

    const quantity = slots.length;

    // How many fit per row/col
    const cols = Math.floor((A4_W - 2 * MARGIN + GAP) / (sizePt + GAP));
    const rows = Math.floor((A4_H - 2 * MARGIN + GAP) / (sizePt + GAP));
    const perPage = cols * rows;
    const totalPages = Math.ceil(quantity / perPage);

    // Center the grid on the page
    const gridW = cols * sizePt + (cols - 1) * GAP;
    const gridH = rows * sizePt + (rows - 1) * GAP;
    const offsetX = (A4_W - gridW) / 2;
    const offsetY = (A4_H - gridH) / 2;

    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let placed = 0;
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage({ size: 'A4', margin: 0 });

      for (let row = 0; row < rows && placed < quantity; row++) {
        for (let col = 0; col < cols && placed < quantity; col++) {
          const x = offsetX + col * (sizePt + GAP);
          const y = offsetY + row * (sizePt + GAP);

          // Light cut line border
          doc.save();
          doc.rect(x, y, sizePt, sizePt)
            .dash(3, { space: 3 })
            .strokeColor('#cccccc')
            .stroke();
          doc.restore();

          // Place sticker image — each slot can reference a different image
          const imgIdx = slots[placed];
          doc.image(imageBuffers[imgIdx], x + 2, y + 2, {
            fit: [sizePt - 4, sizePt - 4],
            align: 'center',
            valign: 'center'
          });

          placed++;
        }
      }
    }

    doc.end();
  });
}

// Helper: parse a data-URL into { buffer, ext, base64 }
function parseDataURL(dataUrl) {
  const m = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) return null;
  return { ext: m[1] === 'jpeg' ? 'jpg' : m[1], base64: m[2], buffer: Buffer.from(m[2], 'base64') };
}

const SHEET_PRICE_USD = process.env.SHEET_PRICE_USD || '4.00';
const SHEET_PRICE_CRC = '2,000';
const PAYPAL_CURRENCY = process.env.PAYPAL_CURRENCY || 'USD';
const PAYPAL_MODE = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
const capturedPaypalOrders = new Set();
let paypalToken = { value: null, expiresAt: 0 };

function paypalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

function paypalApiBase() {
  return PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function paypalAccessToken() {
  if (paypalToken.value && Date.now() < paypalToken.expiresAt) return paypalToken.value;
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'PayPal auth failed');
  }
  paypalToken = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max(30, (data.expires_in || 300) - 60) * 1000
  };
  return paypalToken.value;
}

async function paypalRequest(pathname, { method = 'GET', body } = {}) {
  const token = await paypalAccessToken();
  const res = await fetch(`${paypalApiBase()}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) {
    const detail = data.message || data.error_description || data.name || 'PayPal request failed';
    const err = new Error(detail);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

function paypalCaptureOk(order) {
  if (!order || order.status !== 'COMPLETED') return false;
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  const amount = capture?.amount;
  return capture?.status === 'COMPLETED'
    && amount?.currency_code === PAYPAL_CURRENCY
    && amount?.value === SHEET_PRICE_USD;
}

app.get('/api/paypal/config', (req, res) => {
  res.json({
    enabled: paypalConfigured(),
    clientId: paypalConfigured() ? process.env.PAYPAL_CLIENT_ID : null,
    mode: PAYPAL_MODE,
    currency: PAYPAL_CURRENCY,
    amount: SHEET_PRICE_USD,
    displayPrice: SHEET_PRICE_CRC
  });
});

app.post('/api/paypal/create-order', async (req, res) => {
  if (!paypalConfigured()) {
    return res.status(503).json({ error: 'PayPal is not configured' });
  }
  try {
    const order = await paypalRequest('/v2/checkout/orders', {
      method: 'POST',
      body: {
        intent: 'CAPTURE',
        purchase_units: [{
          description: 'Sticker Studio A4 sheet',
          amount: { currency_code: PAYPAL_CURRENCY, value: SHEET_PRICE_USD }
        }],
        application_context: {
          shipping_preference: 'NO_SHIPPING'
        }
      }
    });
    res.json({ id: order.id });
  } catch (err) {
    console.error('PayPal create-order failed:', err.message);
    res.status(err.status || 502).json({ error: 'Could not start PayPal checkout' });
  }
});

app.post('/api/paypal/capture-order', async (req, res) => {
  if (!paypalConfigured()) {
    return res.status(503).json({ error: 'PayPal is not configured' });
  }
  const orderID = typeof req.body?.orderID === 'string' ? req.body.orderID.trim() : '';
  if (!orderID) return res.status(400).json({ error: 'Missing orderID' });
  try {
    const order = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
      method: 'POST'
    });
    if (!paypalCaptureOk(order)) {
      return res.status(402).json({ error: 'Payment was not completed' });
    }
    res.json({ id: order.id, status: order.status });
  } catch (err) {
    console.error('PayPal capture-order failed:', err.message);
    res.status(err.status || 502).json({ error: 'Could not capture PayPal payment' });
  }
});

// API endpoint to submit order
app.post('/api/order', async (req, res) => {
  try {
    const { customerEmail, size, total } = req.body;
    const paypalOrderId = typeof req.body?.paypalOrderId === 'string'
      ? req.body.paypalOrderId.trim()
      : '';

    if (paypalConfigured()) {
      if (!paypalOrderId) {
        return res.status(402).json({ error: 'Payment required' });
      }
      if (capturedPaypalOrders.has(paypalOrderId)) {
        return res.status(409).json({ error: 'This payment was already used' });
      }
      const paid = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`);
      if (!paypalCaptureOk(paid)) {
        return res.status(402).json({ error: 'Payment was not completed' });
      }
      capturedPaypalOrders.add(paypalOrderId);
    }

    // Determine if this is a sheet order (new format) or legacy single-image order
    const isSheet = req.body.type === 'sheet';

    let images, slots, descriptions, quantity, prompt, style;
    if (isSheet) {
      images = req.body.images;           // array of data-URLs (unique)
      slots = req.body.slots;             // indices into images
      descriptions = req.body.descriptions || [];
      quantity = req.body.totalSlots || slots.length;
    } else {
      // Legacy format — single image tiled
      const img = req.body.image;
      images = img ? [img] : [];
      quantity = req.body.quantity || 1;
      slots = Array.from({ length: quantity }, () => 0);
      prompt = req.body.prompt;
      style = req.body.style;
      descriptions = [prompt || 'Custom upload'];
    }

    console.log('New order received:', {
      type: isSheet ? 'sheet' : 'legacy',
      designs: images.length,
      slots: slots.length,
      size,
      total,
      customerEmail,
      descriptions,
      timestamp: new Date().toISOString()
    });

    // Respond immediately so the customer isn't waiting
    res.json({ success: true, message: 'Order received!' });

    // Send emails in the background via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const attachments = [];
        const imageBuffers = [];

        // Parse each unique image, attach originals, collect buffers for PDF
        images.forEach((dataUrl, i) => {
          const parsed = parseDataURL(dataUrl);
          if (parsed) {
            imageBuffers.push(parsed.buffer);
            attachments.push({
              filename: `sticker-${i + 1}-${Date.now()}.${parsed.ext}`,
              content: parsed.base64
            });
          }
        });

        // Generate and attach print-ready PDF
        if (imageBuffers.length > 0) {
          try {
            console.log('Generating print PDF...');
            const pdfBuffer = await generatePrintPDF(imageBuffers, size, slots);
            attachments.push({
              filename: `print-ready-${slots.length}x-${size.replace(/[^a-zA-Z0-9]/g, '')}.pdf`,
              content: pdfBuffer.toString('base64')
            });
            console.log('Print PDF generated');
          } catch (pdfErr) {
            console.error('PDF generation failed:', pdfErr.message);
          }
        }

        const designList = descriptions.join(', ');
        const subjectLine = isSheet
          ? `New Sheet Order - ${images.length} designs, ${slots.length} stickers`
          : `New Sticker Order - ${size} x ${quantity}`;

        if (process.env.BUSINESS_EMAIL) {
          try {
            console.log('Sending shop order email to:', process.env.BUSINESS_EMAIL);
            await sendResendEmail({
              to: process.env.BUSINESS_EMAIL,
              subject: subjectLine,
              html: `
              <h2>New Sticker Order!</h2>
              <p><strong>Type:</strong> ${isSheet ? 'Mixed Sheet' : 'Single Design'}</p>
              <p><strong>Designs:</strong> ${escapeHtml(designList)}</p>
              <p><strong>Size:</strong> ${escapeHtml(size)}</p>
              <p><strong>Stickers on sheet:</strong> ${slots.length}</p>
              <p><strong>Total:</strong> ₡${escapeHtml(total)}${paypalConfigured() ? ` (paid ${PAYPAL_CURRENCY})` : ''}</p>
              ${paypalOrderId ? `<p><strong>PayPal order:</strong> ${escapeHtml(paypalOrderId)}</p>` : ''}
              <p><strong>Customer Email:</strong> ${escapeHtml(customerEmail)}</p>
              <p><strong>Time:</strong> ${escapeHtml(new Date().toLocaleString())}</p>
              <hr>
              <p>Attachments: ${imageBuffers.length} original image(s) + print-ready PDF (A4, tiled with cut lines)</p>
            `,
              attachments
            });
            console.log('Shop order email sent');
          } catch (shopErr) {
            console.error('Shop email failed:', shopErr.message);
          }
        }

        const buyer = normalizeEmail(customerEmail);
        if (buyer) {
          try {
            console.log('Sending customer confirmation');
            await sendResendEmail({
              to: buyer,
              subject: 'We got your Sticker Studio sheet',
              html: `
              <p>Paid. We have your A4 sheet.</p>
              <p><strong>Size:</strong> ${escapeHtml(size)}</p>
              <p><strong>On the sheet:</strong> ${slots.length}</p>
              <p><strong>Total:</strong> ₡${escapeHtml(total)}${paypalConfigured() ? ` · $${SHEET_PRICE_USD} USD` : ''}</p>
              <p>We print it in Costa Rica and will email this same address when it is moving.</p>
              <p>Sticker Studio</p>
            `
            });
            console.log('Customer confirmation sent');
          } catch (buyerErr) {
            console.error('Customer email failed:', buyerErr.message);
          }
        }
      } catch (emailErr) {
        console.error('Email send failed:', emailErr.message);
      }
    }
  } catch (error) {
    console.error('Order error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Sticker Studio running on port ${PORT}`);
});

// Graceful shutdown for Railway deploys
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});
