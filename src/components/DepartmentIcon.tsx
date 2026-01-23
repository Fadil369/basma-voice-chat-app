import { Department } from '@/lib/types'
import { Hospital, Calendar, Warning, CreditCard, Phone } from '@phosphor-icons/react'

interface DepartmentIconProps {
  department: Department
  className?: string
}

export function DepartmentIcon({ department, className = 'w-5 h-5' }: DepartmentIconProps) {
  const icons = {
    general: Phone,
    appointments: Calendar,
    emergency: Warning,
    billing: CreditCard,
  }

  const Icon = icons[department]
  return <Icon className={className} weight="duotone" />
}

export function getDepartmentLabel(department: Department): { en: string; ar: string } {
  const labels = {
    general: { en: 'General Inquiry', ar: 'استفسار عام' },
    appointments: { en: 'Appointments', ar: 'المواعيد' },
    emergency: { en: 'Emergency', ar: 'الطوارئ' },
    billing: { en: 'Billing', ar: 'الفواتير' },
  }

  return labels[department]
}
