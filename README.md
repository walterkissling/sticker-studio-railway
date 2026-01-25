# ✨ Sticker Studio

AI-powered custom sticker design studio. Generate unique stickers using AI and sell them to customers!

## Features

- 🎨 **8 Art Styles**: Realistic, Cartoon, Kawaii, Watercolor, 3D, Minimalist, Vintage, Neon
- 🖼️ **AI Image Generation**: Powered by Stable Diffusion
- 📏 **Multiple Sizes**: Small (5×5cm), Medium (7×7cm), Large (10×10cm)
- 🎁 **Free Trial System**: 3 free generations per user
- 💰 **Automatic Pricing**: Based on your paper costs and markup
- 📧 **Order Management**: Email notifications for new orders

## Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select this repository
5. Railway auto-detects Node.js and deploys!

### Optional: Add Hugging Face API Key

For faster generation, add this environment variable in Railway:
- `HUGGINGFACE_API_KEY` - Get free at https://huggingface.co/settings/tokens

## Local Development

```bash
npm install
npm start
# Open http://localhost:3000
```

## Pricing Setup

In the app's Business Settings:
- **Paper Cost / Sheet**: Your cost for A4 sticker paper
- **Base Price / Sticker**: Your profit margin per sticker

Paper capacity (A4: 21×29.7cm):
- Small (5×5cm): ~24 per sheet
- Medium (7×7cm): ~12 per sheet  
- Large (10×10cm): ~6 per sheet
