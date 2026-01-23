import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface VolumeLevelIndicatorProps {
  audioLevel: number
  isActive: boolean
  className?: string
  orientation?: 'horizontal' | 'vertical'
  bars?: number
}

export function VolumeLevelIndicator({
  audioLevel,
  isActive,
  className,
  orientation = 'horizontal',
  bars = 10,
}: VolumeLevelIndicatorProps) {
  const normalizedLevel = Math.max(0, Math.min(1, (audioLevel + 100) / 100))
  const activeBars = Math.ceil(normalizedLevel * bars)

  const getBarHeight = (index: number) => {
    if (!isActive) return 0.2
    if (index < activeBars) {
      return 0.3 + (normalizedLevel * 0.7)
    }
    return 0.2
  }

  const getBarColor = (index: number) => {
    if (!isActive || index >= activeBars) return 'bg-muted'
    
    const percentage = (index + 1) / bars
    if (percentage <= 0.5) return 'bg-success'
    if (percentage <= 0.75) return 'bg-warning'
    return 'bg-destructive'
  }

  return (
    <div
      className={cn(
        'flex gap-1',
        orientation === 'horizontal' ? 'flex-row items-end h-12' : 'flex-col items-center w-12',
        className
      )}
    >
      {Array.from({ length: bars }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            'rounded-full transition-colors duration-200',
            orientation === 'horizontal' ? 'w-2' : 'h-2',
            getBarColor(index)
          )}
          style={
            orientation === 'horizontal'
              ? { height: `${getBarHeight(index) * 100}%` }
              : { width: `${getBarHeight(index) * 100}%` }
          }
          animate={{
            scale: isActive && index < activeBars ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 0.3,
            repeat: isActive && index < activeBars ? Infinity : 0,
            repeatDelay: 0.1,
            delay: index * 0.05,
          }}
        />
      ))}
    </div>
  )
}
