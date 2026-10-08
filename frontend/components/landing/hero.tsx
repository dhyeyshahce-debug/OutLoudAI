'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { DifficultyBadge } from '@/components/difficulty-badge'
import { RecordingPanel } from '@/components/recording-panel'
import { cn } from '@/lib/utils'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-12 sm:pt-32 sm:pb-16">
      {/* backgrounds */}
      <div className="pointer-events-none absolute inset-0 grid-bg mask-fade-edges opacity-70" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <Sparkles className="size-3.5 text-primary" />
            Audio-first DSA interview practice
          </div>

          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            <span className="text-gradient">Think out loud.</span>
            <br />
            Interview smarter.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Practice explaining DSA problems like you&apos;re in a real technical
            interview. Speak your approach, get evaluated, and learn where you can
            improve.
          </p>

          <div className="mt-7 flex items-center justify-center gap-3">
            <Link href="/practice" className={cn(buttonVariants({ size: 'lg' }))}>
              Start Practicing
            </Link>
            <Link
              href="/how-it-works"
              className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}
            >
              How it works
            </Link>
          </div>
        </motion.div>

        {/* central interaction box */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="mx-auto mt-14 max-w-2xl"
        >
          <div className="rounded-3xl border bg-card/50 p-2 shadow-xl shadow-primary/5 backdrop-blur-sm">
            <div className="rounded-[calc(var(--radius)*2)] border bg-background/40 p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Your problem
                  </span>
                  <span className="text-lg font-semibold tracking-tight">Two Sum</span>
                </div>
                <DifficultyBadge difficulty="Easy" />
              </div>
              <p className="mb-6 text-left text-sm leading-relaxed text-muted-foreground">
                Given an array of integers and a target, return the indices of the two
                numbers that add up to the target.
              </p>
              <RecordingPanel
                idleTitle="Explain how you would approach this."
                ctaLabel="Start speaking"
                idleHint="No coding. Just explain your thinking."
                className="border-dashed bg-transparent p-0 sm:p-0"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
