import { Call } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TriageBadge } from '@/components/TriageBadge'
import { DepartmentIcon, getDepartmentLabel } from '@/components/DepartmentIcon'
import { Phone, Clock, CheckCircle } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface CallHistoryProps {
  calls: Call[]
  onSelectCall?: (call: Call) => void
}

export function CallHistory({ calls, onSelectCall }: CallHistoryProps) {
  const sortedCalls = [...calls].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  const getCallDuration = (call: Call) => {
    if (!call.endTime) return 'In progress'
    const duration = Math.floor(
      (new Date(call.endTime).getTime() - new Date(call.startTime).getTime()) / 1000
    )
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getStateLabel = (state: Call['state']) => {
    const labels = {
      idle: 'Idle',
      incoming: 'Incoming',
      active: 'Active',
      routing: 'Routing',
      completed: 'Completed',
    }
    return labels[state]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          <span>Call History</span>
          <span className="mx-2">•</span>
          <span dir="rtl">سجل المكالمات</span>
        </h2>
        <Badge variant="secondary">{sortedCalls.length} calls</Badge>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {sortedCalls.map((call, index) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`p-4 hover:shadow-md transition-shadow ${
                  onSelectCall ? 'cursor-pointer' : ''
                }`}
                onClick={() => onSelectCall?.(call)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" weight="duotone" />
                    </div>
                    <div>
                      <p className="font-semibold">{call.callerName}</p>
                      <p className="text-sm text-muted-foreground" dir="ltr">
                        {call.callerPhone}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {call.triageLevel && <TriageBadge level={call.triageLevel} />}
                    <Badge
                      variant={call.state === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {getStateLabel(call.state)}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{getCallDuration(call)}</span>
                  </div>
                  {call.department && (
                    <div className="flex items-center gap-1">
                      <DepartmentIcon department={call.department} className="w-4 h-4" />
                      <span>{getDepartmentLabel(call.department).en}</span>
                    </div>
                  )}
                  {call.appointmentBooked && (
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle className="w-4 h-4" weight="fill" />
                      <span>Appointment Booked</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  {new Date(call.startTime).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </Card>
            </motion.div>
          ))}

          {sortedCalls.length === 0 && (
            <Card className="p-8 text-center">
              <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No calls yet</p>
              <p className="text-sm text-muted-foreground mt-1" dir="rtl">
                لا توجد مكالمات بعد
              </p>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
