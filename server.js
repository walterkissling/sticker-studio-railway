const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Trust Railway's proxy so req.ip gives the real client IP
app.set('trust proxy', 1);

const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT) || 5;

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

function checkRateLimit(req, res) {
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

    // Content safety check
    if (!isPromptSafe(prompt)) {
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
    limit.used++;
    const remaining = Math.max(0, DAILY_LIMIT - limit.used);

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

    // Content safety check
    if (!isPromptSafe(editPrompt)) {
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
    limit.used++;
    const remaining = Math.max(0, DAILY_LIMIT - limit.used);

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
  const ip = getClientIP(req);
  const limit = getRateLimit(ip);
  const remaining = Math.max(0, DAILY_LIMIT - limit.used);
  res.json({ trialsRemaining: remaining });
});

// API endpoint to submit order
app.post('/api/order', async (req, res) => {
  try {
    const { prompt, style, size, quantity, total, image, customerEmail } = req.body;
    
    console.log('New order received:', {
      prompt,
      style,
      size,
      quantity,
      total,
      customerEmail,
      timestamp: new Date().toISOString()
    });

    // If nodemailer is configured, send email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.BUSINESS_EMAIL) {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Extract image data for attachment
      const attachments = [];
      if (image && image.startsWith('data:image/')) {
        const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          attachments.push({
            filename: `sticker-order-${Date.now()}.${ext}`,
            content: matches[2],
            encoding: 'base64',
            cid: 'stickerimage'
          });
        }
      }

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.BUSINESS_EMAIL,
        subject: `New Sticker Order - ${size} x ${quantity}`,
        html: `
          <h2>New Sticker Order!</h2>
          <p><strong>Design:</strong> ${prompt}</p>
          <p><strong>Style:</strong> ${style}</p>
          <p><strong>Size:</strong> ${size}</p>
          <p><strong>Quantity:</strong> ${quantity}</p>
          <p><strong>Total:</strong> $${total}</p>
          <p><strong>Customer Email:</strong> ${customerEmail || 'Not provided'}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          ${attachments.length ? '<hr><p><strong>Sticker Image:</strong></p><img src="cid:stickerimage" style="max-width:400px;border-radius:12px;">' : ''}
        `,
        attachments
      });
    }

    res.json({ success: true, message: 'Order received!' });
  } catch (error) {
    console.error('Order error:', error);
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

app.listen(PORT, () => {
  console.log(`🚀 Sticker Studio running on port ${PORT}`);
  console.log(`   Open http://localhost:${PORT} in your browser`);
});
