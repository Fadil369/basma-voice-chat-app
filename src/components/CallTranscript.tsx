import { useEffect, useRef, useState } from 'react'
import { Call, Message } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  User, 
  Robot, 
  Download, 
  Copy, 
  CheckCircle,
  Target,
  Calendar,
  Phone,
  Building,
  MapPin
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CallTranscriptProps {
  call: Call | null
  className?: string
}

interface ExtractedInfo {
  appointmentRequested?: boolean
  urgency?: string
  symptoms?: string[]
  department?: string
  keyTopics?: string[]
}

export function CallTranscript({ call, className }: CallTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo>({})
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [call?.messages])

  useEffect(() => {
    if (call?.messages && call.messages.length > 0) {
      extractInformation(call.messages)
    }
  }, [call?.messages])

  const extractInformation = (messages: Message[]) => {
    const allText = messages.map(m => m.content).join(' ').toLowerCase()
    
    const info: ExtractedInfo = {
      keyTopics: [],
      symptoms: []
    }

    if (allText.includes('appointment') || allText.includes('موعد') || allText.includes('حجز')) {
      info.appointmentRequested = true
    }

    if (allText.includes('urgent') || allText.includes('emergency') || allText.includes('عاجل') || allText.includes('طارئ')) {
      info.urgency = 'high'
    } else if (allText.includes('soon') || allText.includes('quickly') || allText.includes('قريب')) {
      info.urgency = 'medium'
    } else {
      info.urgency = 'normal'
    }

    const medicalKeywords = ['pain', 'fever', 'headache', 'cough', 'ألم', 'حمى', 'صداع', 'سعال']
    info.symptoms = medicalKeywords.filter(keyword => allText.includes(keyword))

    const topics = ['consultation', 'demo', 'partnership', 'support', 'استشارة', 'عرض', 'شراكة', 'دعم']
    info.keyTopics = topics.filter(topic => allText.includes(topic))

    setExtractedInfo(info)
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getDuration = () => {
    if (!call?.startTime) return '00:00'
    const start = new Date(call.startTime).getTime()
    const end = call.endTime ? new Date(call.endTime).getTime() : Date.now()
    const diff = Math.floor((end - start) / 1000)
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const copyTranscript = async () => {
    if (!call?.messages) return
    
    const transcript = call.messages.map(msg => 
      `[${formatTime(msg.timestamp)}] ${msg.role === 'user' ? call.callerName : 'Basma'}: ${msg.content}`
    ).join('\n\n')
    
    await navigator.clipboard.writeText(transcript)
    setCopied(true)
    toast.success('Transcript copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadTranscript = () => {
    if (!call?.messages) return
    
    const transcript = `Call Transcript - ${call.callerName}\n` +
      `Phone: ${call.callerPhone}\n` +
      `Date: ${new Date(call.startTime).toLocaleString()}\n` +
      `Duration: ${getDuration()}\n` +
      `${call.triageLevel ? `Triage Level: ${call.triageLevel}\n` : ''}` +
      `\n${'='.repeat(60)}\n\n` +
      call.messages.map(msg => 
        `[${formatTime(msg.timestamp)}] ${msg.role === 'user' ? call.callerName : 'Basma'}:\n${msg.content}\n`
      ).join('\n')
    
    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript-${call.id}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Transcript downloaded')
  }

  if (!call) {
    return (
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50 p-8', className)}>
        <div className="text-center text-muted-foreground">
          <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" weight="duotone" />
          <p className="text-sm">No active call</p>
          <p className="text-xs mt-1">Start a call to see the transcript</p>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">Call Transcript</h3>
            <p className="text-sm text-muted-foreground">Real-time conversation analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyTranscript}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              title="Copy transcript"
            >
              {copied ? (
                <CheckCircle className="w-5 h-5 text-success" weight="fill" />
              ) : (
                <Copy className="w-5 h-5 text-secondary-foreground" weight="duotone" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadTranscript}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              title="Download transcript"
            >
              <Download className="w-5 h-5 text-secondary-foreground" weight="duotone" />
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-primary" weight="duotone" />
              <span className="text-xs text-muted-foreground">Duration</span>
            </div>
            <p className="text-lg font-bold text-foreground">{getDuration()}</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-primary" weight="duotone" />
              <span className="text-xs text-muted-foreground">Messages</span>
            </div>
            <p className="text-lg font-bold text-foreground">{call.messages.length}</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-primary" weight="duotone" />
              <span className="text-xs text-muted-foreground">Urgency</span>
            </div>
            <p className="text-lg font-bold text-foreground capitalize">
              {extractedInfo.urgency || 'Normal'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary" weight="duotone" />
              <span className="text-xs text-muted-foreground">Booking</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {extractedInfo.appointmentRequested ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {call.messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'assistant' && 'flex-row-reverse'
                  )}
                >
                  <div className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                    message.role === 'user' 
                      ? 'bg-accent/20' 
                      : 'bg-primary/20'
                  )}>
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-accent" weight="fill" />
                    ) : (
                      <Robot className="w-5 h-5 text-primary" weight="fill" />
                    )}
                  </div>

                  <div className={cn(
                    'flex-1 space-y-1',
                    message.role === 'assistant' && 'flex flex-col items-end'
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {message.role === 'user' ? call.callerName : 'Basma'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>

                    <div className={cn(
                      'inline-block p-4 rounded-2xl max-w-[85%]',
                      message.role === 'user'
                        ? 'bg-accent/10 rounded-tl-sm'
                        : 'bg-primary/10 rounded-tr-sm'
                    )}>
                      <p 
                        className="text-sm text-foreground leading-relaxed whitespace-pre-wrap"
                        dir={message.isArabic ? 'rtl' : 'ltr'}
                      >
                        {message.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </Card>

      {(extractedInfo.keyTopics && extractedInfo.keyTopics.length > 0) || 
       (extractedInfo.symptoms && extractedInfo.symptoms.length > 0) ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
          <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" weight="duotone" />
            Extracted Information
          </h4>

          <div className="space-y-4">
            {call.triageLevel && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Triage Level</p>
                <Badge 
                  className={cn(
                    call.triageLevel === 'emergency' && 'bg-destructive/20 text-destructive border-destructive/30',
                    call.triageLevel === 'urgent' && 'bg-warning/20 text-warning border-warning/30',
                    call.triageLevel === 'routine' && 'bg-success/20 text-success border-success/30'
                  )}
                >
                  {call.triageLevel}
                </Badge>
              </div>
            )}

            {call.department && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Department</p>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Building className="w-3 h-3 mr-1" weight="fill" />
                  {call.department}
                </Badge>
              </div>
            )}

            {extractedInfo.keyTopics && extractedInfo.keyTopics.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Key Topics</p>
                <div className="flex flex-wrap gap-2">
                  {extractedInfo.keyTopics.map((topic, idx) => (
                    <Badge 
                      key={idx}
                      variant="outline"
                      className="bg-secondary/50"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {extractedInfo.symptoms && extractedInfo.symptoms.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Mentioned Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {extractedInfo.symptoms.map((symptom, idx) => (
                    <Badge 
                      key={idx}
                      variant="outline"
                      className="bg-warning/10 text-warning border-warning/30"
                    >
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {extractedInfo.appointmentRequested && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                <div className="flex items-center gap-2 text-success">
                  <Calendar className="w-5 h-5" weight="fill" />
                  <span className="text-sm font-semibold">Appointment requested during call</span>
                </div>
              </div>
            )}

            {call.appointmentBooked && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" weight="fill" />
                  <span className="text-sm font-semibold">Appointment successfully booked</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : null}

      <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
        <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" weight="duotone" />
          Caller Information
        </h4>

        <div className="space-y-3">
          <div className="flex items-start justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-semibold text-foreground">{call.callerName}</span>
          </div>

          <div className="flex items-start justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Phone</span>
            <span className="text-sm font-mono text-foreground" dir="ltr">{call.callerPhone}</span>
          </div>

          <div className="flex items-start justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Call Started</span>
            <span className="text-sm text-foreground">
              {new Date(call.startTime).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          <div className="flex items-start justify-between py-2">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge 
              className={cn(
                call.state === 'active' && 'bg-success/20 text-success border-success/30',
                call.state === 'completed' && 'bg-muted text-muted-foreground',
                call.state === 'routing' && 'bg-warning/20 text-warning border-warning/30'
              )}
            >
              {call.state}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
