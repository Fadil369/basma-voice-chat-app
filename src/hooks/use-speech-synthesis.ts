import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechSynthesisOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

interface UseSpeechSynthesisReturn {
  speak: (text: string, options?: { lang?: string }) => void
  cancel: () => void
  pause: () => void
  resume: () => void
  isSpeaking: boolean
  isPaused: boolean
  isSupported: boolean
  voices: SpeechSynthesisVoice[]
  setVoice: (voice: SpeechSynthesisVoice | null) => void
  selectedVoice: SpeechSynthesisVoice | null
}

const isSpeechSynthesisSupported = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function useSpeechSynthesis(
  options: SpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const {
    lang = 'ar-SA',
    rate = 1,
    pitch = 1,
    volume = 1,
    onStart,
    onEnd,
    onError,
  } = options

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported] = useState(isSpeechSynthesisSupported())
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)

      const arabicVoice = availableVoices.find((voice) =>
        voice.lang.startsWith('ar')
      )
      const defaultVoice = arabicVoice || availableVoices[0]
      setSelectedVoice(defaultVoice || null)
    }

    loadVoices()
    
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [isSupported])

  const speak = useCallback(
    (text: string, speakOptions?: { lang?: string }) => {
      if (!isSupported) {
        console.warn('Speech synthesis is not supported')
        return
      }

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = speakOptions?.lang || lang
      utterance.rate = rate
      utterance.pitch = pitch
      utterance.volume = volume

      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      utterance.onstart = () => {
        setIsSpeaking(true)
        setIsPaused(false)
        if (onStart) onStart()
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        setIsPaused(false)
        if (onEnd) onEnd()
      }

      utterance.onerror = (event) => {
        setIsSpeaking(false)
        setIsPaused(false)
        const error = new Error(`Speech synthesis error: ${event.error}`)
        if (onError) onError(error)
      }

      utterance.onpause = () => {
        setIsPaused(true)
      }

      utterance.onresume = () => {
        setIsPaused(false)
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [isSupported, lang, rate, pitch, volume, selectedVoice, onStart, onEnd, onError]
  )

  const cancel = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
  }, [isSupported])

  const pause = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.pause()
    setIsPaused(true)
  }, [isSupported])

  const resume = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.resume()
    setIsPaused(false)
  }, [isSupported])

  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isSupported])

  return {
    speak,
    cancel,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    setVoice: setSelectedVoice,
    selectedVoice,
  }
}
