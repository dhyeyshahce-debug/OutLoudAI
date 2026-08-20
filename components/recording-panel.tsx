'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Mic, Play, RotateCcw, Square, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Waveform } from '@/components/waveform'
import { cn } from '@/lib/utils'

type RecState = 'idle' | 'recording' | 'recorded'

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function RecordingPanel({
  idleTitle = 'Ready to explain your approach?',
  idleHint = 'No coding. Just explain your thinking.',
  ctaLabel = 'Start speaking',
  onSubmit,
  submitting = false,
  className,
}: {
  idleTitle?: string
  idleHint?: string
  ctaLabel?: string
  onSubmit?: () => void
  submitting?: boolean
  className?: string
}) {
  const [state, setState] = useState<RecState>('idle')
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (state === 'recording') {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state])

  const start = () => {
    setSeconds(0)
    setState('recording')
  }
  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setState('recorded')
  }
  const reset = () => {
    setSeconds(0)
    setState('idle')
  }

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card/60 p-6 backdrop-blur-sm sm:p-8',
        className,
      )}
    >
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <p className="text-sm font-medium text-muted-foreground">{idleTitle}</p>
            <button
              type="button"
              onClick={start}
              aria-label={ctaLabel}
              className="group relative grid size-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <span className="absolute inset-0 rounded-full bg-primary/30 blur-md transition-opacity group-hover:opacity-80" />
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-duration:2.5s]" />
              <Mic className="relative size-9" />
            </button>
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold">{ctaLabel}</span>
              <span className="text-xs text-muted-foreground">{idleHint}</span>
            </div>
            <button
              type="button"
              onClick={start}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Upload className="size-3.5" />
              Upload audio instead
            </button>
          </motion.div>
        )}

        {state === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1">
              <span className="size-2 animate-pulse rounded-full bg-destructive" />
              <span className="text-xs font-medium text-destructive">Recording</span>
            </div>
            <span className="font-mono text-3xl font-semibold tabular-nums">
              {formatTime(seconds)}
            </span>
            <Waveform active className="w-full max-w-md" />
            <Button variant="destructive" size="lg" onClick={stop}>
              <Square data-icon="inline-start" />
              Stop
            </Button>
          </motion.div>
        )}

        {state === 'recorded' && (
          <motion.div
            key="recorded"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="flex items-center gap-2 rounded-full border bg-muted px-3 py-1">
              <span className="size-2 rounded-full bg-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                Explanation captured · {formatTime(seconds || 42)}
              </span>
            </div>
            <Waveform className="w-full max-w-md" />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={submitting}>
                <Play data-icon="inline-start" />
                Replay
              </Button>
              <Button variant="outline" size="sm" onClick={reset} disabled={submitting}>
                <RotateCcw data-icon="inline-start" />
                Record again
              </Button>
            </div>
            <Button
              size="lg"
              className="w-full max-w-xs"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit Explanation'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
