'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export function ScoreRing({
  value,
  max = 100,
  size = 180,
  stroke = 12,
  label,
  className,
}: {
  value: number
  max?: number
  size?: number
  stroke?: number
  label?: string
  className?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(value / max, 1)

  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tabular-nums tracking-tight">
          {value}
        </span>
        {label && (
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        )}
      </div>
    </div>
  )
}
