const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
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

const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT) || 5;
const ADMIN_IPS = (process.env.ADMIN_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);

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

function checkRateLimit(req, res) {
  if (isAdmin(req)) return { used: 0, skipCount: true };
  const ip = getClientIP(req);
  const limit = getRateLimit(ip);
  const remaining = Math.max(0, DAILY_LIMIT - limit.used);
  if (remaining <= 0) {
    const hoursLeft = Math.ceil((limit.resetAt - Date.now()) / (1000 * 60 * 60));
    res.status(429).json({
      error: `Daily limit reached (${DAILY_LIMIT} per day). Try again in ~${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}.`,
      trialsRemaining: 0
    });
    return null;
  }
  return limit;
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

// API endpoint to generate sticker using Gemini
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, style } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured. Add GEMINI_API_KEY to Railway variables.' });
    }

    // Content safety check (skip for admin)
    if (!isAdmin(req) && !isPromptSafe(prompt)) {
      return res.status(400).json({ error: 'Your prompt contains content that is not allowed. Please keep it family-friendly!' });
    }

    // Check IP rate limit
    const limit = checkRateLimit(req, res);
    if (!limit) return;

    const styleConfig = styles[style] || styles.realistic;
    
    // Build the full prompt
    const fullPrompt = `Generate an image of a sticker design: ${prompt}. 
Style: ${styleConfig.prompt}. 
Important: White background, die-cut sticker style, centered composition, high quality, vibrant colors, clean edges suitable for printing as a physical sticker. Must be family-friendly and safe for all ages. No violence, nudity, weapons, or offensive content.`;

    console.log('Generating image with Gemini:', fullPrompt);

    // Use Gemini's image generation
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"]
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    
    // Extract image from response
    let imageData = null;
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
          imageData = part.inlineData.data;
          break;
        }
      }
    }

    if (!imageData) {
      console.error('No image in Gemini response:', JSON.stringify(data).substring(0, 500));
      throw new Error('No image generated. Try a different prompt.');
    }

    // Count this generation
    if (!limit.skipCount) limit.used++;
    const remaining = limit.skipCount ? 999 : Math.max(0, DAILY_LIMIT - limit.used);

    res.json({
      image: `data:image/png;base64,${imageData}`,
      trialsRemaining: remaining
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

    // Check IP rate limit
    const limit = checkRateLimit(req, res);
    if (!limit) return;

    // Extract base64 data from data URL
    const base64Data = currentImage.replace(/^data:image\/\w+;base64,/, '');
    
    // Determine mime type
    let mimeType = 'image/png';
    if (currentImage.startsWith('data:image/jpeg')) {
      mimeType = 'image/jpeg';
    } else if (currentImage.startsWith('data:image/webp')) {
      mimeType = 'image/webp';
    }

    const fullPrompt = `Edit this sticker image: ${editPrompt}. 
Keep it as a sticker design with white background, die-cut style, centered composition, high quality, vibrant colors, clean edges suitable for printing. Must be family-friendly and safe for all ages. No violence, nudity, weapons, or offensive content.`;

    console.log('Editing image with Gemini:', fullPrompt);

    // Use Gemini with the image input for editing
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              },
              {
                text: fullPrompt
              }
            ]
          }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"]
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini edit error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    
    // Extract image from response
    let imageData = null;
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
          imageData = part.inlineData.data;
          break;
        }
      }
    }

    if (!imageData) {
      console.error('No image in Gemini edit response:', JSON.stringify(data).substring(0, 500));
      throw new Error('Could not edit image. Try different instructions.');
    }

    // Count this edit
    if (!limit.skipCount) limit.used++;
    const remaining = limit.skipCount ? 999 : Math.max(0, DAILY_LIMIT - limit.used);

    res.json({
      image: `data:image/png;base64,${imageData}`,
      trialsRemaining: remaining
    });

  } catch (error) {
    console.error('Edit error:', error);
    res.status(500).json({ error: error.message || 'Failed to edit image' });
  }
});

// API endpoint to get remaining generations
app.get('/api/trials/:sessionId', (req, res) => {
  if (isAdmin(req)) return res.json({ trialsRemaining: 999 });
  const ip = getClientIP(req);
  const limit = getRateLimit(ip);
  const remaining = Math.max(0, DAILY_LIMIT - limit.used);
  res.json({ trialsRemaining: remaining });
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

// API endpoint to submit order
app.post('/api/order', async (req, res) => {
  try {
    const { customerEmail, size, total } = req.body;

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

    // Send email in the background via Resend API
    if (process.env.RESEND_API_KEY && process.env.BUSINESS_EMAIL) {
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

        console.log('Sending order email to:', process.env.BUSINESS_EMAIL);
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Sticker Studio <onboarding@resend.dev>',
            to: [process.env.BUSINESS_EMAIL],
            subject: subjectLine,
            html: `
              <h2>New Sticker Order!</h2>
              <p><strong>Type:</strong> ${isSheet ? 'Mixed Sheet' : 'Single Design'}</p>
              <p><strong>Designs:</strong> ${designList}</p>
              <p><strong>Size:</strong> ${size}</p>
              <p><strong>Stickers on sheet:</strong> ${slots.length}</p>
              <p><strong>Total:</strong> ₡${total}</p>
              <p><strong>Customer Email:</strong> ${customerEmail}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <hr>
              <p>📎 <strong>Attachments:</strong> ${imageBuffers.length} original image(s) + print-ready PDF (A4, tiled with cut lines)</p>
            `,
            attachments
          })
        });
        const emailData = await emailRes.json();
        if (emailRes.ok) {
          console.log('Order email sent successfully:', emailData.id);
        } else {
          console.error('Email send failed:', emailData);
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
