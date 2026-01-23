import { useState } from 'react'
import { Call, Department, TriageLevel } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AudioWaveVisualizer } from '@/components/AudioWaveVisualizer'
import { TriageBadge } from '@/components/TriageBadge'
import { DepartmentIcon, getDepartmentLabel } from '@/components/DepartmentIcon'
import { PhoneDisconnect, PaperPlaneTilt, ArrowRight } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface CallInterfaceProps {
  call: Call
  onSendMessage: (content: string) => void
  onRouteCall: (department: Department) => void
  onEndCall: () => void
  onBookAppointment: () => void
}

export function CallInterface({
  call,
  onSendMessage,
  onRouteCall,
  onEndCall,
  onBookAppointment,
}: CallInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const isActive = call.state === 'active'

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue)
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
            {call.state === 'active' && (
              <div className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary pulse-ring" />
                <span className="text-sm font-medium">Active</span>
              </div>
            )}
          </div>
        </div>

        <AudioWaveVisualizer isActive={isActive} bars={7} />

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
          <div className="flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type message (simulated voice input)..."
              className="flex-1 min-h-[80px] resize-none"
              dir="auto"
            />
            <Button onClick={handleSend} size="icon" className="h-[80px] w-[80px]">
              <PaperPlaneTilt className="w-5 h-5" weight="fill" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
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
