import { useState, useEffect, useRef, useCallback } from 'react'

interface VoiceActivityDetectionOptions {
  enabled?: boolean
  threshold?: number
  smoothingTimeConstant?: number
  minDecibels?: number
  onVoiceStart?: () => void
  onVoiceEnd?: () => void
  onError?: (error: Error) => void
}

interface UseVoiceActivityDetectionReturn {
  isVoiceActive: boolean
  audioLevel: number
  isSupported: boolean
  startMonitoring: () => void
  stopMonitoring: () => void
  isMonitoring: boolean
}

const isAudioContextSupported = () => {
  return typeof window !== 'undefined' && 
    ('AudioContext' in window || 'webkitAudioContext' in window)
}

export function useVoiceActivityDetection(
  options: VoiceActivityDetectionOptions = {}
): UseVoiceActivityDetectionReturn {
  const {
    enabled = true,
    threshold = -50,
    smoothingTimeConstant = 0.8,
    minDecibels = -100,
    onVoiceStart,
    onVoiceEnd,
    onError,
  } = options

  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isSupported] = useState(isAudioContextSupported())

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const voiceStartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const voiceEndTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    if (voiceStartTimeoutRef.current) {
      clearTimeout(voiceStartTimeoutRef.current)
      voiceStartTimeoutRef.current = null
    }

    if (voiceEndTimeoutRef.current) {
      clearTimeout(voiceEndTimeoutRef.current)
      voiceEndTimeoutRef.current = null
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect()
      microphoneRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    setIsMonitoring(false)
  }, [])

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !enabled) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    analyser.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
    const decibels = 20 * Math.log10(average / 255)
    
    setAudioLevel(decibels)

    const isCurrentlyActive = decibels > threshold

    if (isCurrentlyActive && !isVoiceActive) {
      if (voiceEndTimeoutRef.current) {
        clearTimeout(voiceEndTimeoutRef.current)
        voiceEndTimeoutRef.current = null
      }

      if (!voiceStartTimeoutRef.current) {
        voiceStartTimeoutRef.current = setTimeout(() => {
          setIsVoiceActive(true)
          if (onVoiceStart) onVoiceStart()
          voiceStartTimeoutRef.current = null
        }, 100)
      }
    } else if (!isCurrentlyActive && isVoiceActive) {
      if (voiceStartTimeoutRef.current) {
        clearTimeout(voiceStartTimeoutRef.current)
        voiceStartTimeoutRef.current = null
      }

      if (!voiceEndTimeoutRef.current) {
        voiceEndTimeoutRef.current = setTimeout(() => {
          setIsVoiceActive(false)
          if (onVoiceEnd) onVoiceEnd()
          voiceEndTimeoutRef.current = null
        }, 500)
      }
    }

    rafIdRef.current = requestAnimationFrame(analyzeAudio)
  }, [enabled, threshold, isVoiceActive, onVoiceStart, onVoiceEnd])

  const startMonitoring = useCallback(async () => {
    if (!isSupported) {
      console.warn('Voice activity detection is not supported')
      return
    }

    if (isMonitoring) {
      return
    }

    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContextClass()

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })
      
      streamRef.current = stream

      const audioContext = audioContextRef.current
      if (!audioContext) return

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = smoothingTimeConstant
      analyser.minDecibels = minDecibels
      analyserRef.current = analyser

      const microphone = audioContext.createMediaStreamSource(stream)
      microphoneRef.current = microphone
      microphone.connect(analyser)

      setIsMonitoring(true)
      analyzeAudio()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start voice activity detection')
      console.error('VAD error:', err)
      if (onError) onError(err)
      cleanup()
    }
  }, [isSupported, isMonitoring, smoothingTimeConstant, minDecibels, analyzeAudio, cleanup, onError])

  const stopMonitoring = useCallback(() => {
    cleanup()
    setIsVoiceActive(false)
    setAudioLevel(0)
  }, [cleanup])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    isVoiceActive,
    audioLevel,
    isSupported,
    startMonitoring,
    stopMonitoring,
    isMonitoring,
  }
}
