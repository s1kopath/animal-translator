import { useState, useEffect, useRef } from 'react'

function TranslationDisplay({ translation, isTranslating, animal }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const synthRef = useRef(null)

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handlePlayTranslation = () => {
    if (!translation?.text) return

    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support text-to-speech. Please use a modern browser like Chrome, Firefox, or Safari.')
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    // Create a new speech utterance
    const utterance = new SpeechSynthesisUtterance(translation.text)

    // Configure voice settings
    utterance.rate = 1.0 // Normal speed
    utterance.pitch = 1.0 // Normal pitch
    utterance.volume = 1.0 // Full volume

    // Try to use a pleasant English voice if available
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      const preferredVoice = voices.find(voice =>
        (voice.name.includes('Google') ||
          voice.name.includes('Samantha') ||
          voice.name.includes('Alex') ||
          voice.name.includes('Karen') ||
          voice.name.includes('Daniel')) &&
        voice.lang.startsWith('en')
      ) || voices.find(voice => voice.lang.startsWith('en'))

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
    }

    // Handle speech events
    utterance.onstart = () => {
      setIsPlaying(true)
    }

    utterance.onend = () => {
      setIsPlaying(false)
    }

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error)
      setIsPlaying(false)
      alert('Could not play translation. Please check your browser settings.')
    }

    // Start speaking
    window.speechSynthesis.speak(utterance)
    synthRef.current = utterance
  }

  const handleStopPlayback = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  const handleCopyText = () => {
    if (translation?.text) {
      navigator.clipboard.writeText(translation.text)
      // You could add a toast notification here
      alert('Translation copied to clipboard!')
    }
  }

  // Load voices when component mounts
  useEffect(() => {
    // Some browsers load voices asynchronously
    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }
    loadVoices()
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // Stop speech when translation changes
  useEffect(() => {
    if (translation) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
    }
  }, [translation])
  if (isTranslating) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin text-6xl mb-4">
          🌀
        </div>
        <p className="text-xl text-gray-600 font-semibold">
          Analyzing {animal?.name}'s voice...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This may take a few seconds
        </p>
      </div>
    )
  }

  if (!translation) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-start space-x-4">
          <div className="text-4xl">{animal?.emoji}</div>
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-2 font-semibold">
              Translation:
            </div>
            <div className="text-xl text-gray-800 leading-relaxed">
              {translation.text}
            </div>
            {translation.transcribedText && (
              <div className="mt-4 pt-4 border-t border-purple-300">
                <div className="text-xs text-gray-500 mb-1 font-semibold">
                  Transcribed Sound:
                </div>
                <div className="text-sm text-gray-600 italic">
                  "{translation.transcribedText}"
                </div>
              </div>
            )}
            {translation.isMockTranscription && (
              <div className="mt-3 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded">
                ℹ️ Using mock transcription. Speech recognition models are unavailable on the Inference API. Visit <a href="https://huggingface.co/models?pipeline_tag=automatic-speech-recognition&inference=true" target="_blank" rel="noopener noreferrer" className="underline">Hugging Face Models</a> to find available models.
              </div>
            )}
            {translation.isMockTranslation && (
              <div className="mt-3 text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded">
                ℹ️ Using mock translation. Translation models are unavailable. Visit <a href="https://huggingface.co/chat/models" target="_blank" rel="noopener noreferrer" className="underline">Hugging Face Chat Models</a> to find available models.
              </div>
            )}
            {translation.isFallback && (
              <div className="mt-3 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded">
                ⚠️ Using fallback translation. Check your API configuration.
              </div>
            )}
          </div>
        </div>
      </div>

      {translation.confidence && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <span className="text-sm text-gray-600 font-medium">
            Confidence Level:
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-48 bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${translation.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-semibold text-gray-700 w-12 text-right">
              {Math.round(translation.confidence * 100)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        {isPlaying ? (
          <button
            onClick={handleStopPlayback}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="animate-pulse">⏹️</span>
            <span>Stop Playback</span>
          </button>
        ) : (
          <button
            onClick={handlePlayTranslation}
            disabled={!translation?.text || !('speechSynthesis' in window)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span>🔊</span>
            <span>Play Translation</span>
          </button>
        )}
        <button
          onClick={handleCopyText}
          disabled={!translation?.text}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span>📋</span>
          <span>Copy Text</span>
        </button>
      </div>
    </div>
  )
}

export default TranslationDisplay

