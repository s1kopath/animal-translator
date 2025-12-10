function TranslationDisplay({ translation, isTranslating, animal }) {
  const handleCopyText = () => {
    if (translation?.text) {
      navigator.clipboard.writeText(translation.text)
      // You could add a toast notification here
      alert('Translation copied to clipboard!')
    }
  }
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
        <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200">
          🔊 Play Translation
        </button>
        <button
          onClick={handleCopyText}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          📋 Copy Text
        </button>
      </div>
    </div>
  )
}

export default TranslationDisplay

