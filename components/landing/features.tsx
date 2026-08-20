'use client'

import { motion } from 'motion/react'
import { Brain, Gauge, History, MessagesSquare, ShieldCheck } from 'lucide-react'
import { Waveform } from '@/components/waveform'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Brain,
    title: 'Think Clearly',
    desc: 'Structure your reasoning out loud before you ever write a line of code.',
    className: 'md:col-span-2',
    accent: true,
  },
  {
    icon: MessagesSquare,
    title: 'Communicate Better',
    desc: 'Learn to narrate trade-offs the way strong candidates do.',
    className: '',
  },
  {
    icon: Gauge,
    title: 'Understand Complexity',
    desc: 'Get scored on how clearly you reason about time and space.',
    className: '',
  },
  {
    icon: ShieldCheck,
    title: 'Catch Edge Cases',
    desc: 'Surface the inputs you forgot — duplicates, empties, overflow.',
    className: '',
  },
  {
    icon: History,
    title: 'Review Your Sessions',
    desc: 'Replay every explanation and track how your delivery improves over time.',
    className: 'md:col-span-2',
  },
]

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">Why OUTLOUD</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need to explain with confidence.
        </h2>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className={cn(
              'group relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-6',
              f.className,
            )}
          >
            <div className="grid size-10 place-items-center rounded-lg border bg-background text-primary">
              <f.icon className="size-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-semibold tracking-tight">{f.title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
            {f.accent && (
              <Waveform className="mt-2 h-8 w-full max-w-xs opacity-60" bars={32} />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
