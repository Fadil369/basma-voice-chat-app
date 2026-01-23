import { TriageLevel } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Warning, Clock, CheckCircle } from '@phosphor-icons/react'

interface TriageBadgeProps {
  level: TriageLevel
}

export function TriageBadge({ level }: TriageBadgeProps) {
  const config = {
    routine: {
      label: 'Routine',
      labelAr: 'عادي',
      className: 'bg-success text-success-foreground',
      icon: CheckCircle,
    },
    urgent: {
      label: 'Urgent',
      labelAr: 'عاجل',
      className: 'bg-warning text-warning-foreground',
      icon: Clock,
    },
    emergency: {
      label: 'Emergency',
      labelAr: 'طوارئ',
      className: 'bg-destructive text-destructive-foreground',
      icon: Warning,
    },
  }

  const { label, labelAr, className, icon: Icon } = config[level]

  return (
    <Badge className={className}>
      <Icon className="w-3 h-3 mr-1" weight="fill" />
      <span>{label}</span>
      <span className="mx-1">•</span>
      <span dir="rtl">{labelAr}</span>
    </Badge>
  )
}
