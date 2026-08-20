'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { buttonVariants } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

export function CtaFooter() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center sm:px-12"
        >
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-40 mask-fade-edges" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto max-w-xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Your next interview starts with an explanation.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-muted-foreground">
              Speak your first approach in under a minute. No setup, no code editor —
              just you and the problem.
            </p>
            <div className="mt-8">
              <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }))}>
                Start Practicing
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} OUTLOUD AI. Built for thinkers.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/login" className="transition-colors hover:text-foreground">
              Sign In
            </Link>
            <Link href="/signup" className="transition-colors hover:text-foreground">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}
