import { useState } from 'react'
import { Appointment } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Clock } from '@phosphor-icons/react'

interface AppointmentDialogProps {
  open: boolean
  onClose: () => void
  onBook: (appointment: Omit<Appointment, 'id' | 'callId' | 'status'>) => void
  prefillData?: {
    patientName?: string
    patientPhone?: string
  }
}

export function AppointmentDialog({ open, onClose, onBook, prefillData }: AppointmentDialogProps) {
  const [patientName, setPatientName] = useState(prefillData?.patientName || '')
  const [patientPhone, setPatientPhone] = useState(prefillData?.patientPhone || '')
  const [specialty, setSpecialty] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    if (patientName && patientPhone && specialty && date && time) {
      onBook({
        patientName,
        patientPhone,
        specialty,
        date,
        time,
        notes,
      })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            <div className="flex items-center gap-2">
              <span>Book Appointment</span>
              <span>•</span>
              <span dir="rtl">حجز موعد</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="patient-name">
              Patient Name / <span dir="rtl">اسم المريض</span>
            </Label>
            <Input
              id="patient-name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name"
              dir="auto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient-phone">
              Phone Number / <span dir="rtl">رقم الهاتف</span>
            </Label>
            <Input
              id="patient-phone"
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="+966 5X XXX XXXX"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty">
              Specialty / <span dir="rtl">التخصص</span>
            </Label>
            <Input
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g., Cardiology, Pediatrics"
              dir="auto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment-date">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date / <span dir="rtl">التاريخ</span>
              </Label>
              <Input
                id="appointment-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-time">
                <Clock className="w-4 h-4 inline mr-1" />
                Time / <span dir="rtl">الوقت</span>
              </Label>
              <Input
                id="appointment-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes / <span dir="rtl">ملاحظات</span> <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              dir="auto"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!patientName || !patientPhone || !specialty || !date || !time}>
            Confirm Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
