export type CallState = 'idle' | 'incoming' | 'active' | 'routing' | 'completed'

export type TriageLevel = 'routine' | 'urgent' | 'emergency'

export type Department = 'general' | 'appointments' | 'emergency' | 'billing'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isArabic?: boolean
}

export interface Call {
  id: string
  callerName: string
  callerPhone: string
  startTime: Date
  endTime?: Date
  state: CallState
  department?: Department
  triageLevel?: TriageLevel
  messages: Message[]
  appointmentBooked?: boolean
}

export interface Appointment {
  id: string
  callId: string
  patientName: string
  patientPhone: string
  specialty: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  triageLevel?: TriageLevel
  notes?: string
}
