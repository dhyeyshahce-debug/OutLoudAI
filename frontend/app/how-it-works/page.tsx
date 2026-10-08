'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Mic, Square } from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { DifficultyBadge } from '@/components/difficulty-badge'
import { Waveform } from '@/components/waveform'
import { ScoreRing } from '@/components/score-ring'
import { RESULT } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

/*
 * This page is a purely visual, non-interactive demo.
 * All buttons are disabled; an automated animation loops through:
 *   Phase 0 → "Ready" (idle mic)
 *   Phase 1 → "Recording" (pulsing mic + waveform + counting timer)
 *   Phase 2 → "Processing" (spinner)
 *   Phase 3 → "Result" (score ring + breakdown)
 *   …then loops back to Phase 0
 */

const PHASE_DURATIONS = [2500, 5000, 2000, 5000] // ms per phase

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function HowItWorksPage() {
  const [phase, setPhase] = useState(0)
  const [timer, setTimer] = useState(0)

  // Auto-advance through phases
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPhase((p) => (p + 1) % 4)
      setTimer(0)
    }, PHASE_DURATIONS[phase])
    return () => clearTimeout(timeout)
  }, [phase])

  // Counting timer during "recording" phase
  useEffect(() => {
    if (phase !== 1) return
    const interval = setInterval(() => setTimer((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

  return (
    <main className="relative min-h-screen bg-background">
      <Navbar />

      <div className="relative overflow-hidden pt-24 pb-12 sm:pt-32 sm:pb-16">
        {/* backgrounds */}
        <div className="pointer-events-none absolute inset-0 grid-bg mask-fade-edges opacity-70" />
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="text-sm font-medium text-primary">How it Works</p>
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
              Watch the flow in action
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              This is a visual demo of the practice experience. All controls are disabled — just sit back and watch.
            </p>
          </motion.div>

          {/* Phase indicators */}
          <div className="mx-auto mt-10 flex max-w-lg items-center justify-between">
            {['Ready', 'Record', 'Analyze', 'Result'].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'grid size-8 place-items-center rounded-full text-xs font-semibold transition-all duration-500',
                    phase === i
                      ? 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30'
                      : phase > i
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {i + 1}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    phase === i ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Demo card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="mx-auto mt-8 max-w-2xl"
          >
            <div className="rounded-3xl border bg-card/50 p-2 shadow-xl shadow-primary/5 backdrop-blur-sm">
              {/* Mini browser chrome */}
              <div className="flex items-center gap-2 rounded-t-[calc(var(--radius)*2)] border-b bg-muted/40 px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-muted-foreground/25" />
                <span className="size-2.5 rounded-full bg-muted-foreground/25" />
                <span className="size-2.5 rounded-full bg-muted-foreground/25" />
                <div className="ml-3 hidden flex-1 sm:block">
                  <div className="mx-auto w-fit rounded-md border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                    app.outloud.ai / practice (demo)
                  </div>
                </div>
              </div>

              <div className="rounded-b-[calc(var(--radius)*2)] bg-background/40 p-6 sm:p-8">
                {/* Problem header (always shown) */}
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Demo Problem
                    </span>
                    <span className="text-lg font-semibold tracking-tight">Two Sum</span>
                  </div>
                  <DifficultyBadge difficulty="Easy" />
                </div>
                <p className="mb-6 text-left text-sm leading-relaxed text-muted-foreground">
                  Given an array of integers and a target, return the indices of the two
                  numbers that add up to the target.
                </p>

                {/* Animated demo area — all pointer-events disabled */}
                <div className="pointer-events-none select-none">
                  <AnimatePresence mode="wait">
                    {/* Phase 0 — Ready / idle */}
                    {phase === 0 && (
                      <motion.div
                        key="ready"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center gap-5 rounded-xl border border-dashed py-10"
                      >
                        <div className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
                          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-duration:2.5s]" />
                          <Mic className="relative size-8" />
                        </div>
                        <div className="flex flex-col items-center gap-1 text-center">
                          <span className="text-sm font-semibold">Start speaking</span>
                          <span className="text-xs text-muted-foreground">Waiting for recording…</span>
                        </div>
                        <button
                          disabled
                          className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary opacity-60 cursor-not-allowed"
                        >
                          <Mic className="size-4" />
                          Start Recording
                        </button>
                      </motion.div>
                    )}

                    {/* Phase 1 — Recording */}
                    {phase === 1 && (
                      <motion.div
                        key="recording"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center gap-5 rounded-xl border border-dashed py-10"
                      >
                        <div className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1">
                          <span className="size-2 animate-pulse rounded-full bg-destructive" />
                          <span className="text-xs font-medium text-destructive">Recording</span>
                        </div>
                        <span className="font-mono text-3xl font-semibold tabular-nums">
                          {formatTime(timer)}
                        </span>
                        <Waveform active bars={36} className="w-full max-w-sm" />
                        <button
                          disabled
                          className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive opacity-60 cursor-not-allowed"
                        >
                          <Square className="size-4" />
                          Stop Recording
                        </button>
                      </motion.div>
                    )}

                    {/* Phase 2 — Processing / Analyzing */}
                    {phase === 2 && (
                      <motion.div
                        key="processing"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center gap-5 rounded-xl border border-dashed py-10"
                      >
                        <div className="relative size-14">
                          <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary [animation-duration:1.2s]" />
                        </div>
                        <div className="flex flex-col items-center gap-1 text-center">
                          <span className="text-sm font-semibold">Analyzing your explanation…</span>
                          <span className="text-xs text-muted-foreground">Transcribing audio & evaluating approach</span>
                        </div>
                        {/* Fake JSON appearing */}
                        <div className="w-full max-w-sm overflow-hidden rounded-lg border bg-muted/30 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                          <motion.pre
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                          >
{`{
  "transcribing": true,
  "keywords_found": ["hash map", "O(n)", "target"],
  "evaluating": "approach + complexity"
}`}
                          </motion.pre>
                        </div>
                      </motion.div>
                    )}

                    {/* Phase 3 — Result / Feedback */}
                    {phase === 3 && (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center gap-5 py-4"
                      >
                        <div className="grid gap-6 sm:grid-cols-[auto_1fr] w-full max-w-md items-center">
                          <ScoreRing value={RESULT.overall} label="Overall" size={120} stroke={8} />
                          <div className="flex flex-col gap-2.5">
                            {RESULT.breakdown.map((b) => (
                              <div key={b.key} className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{b.label}</span>
                                  <span className="font-medium tabular-nums">{b.score}%</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                  <motion.span
                                    className="block h-full rounded-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${b.score}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Mock evaluation JSON */}
                        <div className="w-full max-w-md overflow-hidden rounded-lg border bg-muted/30 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                          <motion.pre
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                          >
{`{
  "overall_score": ${RESULT.overall},
  "communication": ${RESULT.breakdown[0].score},
  "approach": ${RESULT.breakdown[1].score},
  "complexity": ${RESULT.breakdown[2].score},
  "edge_cases": ${RESULT.breakdown[3].score},
  "coach": "Great job! Consider discussing space complexity."
}`}
                          </motion.pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Looping indicator */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                Demo auto-plays — all controls are disabled
              </span>
            </p>
          </motion.div>

          {/* Steps grid (existing how-it-works content, summarized) */}
          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
              Four simple steps
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { n: '01', title: 'Pick a problem', desc: 'Choose from a curated set of DSA problems across every core pattern.' },
                { n: '02', title: 'Think out loud', desc: 'Talk through your approach out loud, exactly like a live interview.' },
                { n: '03', title: 'Submit your explanation', desc: 'We capture a clean transcript of everything you reasoned through.' },
                { n: '04', title: 'Get actionable feedback', desc: 'Receive a scored breakdown with concrete ways to improve.' },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-medium text-primary">{step.n}</span>
                    <span className="text-base font-semibold tracking-tight">{step.title}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
