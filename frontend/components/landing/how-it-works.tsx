'use client'

import { motion } from 'motion/react'
import { DifficultyBadge } from '@/components/difficulty-badge'
import { Waveform } from '@/components/waveform'
import { RESULT } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const steps = [
  { n: '01', title: 'Pick a problem', desc: 'Choose from a curated set of DSA problems across every core pattern.' },
  { n: '02', title: 'Think out loud', desc: 'Talk through your approach out loud, exactly like a live interview.' },
  { n: '03', title: 'Submit your explanation', desc: 'We capture a clean transcript of everything you reasoned through.' },
  { n: '04', title: 'Get actionable feedback', desc: 'Receive a scored breakdown with concrete ways to improve.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">How it works</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          From problem to confident explanation.
        </h2>
      </div>

      <div className="mt-10 sm:mt-12 grid gap-4 md:grid-cols-2">
        {steps.map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="flex flex-col gap-5 rounded-2xl border bg-card p-6"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-medium text-primary">{step.n}</span>
              <span className="text-lg font-semibold tracking-tight">{step.title}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            <div className="mt-auto">
              <StepMock step={i} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function StepMock({ step }: { step: number }) {
  const frame = 'rounded-xl border bg-background/60 p-4'

  if (step === 0) {
    return (
      <div className={frame}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Problem
            </span>
            <span className="text-sm font-semibold">Two Sum</span>
          </div>
          <DifficultyBadge difficulty="Easy" />
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          <span className="h-1.5 w-full rounded-full bg-muted" />
          <span className="h-1.5 w-4/5 rounded-full bg-muted" />
          <span className="h-1.5 w-2/3 rounded-full bg-muted" />
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className={cn(frame, 'flex flex-col items-center gap-3')}>
        <div className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
        </div>
        <Waveform active bars={28} className="h-9 w-full" />
        <span className="font-mono text-xs text-muted-foreground">0:24</span>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className={frame}>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Transcript
        </span>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          &quot;I&apos;d use a{' '}
          <span className="rounded bg-primary/10 px-1 font-medium text-primary">hash map</span>{' '}
          to store each value and its index, giving{' '}
          <span className="rounded bg-primary/10 px-1 font-medium text-primary">O(n)</span> time…&quot;
        </p>
      </div>
    )
  }

  return (
    <div className={cn(frame, 'flex flex-col gap-3')}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Overall
        </span>
        <span className="text-sm font-semibold">84 / 100</span>
      </div>
      {RESULT.breakdown.slice(0, 3).map((b) => (
        <div key={b.key} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{b.label}</span>
            <span className="font-medium tabular-nums">{b.score}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${b.score}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
