import { useState, useEffect } from 'react'
import { Call } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Phone, Microphone, MicrophoneSlash, VideoCamera, Pulse } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CallLincInterfaceProps {
  call: Call | null
  onSendMessage?: (content: string) => void
  onEndCall?: () => void
  isSpeaking?: boolean
  voiceOutputEnabled?: boolean
  onToggleVoiceOutput?: () => void
  isVoiceActive?: boolean
  audioLevel?: number
  className?: string
}

export function CallLincInterface({
  call,
  onSendMessage,
  onEndCall,
  isSpeaking = false,
  voiceOutputEnabled = true,
  onToggleVoiceOutput,
  isVoiceActive = false,
  audioLevel = -100,
  className,
}: CallLincInterfaceProps) {
  const [currentLanguage, setCurrentLanguage] = useState<'ar-SA' | 'en-US'>('ar-SA')
  const isActive = call?.state === 'active'

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: currentLanguage,
    continuous: true,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal && text.trim() && onSendMessage) {
        onSendMessage(text)
        resetTranscript()
      }
    },
    onError: (errorType) => {
      if (errorType !== 'no-speech' && errorType !== 'aborted') {
        toast.error('Voice input error', {
          description: errorType === 'not-allowed' 
            ? 'Microphone permission denied' 
            : `Error: ${errorType}`,
        })
      }
    },
  })

  useEffect(() => {
    if (!isActive && isListening) {
      stopListening()
    }
  }, [isActive, isListening, stopListening])

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening({ lang: currentLanguage })
    }
  }

  const quickResponses = [
    { en: 'Yes', ar: 'نعم' },
    { en: 'No', ar: 'لا' },
    { en: 'Thanks', ar: 'شكراً' },
  ]

  return (
    <div className={cn('relative', className)}>
      <Card className="bg-gradient-to-b from-[oklch(0.20_0.05_250)] to-[oklch(0.15_0.05_250)] border-none overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-20 bg-black/40 backdrop-blur-sm border-b border-white/10">
            <div className="flex items-center justify-center h-full px-6">
              <h1 className="text-xl font-semibold text-white/90">
                CallLinc - Healthcare AI Agent
              </h1>
            </div>
          </div>

          <div className="pt-20 pb-8 px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[oklch(0.70_0.15_30)] to-[oklch(0.65_0.18_25)] flex items-center justify-center shadow-lg">
                  <Phone className="w-7 h-7 text-white" weight="fill" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">CallLinc</h2>
                  <p className="text-sm text-white/60">BrainSAIT Healthcare Intelligence</p>
                </div>
              </div>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-4 py-2 bg-success/20 backdrop-blur-sm rounded-full border border-success/30"
                >
                  <Pulse className="w-4 h-4 text-success" weight="fill" />
                  <span className="text-sm font-semibold text-success">Online</span>
                </motion.div>
              )}
            </div>

            <div className="relative flex items-center justify-center my-16">
              <motion.div
                animate={{
                  scale: isActive || isListening ? [1, 1.05, 1] : 1,
                  opacity: isActive || isListening ? [0.3, 0.5, 0.3] : 0.2,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-3xl"
              />
              
              <motion.div
                animate={{
                  scale: isActive || isListening ? [1, 1.1, 1] : 1,
                  opacity: isActive || isListening ? [0.2, 0.4, 0.2] : 0.1,
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2,
                }}
                className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary/40 to-accent/40 blur-2xl"
              />

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative z-10"
              >
                <button
                  onClick={toggleVoiceInput}
                  disabled={!isActive}
                  className={cn(
                    "w-64 h-64 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center",
                    isListening
                      ? "bg-destructive hover:bg-destructive/90"
                      : "bg-gradient-to-br from-[oklch(0.25_0.05_250)] to-[oklch(0.20_0.05_250)]",
                    !isActive && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "w-48 h-48 rounded-full border-4 transition-all duration-300 flex items-center justify-center",
                      isListening ? "border-white/50" : "border-white/20"
                    )}
                  >
                    <Microphone 
                      className={cn(
                        "w-24 h-24 transition-all duration-300",
                        isListening ? "text-white" : "text-white/40"
                      )} 
                      weight="fill" 
                    />
                  </div>
                </button>
              </motion.div>

              <AnimatePresence>
                {(isListening || isSpeaking) && (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ 
                          scale: [1, 1.3, 1.6],
                          opacity: [0.5, 0.3, 0]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.4,
                          ease: "easeOut"
                        }}
                        className="absolute w-64 h-64 rounded-full border-2 border-primary/60"
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center gap-6 mb-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleVoiceInput}
                disabled={!isActive}
                className={cn(
                  "w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all",
                  isListening 
                    ? "bg-destructive hover:bg-destructive/90" 
                    : "bg-gradient-to-br from-[oklch(0.30_0.05_250)] to-[oklch(0.25_0.05_250)] hover:from-[oklch(0.35_0.05_250)] hover:to-[oklch(0.30_0.05_250)]",
                  !isActive && "opacity-50 cursor-not-allowed"
                )}
              >
                {isListening ? (
                  <MicrophoneSlash className="w-7 h-7 text-white" weight="fill" />
                ) : (
                  <Microphone className="w-7 h-7 text-white/80" weight="fill" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onEndCall}
                disabled={!isActive}
                className={cn(
                  "w-20 h-20 rounded-full shadow-lg flex items-center justify-center transition-all",
                  "bg-gradient-to-br from-[oklch(0.70_0.15_30)] to-[oklch(0.65_0.18_25)] hover:from-[oklch(0.75_0.15_30)] hover:to-[oklch(0.70_0.18_25)]",
                  !isActive && "opacity-50 cursor-not-allowed"
                )}
              >
                <Phone className="w-9 h-9 text-white" weight="fill" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled
                className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br from-[oklch(0.30_0.05_250)] to-[oklch(0.25_0.05_250)] opacity-50 cursor-not-allowed"
              >
                <VideoCamera className="w-7 h-7 text-white/60" weight="fill" />
              </motion.button>
            </div>

            <div className="flex items-center justify-center gap-3">
              {quickResponses.map((response, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSendMessage?.(response.en)}
                  disabled={!isActive}
                  className={cn(
                    "px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all",
                    "flex flex-col items-center gap-1",
                    !isActive && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="text-sm font-medium text-white/90">{response.en}</span>
                  <span className="text-xs text-white/60" dir="rtl">{response.ar}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/20 backdrop-blur-sm border-t border-white/10">
            <div className="flex items-center justify-around h-full px-8">
              <button className="flex flex-col items-center gap-2 transition-all hover:scale-105">
                <Phone className="w-6 h-6 text-[oklch(0.70_0.15_30)]" weight="fill" />
                <span className="text-xs font-medium text-[oklch(0.70_0.15_30)]">CallLinc Voice</span>
              </button>
              <button className="flex flex-col items-center gap-2 transition-all hover:scale-105 opacity-60">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                <span className="text-xs font-medium text-white/60">Text Chat</span>
              </button>
              <button className="flex flex-col items-center gap-2 transition-all hover:scale-105 opacity-60">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                </svg>
                <span className="text-xs font-medium text-white/60">Insights</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {call && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4"
          >
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-white">{call.callerName}</p>
                  <p className="text-xs text-white/60" dir="ltr">{call.callerPhone}</p>
                </div>
                {call.triageLevel && (
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold",
                    call.triageLevel === 'emergency' && "bg-destructive/20 text-destructive",
                    call.triageLevel === 'urgent' && "bg-warning/20 text-warning",
                    call.triageLevel === 'routine' && "bg-success/20 text-success"
                  )}>
                    {call.triageLevel}
                  </div>
                )}
              </div>
              {(interimTranscript || transcript) && (
                <div className="mt-3 p-3 bg-black/20 rounded-lg">
                  <p className="text-xs text-white/50 mb-1">Transcribing...</p>
                  <p className="text-sm text-white/90" dir="auto">
                    {transcript} {interimTranscript && <span className="text-white/60">{interimTranscript}</span>}
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
