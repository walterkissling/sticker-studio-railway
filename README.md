# Sticker Studio

AI-powered custom sticker design studio. Generate unique stickers using AI and sell them to customers!

## Features

- **8 Art Styles**: Realistic, Cartoon, Kawaii, Watercolor, 3D, Minimalist, Vintage, Neon
- **AI Image Generation**: Powered by Google Gemini
- **Image Editing**: Edit generated stickers with natural language instructions
- **Multiple Sizes**: Small (5x5cm), Medium (7x7cm), Large (10x10cm)
- **Free Trial System**: 3 free generations per user
- **Automatic Pricing**: Based on your paper costs and markup
- **Order Management**: Email notifications for new orders

## Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" > "Deploy from GitHub repo"
4. Select this repository
5. Add the `GEMINI_API_KEY` environment variable in Railway (see below)
6. Railway auto-detects Node.js and deploys!

### Required Environment Variables (set in Railway)

- `GEMINI_API_KEY` - Get free at https://aistudio.google.com/app/apikey

### Optional Environment Variables

- `EMAIL_USER` - Gmail address for sending order notifications
- `EMAIL_PASS` - Gmail App Password (https://myaccount.google.com/apppasswords)
- `BUSINESS_EMAIL` - Email address to receive order notifications

## Pricing Setup

In the app's Business Settings:
- **Paper Cost / Sheet**: Your cost for A4 sticker paper
- **Base Price / Sticker**: Your profit margin per sticker

Paper capacity (A4: 21x29.7cm):
- Small (5x5cm): ~24 per sheet
- Medium (7x7cm): ~12 per sheet
- Large (10x10cm): ~6 per sheet
