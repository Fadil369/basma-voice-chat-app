import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Call, Appointment, Message, Department, TriageLevel } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CallInterface } from '@/components/CallInterface'
import { AppointmentDialog } from '@/components/AppointmentDialog'
import { CallHistory } from '@/components/CallHistory'
import { AppointmentList } from '@/components/AppointmentList'
import { VoiceInputGuide } from '@/components/VoiceInputGuide'
import { Phone, Calendar, ClockCounterClockwise, ChartLine } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis'
import { useVoiceActivityDetection } from '@/hooks/use-voice-activity-detection'

function App() {
  const [calls, setCalls] = useKV<Call[]>('basma-calls', [])
  const [appointments, setAppointments] = useKV<Appointment[]>('basma-appointments', [])
  const [hasSeenVoiceGuide, setHasSeenVoiceGuide] = useKV<boolean>('basma-voice-guide-seen', false)
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useKV<boolean>('basma-voice-output', true)
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false)
  const [showVoiceGuide, setShowVoiceGuide] = useState(false)

  const callsList = calls || []
  const appointmentsList = appointments || []

  const { speak, cancel, isSpeaking, isSupported: isSpeechSupported } = useSpeechSynthesis({
    lang: 'ar-SA',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  })

  const { isVoiceActive, startMonitoring, stopMonitoring, isSupported: isVADSupported } = useVoiceActivityDetection({
    enabled: voiceOutputEnabled && activeCall !== null,
    threshold: -45,
    onVoiceStart: () => {
      if (isSpeaking && voiceOutputEnabled) {
        cancel()
        toast.info('Speech paused', {
          description: 'Basma paused to listen',
        })
      }
    },
  })

  useEffect(() => {
    if (activeCall && voiceOutputEnabled && isVADSupported) {
      startMonitoring()
    } else {
      stopMonitoring()
    }

    return () => {
      stopMonitoring()
    }
  }, [activeCall, voiceOutputEnabled, isVADSupported, startMonitoring, stopMonitoring])

  useEffect(() => {
    if (!hasSeenVoiceGuide && activeCall) {
      const timer = setTimeout(() => {
        setShowVoiceGuide(true)
        setHasSeenVoiceGuide(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [activeCall, hasSeenVoiceGuide, setHasSeenVoiceGuide])

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

  const startNewCall = async () => {
    const sampleCallers = [
      { name: 'أحمد محمد', phone: '+966 50 123 4567' },
      { name: 'فاطمة السالم', phone: '+966 55 234 5678' },
      { name: 'خالد العتيبي', phone: '+966 56 345 6789' },
      { name: 'نورة القحطاني', phone: '+966 54 456 7890' },
    ]

    const caller = sampleCallers[Math.floor(Math.random() * sampleCallers.length)]

    const greetingText = `مرحباً ${caller.name}، أهلاً بك في مركز بصمة الصحي. كيف يمكنني مساعدتك اليوم؟`

    const newCall: Call = {
      id: generateId(),
      callerName: caller.name,
      callerPhone: caller.phone,
      startTime: new Date(),
      state: 'active',
      messages: [
        {
          id: generateId(),
          role: 'assistant',
          content: greetingText,
          timestamp: new Date(),
          isArabic: true,
        },
      ],
    }

    setActiveCall(newCall)
    setCalls((currentCalls) => [...(currentCalls || []), newCall])
    toast.success('New call connected', {
      description: `${caller.name} is on the line`,
    })

    if (voiceOutputEnabled && isSpeechSupported) {
      setTimeout(() => {
        speak(greetingText, { lang: 'ar-SA' })
      }, 500)
    }
  }

  const sendMessage = async (content: string) => {
    if (!activeCall) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      isArabic: /[\u0600-\u06FF]/.test(content),
    }

    const updatedMessages = [...activeCall.messages, userMessage]

    setActiveCall({
      ...activeCall,
      messages: updatedMessages,
    })

    const conversationContext = updatedMessages
      .map((m) => `${m.role === 'user' ? 'Caller' : 'Basma'}: ${m.content}`)
      .join('\n')

    try {
      const promptText = `You are Basma, an intelligent Arabic voice assistant for a healthcare facility in Saudi Arabia. You understand Saudi dialects and can respond naturally.

Current conversation:
${conversationContext}

Analyze the caller's message and:
1. Respond naturally in Arabic (Saudi dialect preferred) or English based on what they used
2. If they mention symptoms, assess if it's routine, urgent, or emergency
3. If they want to book an appointment, acknowledge and offer to help
4. If routing is needed, suggest the appropriate department

Respond as Basma would speak (2-3 sentences max, natural and conversational).

Return a JSON object with:
{
  "response": "your natural response text",
  "triageLevel": "routine" | "urgent" | "emergency" | null,
  "suggestedDepartment": "general" | "appointments" | "emergency" | "billing" | null,
  "bookAppointment": true | false
}`

      const aiResponse = await window.spark.llm(promptText, 'gpt-4o-mini', true)
      const parsed = JSON.parse(aiResponse)

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: parsed.response,
        timestamp: new Date(),
        isArabic: /[\u0600-\u06FF]/.test(parsed.response),
      }

      const updatedCall: Call = {
        ...activeCall,
        messages: [...updatedMessages, assistantMessage],
        triageLevel: parsed.triageLevel || activeCall.triageLevel,
        department: parsed.suggestedDepartment || activeCall.department,
      }

      setActiveCall(updatedCall)
      setCalls((currentCalls) =>
        (currentCalls || []).map((c) => (c.id === activeCall.id ? updatedCall : c))
      )

      if (voiceOutputEnabled && isSpeechSupported) {
        const speechLang = /[\u0600-\u06FF]/.test(parsed.response) ? 'ar-SA' : 'en-US'
        speak(parsed.response, { lang: speechLang })
      }

      if (parsed.triageLevel === 'emergency') {
        toast.error('Emergency Detected!', {
          description: 'Caller requires immediate medical attention',
        })
      }

      if (parsed.bookAppointment) {
        setTimeout(() => setShowAppointmentDialog(true), 500)
      }
    } catch (error) {
      const fallbackMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ. هل يمكنك إعادة صياغة سؤالك من فضلك؟',
        timestamp: new Date(),
        isArabic: true,
      }

      setActiveCall({
        ...activeCall,
        messages: [...updatedMessages, fallbackMessage],
      })

      toast.error('Error processing message')
    }
  }

  const routeCall = (department: Department) => {
    if (!activeCall) return

    const updatedCall: Call = {
      ...activeCall,
      department,
      state: 'routing',
    }

    setActiveCall(updatedCall)
    setCalls((currentCalls) =>
      (currentCalls || []).map((c) => (c.id === activeCall.id ? updatedCall : c))
    )

    toast.success('Call Routed', {
      description: `Transferring to ${department} department`,
    })
  }

  const endCall = () => {
    if (!activeCall) return

    cancel()

    const completedCall: Call = {
      ...activeCall,
      endTime: new Date(),
      state: 'completed',
    }

    setCalls((currentCalls) =>
      (currentCalls || []).map((c) => (c.id === activeCall.id ? completedCall : c))
    )

    toast.info('Call Ended', {
      description: 'Call has been completed',
    })

    setActiveCall(null)
  }

  const bookAppointment = (
    appointmentData: Omit<Appointment, 'id' | 'callId' | 'status'>
  ) => {
    if (!activeCall) return

    const newAppointment: Appointment = {
      ...appointmentData,
      id: generateId(),
      callId: activeCall.id,
      status: 'pending',
      triageLevel: activeCall.triageLevel,
    }

    setAppointments((currentAppointments) => [...(currentAppointments || []), newAppointment])

    const updatedCall: Call = {
      ...activeCall,
      appointmentBooked: true,
    }

    setActiveCall(updatedCall)
    setCalls((currentCalls) =>
      (currentCalls || []).map((c) => (c.id === activeCall.id ? updatedCall : c))
    )

    toast.success('Appointment Booked!', {
      description: `${appointmentData.specialty} on ${new Date(appointmentData.date).toLocaleDateString()}`,
    })
  }

  const totalCalls = callsList.length
  const completedCalls = callsList.filter((c) => c.state === 'completed').length
  const upcomingAppointments = appointmentsList.filter(
    (a) => new Date(a.date) >= new Date(new Date().toDateString()) && a.status !== 'cancelled'
  ).length

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-1">Basma</h1>
              <p className="text-lg text-muted-foreground" dir="rtl">
                مساعد صوتي ذكي باللغة العربية
              </p>
            </div>
            {!activeCall && (
              <Button size="lg" onClick={startNewCall} className="gap-2">
                <Phone className="w-5 h-5" weight="fill" />
                Start Call
              </Button>
            )}
          </div>
        </motion.header>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2">
              <ChartLine className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="call" className="gap-2" disabled={!activeCall}>
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Active Call</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <ClockCounterClockwise className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Appointments</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Calls</p>
                      <p className="text-3xl font-bold">{totalCalls}</p>
                    </div>
                    <Phone className="w-8 h-8 text-primary" weight="duotone" />
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Completed</p>
                      <p className="text-3xl font-bold">{completedCalls}</p>
                    </div>
                    <ChartLine className="w-8 h-8 text-success" weight="duotone" />
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Upcoming</p>
                      <p className="text-3xl font-bold">{upcomingAppointments}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-accent" weight="duotone" />
                  </div>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CallHistory calls={callsList.slice(-5)} />
              <AppointmentList appointments={appointmentsList.slice(-5)} />
            </div>

            {!activeCall && callsList.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-12 text-center">
                  <Phone className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" weight="duotone" />
                  <h3 className="text-xl font-semibold mb-2">Welcome to Basma</h3>
                  <p className="text-muted-foreground mb-1">
                    Intelligent voice assistant for healthcare
                  </p>
                  <p className="text-muted-foreground mb-6" dir="rtl">
                    مساعد صوتي ذكي للرعاية الصحية
                  </p>
                  <Button size="lg" onClick={startNewCall} className="gap-2">
                    <Phone className="w-5 h-5" weight="fill" />
                    Start Your First Call
                  </Button>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="call">
            {activeCall && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CallInterface
                  call={activeCall}
                  onSendMessage={sendMessage}
                  onRouteCall={routeCall}
                  onEndCall={endCall}
                  onBookAppointment={() => setShowAppointmentDialog(true)}
                  isSpeaking={isSpeaking}
                  voiceOutputEnabled={voiceOutputEnabled}
                  onToggleVoiceOutput={() => setVoiceOutputEnabled((prev) => !prev)}
                  isVoiceActive={isVoiceActive}
                />
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <CallHistory calls={callsList} />
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentList appointments={appointmentsList} />
          </TabsContent>
        </Tabs>
      </div>

      <AppointmentDialog
        open={showAppointmentDialog}
        onClose={() => setShowAppointmentDialog(false)}
        onBook={bookAppointment}
        prefillData={
          activeCall
            ? {
                patientName: activeCall.callerName,
                patientPhone: activeCall.callerPhone,
              }
            : undefined
        }
      />

      <VoiceInputGuide show={showVoiceGuide} onClose={() => setShowVoiceGuide(false)} />
    </div>
  )
}

export default App
