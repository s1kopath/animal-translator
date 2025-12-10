import { useState, useRef, useEffect } from 'react'

function VoiceRecorder({ animal, isRecording, onRecordingStart, onRecordingStop }) {
  const [recordingTime, setRecordingTime] = useState(0)
  const [hasPermission, setHasPermission] = useState(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    // Request microphone permission
    let permissionStream = null
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        permissionStream = stream
        setHasPermission(true)
        // Stop the permission check stream immediately
        stream.getTracks().forEach(track => track.stop())
      })
      .catch(() => setHasPermission(false))

    // Cleanup function
    return () => {
      if (permissionStream) {
        permissionStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setRecordingTime(0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup: stop all tracks when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        streamRef.current = null
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      // Stop any existing MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch (e) {
          // Ignore errors if already stopped
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream // Store stream in ref
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Use the actual MIME type from MediaRecorder (varies by browser)
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })

        // Stop all tracks before calling onRecordingStop
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }

        // Call onRecordingStop after stopping tracks
        onRecordingStop(audioBlob)
      }

      // Start recording with timeslice to ensure continuous recording
      // timeslice of 1000ms means dataavailable event fires every second
      mediaRecorder.start(1000)

      // Then notify parent that recording has started
      // This ensures the button state updates immediately
      onRecordingStart()
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
      // Reset state on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop the MediaRecorder - the onstop handler will manage cleanup
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error)
        // If stopping fails, manually clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        // Create empty blob as fallback
        const emptyBlob = new Blob([], { type: 'audio/webm' })
        onRecordingStop(emptyBlob)
      }
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (hasPermission === false) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-xl border-2 border-red-200">
        <p className="text-red-600 font-semibold">
          ⚠️ Microphone permission is required to record animal sounds.
        </p>
        <p className="text-red-500 text-sm mt-2">
          Please enable microphone access in your browser settings.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">{animal.emoji}</div>
        <p className="text-lg text-gray-600">
          Get ready to record {animal.name}'s voice!
        </p>
      </div>

      <div className="flex items-center space-x-6">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="
              bg-gradient-to-r from-red-500 to-pink-500
              text-white font-bold py-4 px-8 rounded-full
              shadow-lg hover:shadow-xl transform hover:scale-105
              transition-all duration-200 flex items-center space-x-3
            "
          >
            <span className="text-2xl">🎤</span>
            <span>Start Recording</span>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="
              bg-gradient-to-r from-gray-600 to-gray-800
              text-white font-bold py-4 px-8 rounded-full
              shadow-lg hover:shadow-xl transform hover:scale-105
              transition-all duration-200 flex items-center space-x-3
            "
          >
            <span className="text-2xl animate-pulse">⏹️</span>
            <span>Stop Recording</span>
          </button>
        )}
      </div>

      {isRecording && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-red-100 px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-700 font-semibold">
              Recording: {formatTime(recordingTime)}
            </span>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 text-center max-w-md">
        💡 Tip: Make sure the animal is close enough for clear audio recording
      </div>
    </div>
  )
}

export default VoiceRecorder

