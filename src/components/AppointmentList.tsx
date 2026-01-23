import { Appointment } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TriageBadge } from '@/components/TriageBadge'
import { Calendar, Clock, User, Hospital } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface AppointmentListProps {
  appointments: Appointment[]
}

export function AppointmentList({ appointments }: AppointmentListProps) {
  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
  )

  const upcomingAppointments = sortedAppointments.filter(
    (apt) => new Date(apt.date) >= new Date(new Date().toDateString())
  )

  const getStatusBadge = (status: Appointment['status']) => {
    const config = {
      pending: { label: 'Pending', variant: 'secondary' as const },
      confirmed: { label: 'Confirmed', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'outline' as const },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const },
    }
    return config[status]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          <span>Appointments</span>
          <span className="mx-2">•</span>
          <span dir="rtl">المواعيد</span>
        </h2>
        <Badge variant="secondary">{upcomingAppointments.length} upcoming</Badge>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {sortedAppointments.map((appointment, index) => {
            const statusConfig = getStatusBadge(appointment.status)
            const isPast = new Date(appointment.date) < new Date(new Date().toDateString())

            return (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-4 ${isPast ? 'opacity-60' : ''} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-accent" weight="duotone" />
                      </div>
                      <div>
                        <p className="font-semibold">{appointment.patientName}</p>
                        <p className="text-sm text-muted-foreground" dir="ltr">
                          {appointment.patientPhone}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {appointment.triageLevel && <TriageBadge level={appointment.triageLevel} />}
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Hospital className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{appointment.specialty}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(appointment.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span dir="ltr">{appointment.time}</span>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                        <p className="text-muted-foreground" dir="auto">
                          {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}

          {sortedAppointments.length === 0 && (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No appointments scheduled</p>
              <p className="text-sm text-muted-foreground mt-1" dir="rtl">
                لا توجد مواعيد محجوزة
              </p>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
