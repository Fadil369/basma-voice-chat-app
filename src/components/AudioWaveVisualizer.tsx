import { motion } from 'framer-motion'

interface AudioWaveVisualizerProps {
  isActive: boolean
  bars?: number
}

export function AudioWaveVisualizer({ isActive, bars = 5 }: AudioWaveVisualizerProps) {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary rounded-full"
          animate={
            isActive
              ? {
                  height: ['20%', '100%', '20%'],
                  opacity: [0.5, 1, 0.5],
                }
              : {
                  height: '20%',
                  opacity: 0.3,
                }
          }
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
