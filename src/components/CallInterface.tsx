import { useState, useEffect } from 'react'
import { Call, Department, TriageLevel } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AudioWaveVisualizer } from '@/components/AudioWaveVisualizer'
import { VolumeLevelIndicator } from '@/components/VolumeLevelIndicator'
import { TriageBadge } from '@/components/TriageBadge'
import { DepartmentIcon, getDepartmentLabel } from '@/components/DepartmentIcon'
import { PhoneDisconnect, PaperPlaneTilt, Microphone, MicrophoneSlash, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface CallInterfaceProps {
  call: Call
  onSendMessage: (content: string) => void
  onRouteCall: (department: Department) => void
  onEndCall: () => void
  onBookAppointment: () => void
  isSpeaking?: boolean
  voiceOutputEnabled?: boolean
  onToggleVoiceOutput?: () => void
  isVoiceActive?: boolean
  audioLevel?: number
}

export function CallInterface({
  call,
  onSendMessage,
  onRouteCall,
  onEndCall,
  onBookAppointment,
  isSpeaking = false,
  voiceOutputEnabled = true,
  onToggleVoiceOutput,
  isVoiceActive = false,
  audioLevel = -100,
}: CallInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const [useVoiceInput, setUseVoiceInput] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<'ar-SA' | 'en-US'>('ar-SA')
  const isActive = call.state === 'active'

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  } = useSpeechRecognition({
    lang: currentLanguage,
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal && text.trim()) {
        setInputValue((prev) => prev + text + ' ')
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

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue)
      setInputValue('')
      resetTranscript()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening({ lang: currentLanguage })
    }
  }

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'ar-SA' ? 'en-US' : 'ar-SA'
    setCurrentLanguage(newLang)
    if (isListening) {
      stopListening()
      setTimeout(() => startListening({ lang: newLang }), 100)
    }
    toast.success(newLang === 'ar-SA' ? 'Arabic voice mode' : 'English voice mode')
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">{call.callerName}</h2>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {call.callerPhone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {call.triageLevel && <TriageBadge level={call.triageLevel} />}
            {isVoiceActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full text-primary"
              >
                <Microphone className="w-4 h-4" weight="fill" />
                <span className="text-xs font-medium">Voice Detected</span>
              </motion.div>
            )}
            {isSpeaking && !isVoiceActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 bg-accent/20 rounded-full text-accent-foreground"
              >
                <SpeakerHigh className="w-4 h-4" weight="fill" />
                <span className="text-xs font-medium">Speaking...</span>
              </motion.div>
            )}
            {call.state === 'active' && (
              <div className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary pulse-ring" />
                <span className="text-sm font-medium">Active</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <AudioWaveVisualizer isActive={isActive || isListening || isSpeaking || isVoiceActive} bars={7} />
          
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <span className="text-xs font-medium text-muted-foreground min-w-[80px]">
              Volume Level
            </span>
            <VolumeLevelIndicator 
              audioLevel={audioLevel} 
              isActive={isActive && (isListening || isVoiceActive)} 
              className="flex-1"
              bars={15}
            />
            <span className="text-xs font-mono text-muted-foreground min-w-[50px] text-right">
              {Math.max(-100, Math.round(audioLevel))} dB
            </span>
          </div>
        </div>

        {call.department && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-secondary rounded-lg flex items-center gap-3"
          >
            <DepartmentIcon department={call.department} className="w-6 h-6 text-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>{getDepartmentLabel(call.department).en}</span>
                <span>•</span>
                <span dir="rtl">{getDepartmentLabel(call.department).ar}</span>
              </div>
              <p className="text-xs text-muted-foreground">Call routed</p>
            </div>
          </motion.div>
        )}
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {call.messages.map((message, index) => (
            <div key={message.id}>
              <div
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    dir={message.isArabic ? 'rtl' : 'auto'}
                  >
                    {message.content}
                  </p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {index < call.messages.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </ScrollArea>

      {isActive && (
        <div className="p-6 border-t space-y-4">
          {!isSupported && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-warning-foreground">
              Voice input is not supported in your browser. Please use text input.
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 text-primary text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-destructive pulse-ring" />
                      <span>Listening...</span>
                    </motion.div>
                  )}
                </div>
                {isSupported && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLanguage}
                    className="text-xs"
                  >
                    {currentLanguage === 'ar-SA' ? 'العربية' : 'English'}
                  </Button>
                )}
              </div>
              <Textarea
                value={inputValue + (interimTranscript ? interimTranscript : '')}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  isSupported
                    ? currentLanguage === 'ar-SA'
                      ? 'اكتب أو اضغط على الميكروفون للتحدث...'
                      : 'Type or click microphone to speak...'
                    : 'Type your message...'
                }
                className="flex-1 min-h-[80px] resize-none"
                dir="auto"
                disabled={isListening}
              />
              {interimTranscript && (
                <div className="text-xs text-muted-foreground italic px-2">
                  Transcribing: {interimTranscript}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {isSupported && (
                <Button
                  onClick={toggleVoiceInput}
                  size="icon"
                  variant={isListening ? 'destructive' : 'secondary'}
                  className="h-[80px] w-[80px]"
                >
                  {isListening ? (
                    <MicrophoneSlash className="w-6 h-6" weight="fill" />
                  ) : (
                    <Microphone className="w-6 h-6" weight="fill" />
                  )}
                </Button>
              )}
              <Button
                onClick={handleSend}
                size="icon"
                className="h-[80px] w-[80px]"
                disabled={!inputValue.trim()}
              >
                <PaperPlaneTilt className="w-5 h-5" weight="fill" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {onToggleVoiceOutput && (
              <Button 
                variant={voiceOutputEnabled ? "default" : "outline"} 
                size="sm" 
                onClick={onToggleVoiceOutput}
                className="gap-2"
              >
                {voiceOutputEnabled ? (
                  <>
                    <SpeakerHigh className="w-4 h-4" weight="fill" />
                    Voice On
                  </>
                ) : (
                  <>
                    <SpeakerSlash className="w-4 h-4" weight="fill" />
                    Voice Off
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onBookAppointment}>
              Book Appointment
            </Button>
            {!call.department && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRouteCall('appointments')}
                >
                  <DepartmentIcon department="appointments" className="w-4 h-4 mr-2" />
                  Route to Appointments
                </Button>
                <Button variant="outline" size="sm" onClick={() => onRouteCall('emergency')}>
                  <DepartmentIcon department="emergency" className="w-4 h-4 mr-2" />
                  Route to Emergency
                </Button>
              </>
            )}
          </div>

          <Button variant="destructive" className="w-full" onClick={onEndCall}>
            <PhoneDisconnect className="w-5 h-5 mr-2" weight="fill" />
            End Call
          </Button>
        </div>
      )}
    </Card>
  )
}
