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

// Store for rate limiting free trials (in production, use Redis or database)
const trialStore = new Map();

// Get or create trial count for a session
function getTrials(sessionId) {
  if (!trialStore.has(sessionId)) {
    trialStore.set(sessionId, { count: 3, lastReset: Date.now() });
  }
  const trial = trialStore.get(sessionId);
  // Reset trials after 24 hours
  if (Date.now() - trial.lastReset > 24 * 60 * 60 * 1000) {
    trial.count = 3;
    trial.lastReset = Date.now();
  }
  return trial;
}

// Style configurations
const styles = {
  realistic: {
    prompt: 'photorealistic, highly detailed, professional photography, 8k uhd, sharp focus',
    negative: 'cartoon, anime, drawing, painting, sketch, illustration, blurry'
  },
  cartoon: {
    prompt: 'cartoon style, colorful, fun, animated, disney pixar style, vibrant',
    negative: 'realistic, photo, dark, scary, blurry'
  },
  kawaii: {
    prompt: 'kawaii style, cute, chibi, adorable, pastel colors, japanese cute aesthetic, rounded shapes',
    negative: 'realistic, scary, dark, adult, sharp edges'
  },
  watercolor: {
    prompt: 'watercolor painting, soft colors, artistic, delicate brushstrokes, fine art, painterly',
    negative: 'photo, digital, 3d render, sharp lines'
  },
  '3d': {
    prompt: '3d render, clay render, blender style, cute 3d character, smooth, rounded, soft lighting',
    negative: 'photo, flat, 2d, drawing, sketch'
  },
  minimalist: {
    prompt: 'minimalist design, simple shapes, clean lines, flat design, vector style, geometric',
    negative: 'complex, detailed, realistic, photo, textured'
  },
  vintage: {
    prompt: 'vintage style, retro, nostalgic, old fashioned, classic illustration, muted colors',
    negative: 'modern, digital, neon, bright'
  },
  neon: {
    prompt: 'neon lights, glowing, cyberpunk, vibrant neon colors, dark background with bright glow, synthwave',
    negative: 'daylight, natural, muted colors, pastel'
  }
};

// API endpoint to generate sticker
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, style, sessionId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check trials
    const trial = getTrials(sessionId || 'default');
    
    const styleConfig = styles[style] || styles.realistic;
    
    // Build the full prompt
    const fullPrompt = `sticker design of ${prompt}, ${styleConfig.prompt}, white background, die-cut sticker style, centered composition, high quality, vibrant colors, clean edges`;
    const negativePrompt = `${styleConfig.negative}, text, watermark, signature, blurry, bad quality, distorted, ugly, cropped, out of frame`;

    console.log('Generating image with prompt:', fullPrompt);

    // Try Hugging Face API (free, no key required for basic usage)
    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.HUGGINGFACE_API_KEY && {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
          })
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            negative_prompt: negativePrompt,
            num_inference_steps: 25,
            guidance_scale: 7.5,
            width: 512,
            height: 512
          }
        })
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('Hugging Face error:', hfResponse.status, errorText);
      
      // If model is loading, tell user to wait
      if (hfResponse.status === 503) {
        return res.status(503).json({ 
          error: 'Model is warming up. Please try again in 20-30 seconds.',
          retry: true 
        });
      }
      
      // Try backup model
      console.log('Trying backup model...');
      const backupResponse = await fetch(
        'https://router.huggingface.co/hf-inference/models/runwayml/stable-diffusion-v1-5',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.HUGGINGFACE_API_KEY && {
              'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
            })
          },
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              negative_prompt: negativePrompt,
              num_inference_steps: 25,
              guidance_scale: 7.5
            }
          })
        }
      );

      if (!backupResponse.ok) {
        if (backupResponse.status === 503) {
          return res.status(503).json({ 
            error: 'AI models are warming up. Please try again in 30 seconds.',
            retry: true 
          });
        }
        throw new Error('Image generation failed');
      }

      const backupBuffer = await backupResponse.buffer();
      const backupBase64 = backupBuffer.toString('base64');
      
      // Decrement trials
      if (trial.count > 0) trial.count--;
      
      return res.json({
        image: `data:image/png;base64,${backupBase64}`,
        trialsRemaining: trial.count
      });
    }

    // Get image buffer
    const imageBuffer = await hfResponse.buffer();
    const base64Image = imageBuffer.toString('base64');
    
    // Decrement trials
    if (trial.count > 0) trial.count--;

    res.json({
      image: `data:image/png;base64,${base64Image}`,
      trialsRemaining: trial.count
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

// API endpoint to get trial count
app.get('/api/trials/:sessionId', (req, res) => {
  const trial = getTrials(req.params.sessionId);
  res.json({ trialsRemaining: trial.count });
});

// API endpoint to submit order
app.post('/api/order', async (req, res) => {
  try {
    const { prompt, style, size, quantity, total, image, customerEmail } = req.body;
    
    // In production, you'd save this to a database and/or send emails
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
          ${image ? `<p><strong>Image:</strong></p><img src="${image}" style="max-width: 300px;" />` : ''}
        `
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
