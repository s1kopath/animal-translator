# 🐾 Animal Translator

A fun and interactive web app that translates animal voices using AI. Record an animal's sound and discover what they're saying!

## Features

- 🎨 Beautiful, modern UI with playful design
- 🎤 Voice recording functionality
- 🐕 Support for multiple animals (Dog, Cat, Bird, Cow, Pig, and more)
- 🤖 AI-powered translation using Hugging Face Inference Providers
- 🎯 Speech-to-text transcription with Whisper
- 💬 LLM-powered interpretation of animal sounds
- 📱 Responsive design that works on all devices

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your Hugging Face API token:
   - Create a Hugging Face account at [huggingface.co](https://huggingface.co)
   - Go to [Settings > Tokens](https://huggingface.co/settings/tokens)
   - Create a new **fine-grained token** with `Make calls to Inference Providers` permission
   - Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   - Add your token to `.env`:
   ```
   VITE_HF_TOKEN=your_token_here
   ```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
animal-translator/
├── src/
│   ├── components/
│   │   ├── AnimalSelector.jsx    # Animal selection interface
│   │   ├── VoiceRecorder.jsx     # Audio recording component
│   │   ├── TranslationDisplay.jsx # Translation results display
│   │   └── Header.jsx            # App header
│   ├── services/
│   │   └── huggingFaceService.js  # Hugging Face API integration
│   ├── App.jsx                   # Main app component
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── .env.example                  # Environment variables template
├── index.html
├── package.json
└── vite.config.js
```

## Technology Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **MediaRecorder API** - Audio recording
- **Hugging Face Inference Providers** - AI-powered speech-to-text and translation
  - Speech-to-text: `openai/whisper-large-v3`
  - LLM: `meta-llama/Meta-Llama-3.1-8B-Instruct`

## How It Works

1. **Record Audio**: User records an animal sound using the browser's microphone
2. **Transcribe**: Audio is sent to Hugging Face's Whisper model for speech-to-text transcription
3. **Translate**: The transcribed text is interpreted by an LLM (Meta Llama) to understand what the animal might be saying
4. **Display**: Results show both the transcription and the creative interpretation

## API Configuration

The app uses [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) which provides:
- Access to multiple AI providers through a single API
- Automatic failover and provider selection
- Cost-effective pricing with a generous free tier

### Customizing Models

You can change the models used in `src/services/huggingFaceService.js`:

- **Speech-to-text models**: `openai/whisper-large-v3`, `facebook/wav2vec2-base-960h`
- **LLM models**: `meta-llama/Meta-Llama-3.1-8B-Instruct`, `mistralai/Mistral-7B-Instruct-v0.2`

## Future Enhancements

- [x] Integrate Hugging Face API for real translations
- [ ] Add audio playback functionality
- [ ] Support for more animal types
- [ ] Save translation history
- [ ] Share translations on social media
- [ ] Mobile app version
- [ ] Model selection UI
- [ ] Audio visualization during recording

## License

MIT

