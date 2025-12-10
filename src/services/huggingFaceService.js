// Using Inference Providers API directly to avoid CORS issues
// The API key should be set in environment variables
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN || ''

if (!HF_TOKEN) {
  console.warn('⚠️ VITE_HF_TOKEN not found in environment variables. API calls will fail.')
}

// Inference Providers API base URL
const INFERENCE_PROVIDERS_BASE = 'https://api-inference.huggingface.co'

/**
 * Transcribe animal sound audio to text using speech-to-text model
 * @param {Blob} audioBlob - The recorded audio blob
 * @returns {Promise<string>} - The transcribed text
 */
export async function transcribeAnimalSound(audioBlob) {
  try {
    if (!HF_TOKEN) {
      throw new Error('Hugging Face token is required. Please set VITE_HF_TOKEN in your .env file.')
    }

    // Hugging Face Inference API expects raw audio data, not FormData
    // Convert blob to ArrayBuffer for sending as binary data
    const audioArrayBuffer = await audioBlob.arrayBuffer()

    // Try models in order of preference, with fallbacks
    // Note: OpenAI Whisper models may not be available on serverless Inference API
    // Using alternative models that are more likely to be available
    // Check https://huggingface.co/models?pipeline_tag=automatic-speech-recognition&inference=true
    // to see which models have Inference API enabled
    const models = [
      'zai-org/GLM-ASR-Nano-2512', // Alternative ASR model that may be available
      'facebook/wav2vec2-base-960h', // Wav2Vec2 model
      'jonatasgrosman/wav2vec2-large-xlsr-53-english', // Alternative Wav2Vec2
      'openai/whisper-small', // Try Whisper as fallback
      'openai/whisper-base',
      'openai/whisper-medium'
    ]

    let lastError = null
    const errors = []

    for (const modelId of models) {
      try {
        const apiUrl = `${INFERENCE_PROVIDERS_BASE}/models/${modelId}`

        // Try both binary and FormData formats
        let response
        let usedFormData = false

        // First try: Direct API call with binary data
        try {
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HF_TOKEN}`,
              'Content-Type': 'application/octet-stream',
            },
            body: audioArrayBuffer,
          })
        } catch (corsError) {
          // If direct call fails due to CORS, use proxy
          console.log('Direct API call failed, using proxy:', corsError.message)
          try {
            response = await fetch(
              `/api/hf-inference/models/${modelId}`,
              {
                method: 'POST',
                headers: {
                  'X-HF-Token': HF_TOKEN,
                  'Content-Type': 'application/octet-stream',
                },
                body: audioArrayBuffer,
              }
            )
          } catch (proxyError) {
            // If binary fails, try FormData format
            console.log('Binary format failed, trying FormData:', proxyError.message)
            usedFormData = true
            const formData = new FormData()
            formData.append('file', audioBlob, 'audio.webm')

            try {
              response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${HF_TOKEN}`,
                },
                body: formData,
              })
            } catch (formCorsError) {
              response = await fetch(
                `/api/hf-inference/models/${modelId}`,
                {
                  method: 'POST',
                  headers: {
                    'X-HF-Token': HF_TOKEN,
                  },
                  body: formData,
                }
              )
            }
          }
        }

        if (!response.ok) {
          // Get error details for logging
          const errorData = await response.json().catch(() => {
            // If JSON parsing fails, try to get text
            return response.text().then(text => ({ raw: text })).catch(() => ({}))
          })

          console.error(`Model ${modelId} failed:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            format: usedFormData ? 'FormData' : 'Binary'
          })

          // Handle model loading (503) - model might need to be loaded first
          if (response.status === 503) {
            const estimatedTime = errorData.estimated_time || 20
            // If it's the first model and it's loading, wait and retry
            if (modelId === models[0]) {
              throw new Error(`Model is loading. Please wait ${Math.ceil(estimatedTime)} seconds and try again.`)
            }
            // Otherwise, try next model
            const errorMsg = `Model ${modelId} is loading (503)`
            errors.push(errorMsg)
            lastError = new Error(errorMsg)
            continue
          }

          // Handle 410 Gone - try next model
          if (response.status === 410) {
            const errorMsg = `Model ${modelId} is no longer available (410 Gone)`
            console.warn(`${errorMsg}, trying next model...`)
            errors.push(errorMsg)
            lastError = new Error(errorMsg)
            continue
          }

          // Handle 404 - model not found
          if (response.status === 404) {
            const errorMsg = `Model ${modelId} not found (404) - may not be available on Inference API`
            errors.push(errorMsg)
            lastError = new Error(errorMsg)
            continue
          }

          // For other errors, try next model unless it's auth-related
          if (response.status === 401 || response.status === 403) {
            throw new Error(errorData.error || errorData.message || 'Authentication failed. Please check your VITE_HF_TOKEN.')
          }

          // Try next model for other errors
          const errorMsg = errorData.error || errorData.message || errorData.raw || `API request failed with status ${response.status}`
          errors.push(`${modelId} (${response.status}): ${errorMsg}`)
          lastError = new Error(errorMsg)
          continue
        }

        const result = await response.json()

        // The API returns either a string or an object with text property
        if (typeof result === 'string') {
          return result
        }
        const transcribedText = result?.text || result?.transcription
        if (transcribedText) {
          return transcribedText
        }

        // If no text found, try next model
        const errorMsg = 'No transcription text in response'
        errors.push(`${modelId}: ${errorMsg}`)
        lastError = new Error(errorMsg)
        continue
      } catch (error) {
        // If it's not a model-specific error, throw it
        if (error.message.includes('Authentication') || error.message.includes('loading')) {
          throw error
        }
        errors.push(`${modelId}: ${error.message}`)
        lastError = error
        continue
      }
    }

    // If all models failed, check if they're all 410 errors (deprecated)
    const all410 = errors.length > 0 && errors.every(e => e.includes('410') || e.includes('Gone'))

    if (all410) {
      // All models are deprecated - provide specific guidance
      // Don't throw error, let the fallback handle it
      console.warn(
        'All speech recognition models are no longer available on the serverless Inference API (410 Gone).\n' +
        'The OpenAI Whisper models have been removed from the free serverless Inference API.\n\n' +
        'The app will use a mock transcription. To use real transcription:\n' +
        '1. Visit https://huggingface.co/models?pipeline_tag=automatic-speech-recognition&inference=true\n' +
        '2. Find models with the yellow lightning bolt (Inference API available)\n' +
        '3. Update the models array in huggingFaceService.js\n' +
        '4. Or use Hugging Face Inference Endpoints (paid service)'
      )
      // Return null to trigger fallback
      return null
    }

    // If all models failed with other errors, provide a comprehensive error message
    let errorSummary = 'All transcription models failed'
    if (errors.length > 0) {
      errorSummary = `All transcription models failed.\n\nModels tried: ${models.join(', ')}\n\nErrors encountered:\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}\n\nPossible causes:\n- Models may not be available on the serverless Inference API\n- Your API token may need additional permissions\n- Models may need to be explicitly enabled for your account\n- The models may have been moved or deprecated\n\nTroubleshooting steps:\n1. Check your VITE_HF_TOKEN is valid and starts with "hf_"\n2. Verify your token has "Inference API" permissions at https://huggingface.co/settings/tokens\n3. Check your account has Inference API access at https://huggingface.co/settings/billing\n4. Visit https://huggingface.co/models?pipeline_tag=automatic-speech-recognition&inference=true to find available models\n5. Check the browser console for detailed error logs`
    }
    throw new Error(errorSummary)
  } catch (error) {
    console.error('Error transcribing audio:', error)
    throw new Error(`Transcription failed: ${error.message}`)
  }
}

/**
 * Translate/interpret animal sound using LLM
 * @param {string} transcribedText - The transcribed text from the audio
 * @param {string} animalName - The name of the animal
 * @returns {Promise<{text: string, confidence: number}>} - The translation result
 */
export async function translateAnimalSound(transcribedText, animalName) {
  try {
    if (!HF_TOKEN) {
      throw new Error('Hugging Face token is required. Please set VITE_HF_TOKEN in your .env file.')
    }

    const prompt = `Translate this ${animalName} sound directly into human speech: "${transcribedText}"

Speak AS the ${animalName} - write what they are saying in first person, directly and naturally. Do not explain or interpret. Just translate their sound into what they would say in human words. Be creative, fun, and empathetic. Keep it to 1-2 sentences.`

    // Try multiple models in order of preference
    const models = [
      'meta-llama/Llama-3.1-8B-Instruct', // Try without "Meta-" prefix
      'meta-llama/Meta-Llama-3.1-8B-Instruct', // Original format
      'mistralai/Mistral-7B-Instruct-v0.2', // Alternative model
      'mistralai/Mixtral-8x7B-Instruct-v0.1', // Another alternative
      'google/gemma-2-2b-it', // Smaller alternative
    ]

    let lastError = null
    const errors = []

    for (const modelId of models) {
      try {
        // Use Inference Providers router endpoint for chat completions
        const response = await fetch(
          'https://router.huggingface.co/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HF_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelId,
              messages: [
                {
                  role: 'system',
                  content: 'You translate animal sounds directly into human speech. Speak as the animal in first person. Do not add explanations, greetings, or meta-commentary. Just translate the sound into what the animal is saying.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 150,
              temperature: 0.8,
            }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMsg = errorData.error?.message || `API request failed with status ${response.status}`

          // If model doesn't exist, try next one
          if (response.status === 404 || errorMsg.includes('does not exist')) {
            errors.push(`${modelId}: ${errorMsg}`)
            lastError = new Error(errorMsg)
            continue
          }

          // For other errors, throw immediately
          throw new Error(errorMsg)
        }

        const result = await response.json()
        const translationText = result.choices?.[0]?.message?.content ||
          `The ${animalName} seems to be communicating something, but I couldn't interpret it clearly.`

        // Calculate a mock confidence score (you could enhance this with actual model confidence)
        const confidence = Math.min(0.95, 0.7 + Math.random() * 0.25)

        return {
          text: translationText,
          confidence: confidence,
          transcribedText: transcribedText
        }
      } catch (error) {
        // If it's a model-not-found error, try next model
        if (error.message.includes('does not exist') || error.message.includes('404')) {
          errors.push(`${modelId}: ${error.message}`)
          lastError = error
          continue
        }
        // For other errors, throw immediately
        throw error
      }
    }

    // If all models failed, provide helpful error message
    if (errors.length > 0) {
      throw new Error(
        `All translation models failed.\n\nModels tried: ${models.join(', ')}\n\nErrors:\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}\n\n` +
        `Please check:\n` +
        `1. Visit https://huggingface.co/chat/models to see available models\n` +
        `2. Update the models array in huggingFaceService.js with a working model\n` +
        `3. Verify your token has access to Inference Providers API`
      )
    }

    throw lastError || new Error('Translation failed: Unknown error')
  } catch (error) {
    console.error('Error translating animal sound:', error)
    throw new Error(`Translation failed: ${error.message}`)
  }
}

/**
 * Generate a mock transcription based on animal type
 * Used as fallback when API is unavailable
 */
function getMockTranscription(animalName) {
  const mockSounds = {
    'Dog': 'woof woof bark',
    'Cat': 'meow meow purr',
    'Bird': 'tweet chirp tweet',
    'Cow': 'moo moo',
    'Pig': 'oink oink snort',
    'Rooster': 'cock-a-doodle-doo',
    'Duck': 'quack quack',
    'Sheep': 'baa baa',
    'Horse': 'neigh whinny',
    'Lion': 'roar growl'
  }
  return mockSounds[animalName] || 'animal sound'
}

/**
 * Generate a mock translation based on animal type and transcription
 * Used as fallback when translation API is unavailable
 */
function getMockTranslation(animalName, transcribedText) {
  const translations = {
    'Dog': [
      `I'm so excited! Can we play now? I've been waiting!`,
      `Hey! I'm here and I want your attention!`,
      `I love you! Give me belly rubs please!`,
      `Something's happening! I need to protect you!`
    ],
    'Cat': [
      `I'm happy and content. Can I have some treats and scratches behind my ears?`,
      `I'm hungry! Where's my food?`,
      `I want attention right now. Pet me please!`,
      `I'm feeling playful! Let's have some fun together!`
    ],
    'Bird': [
      `Good morning! I'm singing my beautiful song for you!`,
      `Hey everyone! I'm here and I'm happy!`,
      `Listen to my lovely voice! I'm calling to my friends!`
    ],
    'Cow': [
      `Hello! I'm calling out to my friends in the field!`,
      `I'm content and happy here in the pasture!`
    ],
    'Pig': [
      `I'm so excited! Is it time for food?`,
      `I'm happy and want to play!`
    ],
    'Rooster': [
      `Wake up! It's morning time!`,
      `I'm announcing the new day!`
    ],
    'Duck': [
      `Hello! I'm here and I'm happy!`,
      `Let's go swimming together!`
    ],
    'Sheep': [
      `I'm calling to my flock!`,
      `I'm content and peaceful!`
    ],
    'Horse': [
      `I'm excited and ready to run!`,
      `Hello friend! Let's go on an adventure!`
    ],
    'Lion': [
      `I'm the king! Hear my powerful voice!`,
      `I'm calling to my pride!`
    ]
  }

  const options = translations[animalName] || [
    `I'm trying to tell you something important!`,
    `I'm expressing my feelings to you!`
  ]

  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Complete pipeline: Transcribe audio and translate it
 * @param {Blob} audioBlob - The recorded audio blob
 * @param {string} animalName - The name of the animal
 * @returns {Promise<{text: string, confidence: number, transcribedText: string}>}
 */
export async function processAnimalSound(audioBlob, animalName) {
  try {
    // Step 1: Transcribe the audio
    let transcribedText
    let isMockTranscription = false

    try {
      transcribedText = await transcribeAnimalSound(audioBlob)
      // If null is returned (all models deprecated), use mock
      if (!transcribedText) {
        transcribedText = getMockTranscription(animalName)
        isMockTranscription = true
      }
    } catch (transcriptionError) {
      // If transcription fails (e.g., all models unavailable), use mock transcription
      console.warn('Transcription API failed, using mock transcription:', transcriptionError.message)
      transcribedText = getMockTranscription(animalName)
      isMockTranscription = true
    }

    // Step 2: Translate/interpret the transcribed text
    let translation
    let isMockTranslation = false

    try {
      translation = await translateAnimalSound(transcribedText, animalName)
    } catch (translationError) {
      // If translation fails, use mock translation
      console.warn('Translation API failed, using mock translation:', translationError.message)
      const mockText = getMockTranslation(animalName, transcribedText)
      translation = {
        text: mockText,
        confidence: 0.6,
        transcribedText: transcribedText
      }
      isMockTranslation = true
    }

    return {
      ...translation,
      transcribedText: transcribedText,
      isMockTranscription: isMockTranscription,
      isMockTranslation: isMockTranslation
    }
  } catch (error) {
    console.error('Error processing animal sound:', error)
    throw error
  }
}

/**
 * Get available models for a specific task
 * This is a helper function to explore available models
 */
export async function getAvailableModels(task = 'automatic-speech-recognition') {
  try {
    // Note: This would require using the Hugging Face Hub API
    // For now, we'll use predefined models
    return {
      'automatic-speech-recognition': [
        'openai/whisper-large-v3',
        'facebook/wav2vec2-base-960h',
        'microsoft/speecht5_asr'
      ],
      'chat-completion': [
        'meta-llama/Meta-Llama-3.1-8B-Instruct',
        'mistralai/Mistral-7B-Instruct-v0.2',
        'google/gemma-2-2b-it'
      ]
    }
  } catch (error) {
    console.error('Error fetching models:', error)
    return {}
  }
}

