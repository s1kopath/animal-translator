import { useState } from 'react'
import AnimalSelector from './components/AnimalSelector'
import VoiceRecorder from './components/VoiceRecorder'
import TranslationDisplay from './components/TranslationDisplay'
import Header from './components/Header'
import { processAnimalSound } from './services/huggingFaceService'

function App() {
  console.log('App component rendering...')
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [translation, setTranslation] = useState(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState(null)

  const handleAnimalSelect = (animal) => {
    setSelectedAnimal(animal)
    setTranslation(null) // Reset translation when animal changes
  }

  const handleRecordingStart = () => {
    setIsRecording(true)
    setTranslation(null)
  }

  const handleRecordingStop = async (audioBlob) => {
    setIsRecording(false)
    setIsTranslating(true)
    setError(null)

    try {
      // Process the audio through Hugging Face API
      const result = await processAnimalSound(audioBlob, selectedAnimal?.name)

      setTranslation({
        text: result.text,
        confidence: result.confidence,
        transcribedText: result.transcribedText,
        isMockTranscription: result.isMockTranscription || false,
        isMockTranslation: result.isMockTranslation || false
      })
    } catch (err) {
      console.error('Translation error:', err)
      setError(err.message || 'Failed to translate animal sound. Please check your API token and try again.')

      // Fallback to placeholder if API fails
      setTranslation({
        text: `[Fallback] The ${selectedAnimal?.name} said: "${getPlaceholderTranslation(selectedAnimal?.name)}"`,
        confidence: 0.5,
        isFallback: true
      })
    } finally {
      setIsTranslating(false)
    }
  }

  const getPlaceholderTranslation = (animalName) => {
    const translations = {
      'Dog': 'Woof woof! I want to play!',
      'Cat': 'Meow meow! Feed me now!',
      'Bird': 'Tweet tweet! Beautiful day!',
      'Cow': 'Moo moo! Time for grass!',
      'Pig': 'Oink oink! I love mud!',
      'Rooster': 'Cock-a-doodle-doo! Morning time!',
      'Duck': 'Quack quack! Water is nice!',
      'Sheep': 'Baa baa! I need a haircut!',
      'Horse': 'Neigh neigh! Let\'s run!',
      'Lion': 'Roar! I\'m the king!'
    }
    return translations[animalName] || 'Making animal sounds!'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            🐾 Animal Translator
          </h1>
          <p className="text-lg text-gray-600">
            Record an animal's voice and discover what they're saying!
          </p>
        </div>

        <div className="space-y-8">
          {/* Animal Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Step 1: Choose an Animal
            </h2>
            <AnimalSelector
              selectedAnimal={selectedAnimal}
              onSelect={handleAnimalSelect}
            />
          </div>

          {/* Voice Recording */}
          {selectedAnimal && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Step 2: Record {selectedAnimal.name}'s Voice
              </h2>
              <VoiceRecorder
                animal={selectedAnimal}
                isRecording={isRecording}
                onRecordingStart={handleRecordingStart}
                onRecordingStop={handleRecordingStop}
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-2">Translation Error</h3>
                  <div className="text-red-700 text-sm whitespace-pre-wrap font-mono text-xs bg-red-100 p-3 rounded mb-3 max-h-60 overflow-y-auto">
                    {error}
                  </div>
                  <div className="text-red-600 text-xs space-y-1">
                    <p className="font-semibold">Troubleshooting:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Make sure you've set <code className="bg-red-200 px-1 rounded">VITE_HF_TOKEN</code> in your <code className="bg-red-200 px-1 rounded">.env</code> file</li>
                      <li>Verify your token has "Inference API" permissions at{' '}
                        <a
                          href="https://huggingface.co/settings/tokens"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Hugging Face Settings
                        </a>
                      </li>
                      <li>Check the browser console (F12) for detailed error logs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Translation Display */}
          {(translation || isTranslating) && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Step 3: Translation
              </h2>
              <TranslationDisplay
                translation={translation}
                isTranslating={isTranslating}
                animal={selectedAnimal}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-8 text-gray-600">
        <p>Made with ❤️ for animal lovers everywhere</p>
      </footer>
    </div>
  )
}

export default App

