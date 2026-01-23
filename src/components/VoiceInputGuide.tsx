import { motion, AnimatePresence } from 'framer-motion'
import { X, Microphone, ChatCircle, Globe } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface VoiceInputGuideProps {
  show: boolean
  onClose: () => void
}

export function VoiceInputGuide({ show, onClose }: VoiceInputGuideProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="max-w-md p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Voice Input Guide</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Microphone className="w-5 h-5 text-primary" weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Click to Speak</h4>
                    <p className="text-sm text-muted-foreground">
                      Press the microphone button and allow browser permission to start voice
                      input
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-accent" weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1" dir="rtl">
                      العربية أو English
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Switch between Arabic and English voice recognition using the language
                      toggle
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <ChatCircle className="w-5 h-5 text-success" weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Real-time Transcription</h4>
                    <p className="text-sm text-muted-foreground">
                      Your speech will be transcribed in real-time. Review and send when ready
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Browser Support</p>
                <p className="text-xs text-muted-foreground">
                  Voice input works best in Chrome, Edge, and Safari. Firefox has limited
                  support. If voice input is unavailable, you can still type your messages.
                </p>
              </div>

              <Button onClick={onClose} className="w-full">
                Got it!
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
