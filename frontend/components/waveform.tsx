'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export function Waveform({
  active = false,
  bars = 40,
  className,
  barClassName,
  levels,
}: {
  active?: boolean
  bars?: number
  className?: string
  barClassName?: string
  levels?: number[]
}) {
  // Deterministic pseudo-random heights so SSR and client match when no dynamic levels are provided.
  const heights = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const seed =
          Math.sin(i * 1.7) * 0.5 +
          Math.sin(i * 0.6) * 0.5

        return 0.3 + Math.abs(seed) * 0.7
      }),
    [bars],
  )

  const count = levels ? levels.length : bars

  return (
    <div className={cn('flex h-12 items-center justify-center gap-[3px]', className)}>
      {Array.from({ length: count }, (_, i) => {
        if (levels && levels.length > 0) {
          const lvl = Math.max(0.08, Math.min(1, levels[i] ?? 0.1))
          return (
            <span
              key={i}
              className={cn(
                'w-[3px] rounded-full bg-primary/80 transition-[height] duration-75 origin-center',
                barClassName,
              )}
              style={{
                height: `${Math.round(lvl * 100)}%`,
              }}
            />
          )
        }

        const h = heights[i] ?? 0.5
        return (
          <span
            key={i}
            className={cn(
              'w-[3px] rounded-full bg-primary/70 origin-center',
              active ? 'animate-[wave-bar_1.1s_ease-in-out_infinite]' : 'opacity-40',
              barClassName,
            )}
            style={{
              height: `${Math.round(h * 100)}%`,
              animationDelay: active ? `${(i % 10) * 90}ms` : undefined,
              transform: active ? undefined : `scaleY(${0.35 + (h % 0.4)})`,
            }}
          />
        )
      })}
    </div>
  )
}