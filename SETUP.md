# Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get your Hugging Face token:**
   - Sign up at [huggingface.co](https://huggingface.co) (free account works!)
   - Go to [Settings > Tokens](https://huggingface.co/settings/tokens)
   - Click "New token"
   - Select "Fine-grained token"
   - Give it a name (e.g., "Animal Translator")
   - Under "Permissions", check "Make calls to Inference Providers"
   - Click "Generate token"
   - Copy the token (you won't see it again!)

3. **Create `.env` file:**
   ```bash
   # In the root directory, create a file named .env
   # Add this line (replace with your actual token):
   VITE_HF_TOKEN=hf_your_token_here
   ```

4. **Start the app:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   - Navigate to `http://localhost:5173`
   - Allow microphone access when prompted
   - Select an animal and start recording!

## Troubleshooting

### "Translation Error" appears
- Make sure your `.env` file exists in the root directory
- Verify your token has "Make calls to Inference Providers" permission
- Check that the token starts with `hf_`
- Restart the dev server after creating/updating `.env`

### Microphone not working
- Check browser permissions for microphone access
- Make sure you're using HTTPS or localhost (required for microphone API)
- Try a different browser (Chrome, Firefox, Edge all work)

### API calls failing
- Verify your Hugging Face account has credits (free tier includes credits)
- Check the browser console for detailed error messages
- The app will show a fallback translation if the API fails

## Free Tier Limits

Hugging Face provides a generous free tier for Inference Providers. Check your usage at:
https://huggingface.co/settings/billing

