'use client'

import { motion } from 'motion/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DifficultyBadge } from '@/components/difficulty-badge'
import { Waveform } from '@/components/waveform'
import { ScoreRing } from '@/components/score-ring'
import { RESULT } from '@/lib/mock-data'

export function Showcase() {
  return (
    <section id="showcase" className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">The product</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          One calm space to practice.
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-10 sm:mt-12 max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/5"
      >
        {/* browser chrome */}
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
          <span className="size-3 rounded-full bg-muted-foreground/25" />
          <span className="size-3 rounded-full bg-muted-foreground/25" />
          <span className="size-3 rounded-full bg-muted-foreground/25" />
          <div className="ml-3 hidden flex-1 sm:block">
            <div className="mx-auto w-fit rounded-md border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
              app.outloud.ai / practice
            </div>
          </div>
        </div>

        <Tabs defaultValue="practice" className="gap-0">
          <div className="border-b px-4 pt-3">
            <TabsList className="bg-transparent">
              <TabsTrigger value="practice">Practice</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-[340px] bg-background/40 p-6 sm:p-8">
            <TabsContent value="practice" className="mt-0">
              <div className="mx-auto flex max-w-lg flex-col gap-5">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold tracking-tight">Two Sum</span>
                  <DifficultyBadge difficulty="Easy" />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Given an array of integers and a target, return the indices of the two
                  numbers that add up to the target.
                </p>
                <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-8">
                  <div className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1">
                    <span className="size-2 animate-pulse rounded-full bg-destructive" />
                    <span className="text-xs font-medium text-destructive">Recording</span>
                  </div>
                  <span className="font-mono text-2xl font-semibold">1:12</span>
                  <Waveform active className="w-full max-w-xs" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="mt-0">
              <div className="mx-auto max-w-lg">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Live transcript
                </span>
                <p className="mt-3 text-[15px] leading-loose text-foreground/90">
                  {RESULT.transcript.map((seg, i) =>
                    seg.term ? (
                      <span key={i} className="rounded bg-primary/10 px-1 font-medium text-primary">
                        {seg.text}
                      </span>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    ),
                  )}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="mt-0">
              <div className="mx-auto grid max-w-lg items-center gap-6 sm:grid-cols-[auto_1fr]">
                <ScoreRing value={RESULT.overall} label="Overall" size={140} stroke={10} />
                <div className="flex flex-col gap-3">
                  {RESULT.breakdown.map((b) => (
                    <div key={b.key} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{b.label}</span>
                        <span className="font-medium tabular-nums">{b.score}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${b.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </section>
  )
}
