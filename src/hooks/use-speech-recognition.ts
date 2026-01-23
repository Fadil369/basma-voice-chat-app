import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

interface UseSpeechRecognitionReturn {
  transcript: string
  interimTranscript: string
  isListening: boolean
  isSupported: boolean
  startListening: (options?: { lang?: string }) => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
}

const isSpeechRecognitionSupported = () => {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )
}

export function useSpeechRecognition(
  options: SpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = 'ar-SA',
    continuous = true,
    interimResults = true,
    onResult,
    onError,
  } = options

  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported] = useState(isSpeechRecognitionSupported())

  const recognitionRef = useRef<any>(null)
  const currentLangRef = useRef(lang)

  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = currentLangRef.current
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: any) => {
      let interimText = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const resultTranscript = result[0].transcript

        if (result.isFinal) {
          finalText += resultTranscript + ' '
        } else {
          interimText += resultTranscript
        }
      }

      if (interimText) {
        setInterimTranscript(interimText)
        if (onResult) {
          onResult(interimText, false)
        }
      }

      if (finalText) {
        setTranscript((prev) => prev + finalText)
        setInterimTranscript('')
        if (onResult) {
          onResult(finalText.trim(), true)
        }
      }
    }

    recognition.onerror = (event: any) => {
      const errorMessage = `Speech recognition error: ${event.error}`
      setError(errorMessage)
      setIsListening(false)
      
      if (onError) {
        onError(event.error)
      }

      if (event.error === 'no-speech') {
        recognition.stop()
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognition.start()
            } catch (e) {
              console.error('Failed to restart recognition:', e)
            }
          }
        }, 100)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      
      if (recognitionRef.current && continuous) {
        try {
          recognition.start()
        } catch (e) {
          console.error('Recognition ended, could not restart:', e)
        }
      }
    }

    return recognition
  }, [isSupported, continuous, interimResults, onResult, onError])

  const startListening = useCallback(
    (opts?: { lang?: string }) => {
      if (!isSupported) {
        setError('Speech recognition is not supported in this browser')
        return
      }

      if (opts?.lang) {
        currentLangRef.current = opts.lang
      }

      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }

        recognitionRef.current = initializeRecognition()
        
        if (recognitionRef.current) {
          recognitionRef.current.start()
        }
      } catch (err: any) {
        setError(err.message)
        setIsListening(false)
      }
    },
    [isSupported, initializeRecognition]
  )

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        recognitionRef.current = null
        setIsListening(false)
      } catch (err: any) {
        console.error('Error stopping recognition:', err)
      }
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  }
}
