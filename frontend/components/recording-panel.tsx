'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  CheckCircle2,
  Mic,
  Play,
  RotateCcw,
  Square,
  Upload,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Waveform } from '@/components/waveform'
import { cn } from '@/lib/utils'

type RecState = 'idle' | 'recording' | 'recorded'

type EvaluationRequest = {
  problem_id: string
  scores: Record<string, number>
  student_answer: {
    time_complexity: string
    space_complexity?: string
    explanation: string
  }
  expected_time_complexity?: string
  expected_space_complexity?: string
  session_id?: string
}

type EvaluationResponse = {
  complexity_check: {
    stated_time: string
    expected_time: string | null
    matches: boolean
    sanity_passed: boolean
    reason: string
  }
  feedback: {
    strengths: string[]
    weaknesses: string[]
    progressive_hints: string[]
  }
}

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
  onSubmit?: (request: EvaluationRequest) => void
  submitting?: boolean
  className?: string
}) {
  const [state, setState] = useState<RecState>('idle')
  const [seconds, setSeconds] = useState(0)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [evaluation, setEvaluation] =
    useState<EvaluationResponse | null>(null)

  const [error, setError] = useState('')

  const intervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (state === 'recording') {
      intervalRef.current = setInterval(
        () => setSeconds((s) => s + 1),
        1000,
      )
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state])

  const start = () => {
    setSeconds(0)
    setState('recording')
    setSubmitted(false)
    setEvaluation(null)
    setError('')
  }

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setState('recorded')
  }

  const reset = () => {
    setSeconds(0)
    setState('idle')
    setSubmitted(false)
    setEvaluation(null)
    setError('')
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitted(false)
    setEvaluation(null)
    setError('')

    /*
     * TEMPORARY TEST DATA
     *
     * Later this will be replaced by:
     * - Yug's Track 1 scores
     * - Kunj's transcript
     * - actual problem/session data
     */
    const evaluationRequest: EvaluationRequest = {
      problem_id: 'two-sum',

      scores: {},

      student_answer: {
        time_complexity: 'O(n)',
        space_complexity: 'O(n)',
        explanation:
          'I use a hash map to store previously seen values and find the required complement.',
      },

      expected_time_complexity: 'O(n)',
      expected_space_complexity: 'O(n)',
    }

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:8000'

      const response = await fetch(
        `${baseUrl}/api/evaluation/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(evaluationRequest),
        },
      )

      /*
       * Read the response only once.
       */
      const body = await response
        .json()
        .catch(() => null)

      /*
       * IMPORTANT:
       * Do NOT throw an Error here.
       *
       * Throwing from the click handler was causing
       * the Next.js red error overlay.
       */
      if (!response.ok) {
        setError(
          body?.detail ||
            `Evaluation failed (${response.status}).`,
        )
        return
      }

      /*
       * Successful evaluation.
       */
      setEvaluation(body as EvaluationResponse)
      setSubmitted(true)

      /*
       * Keep existing parent callback support.
       */
      onSubmit?.(evaluationRequest)

      console.log(
        'OutLoudAI Evaluation Result:',
        body,
      )
    } catch (err) {
      console.error(
        'Evaluation API Error:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the evaluation server.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const busy = submitting || isSubmitting

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card/60 p-6 backdrop-blur-sm sm:p-8',
        className,
      )}
    >
      <AnimatePresence mode="wait">

        {/* ================= IDLE ================= */}

        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {idleTitle}
            </p>

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
              <span className="text-base font-semibold">
                {ctaLabel}
              </span>

              <span className="text-xs text-muted-foreground">
                {idleHint}
              </span>
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

        {/* ================= RECORDING ================= */}

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

              <span className="text-xs font-medium text-destructive">
                Recording
              </span>
            </div>

            <span className="font-mono text-3xl font-semibold tabular-nums">
              {formatTime(seconds)}
            </span>

            <Waveform
              active
              className="w-full max-w-md"
            />

            <Button
              variant="destructive"
              size="lg"
              onClick={stop}
            >
              <Square data-icon="inline-start" />
              Stop
            </Button>
          </motion.div>
        )}

        {/* ================= RECORDED ================= */}

        {state === 'recorded' && (
          <motion.div
            key="recorded"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-5"
          >
            {/* Submission status */}

            {submitted ? (
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
                <CheckCircle2 className="size-4 text-primary" />

                <span className="text-xs font-medium text-primary">
                  Explanation submitted successfully
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full border bg-muted px-3 py-1">
                <span className="size-2 rounded-full bg-primary" />

                <span className="text-xs font-medium text-muted-foreground">
                  Explanation captured ·{' '}
                  {formatTime(seconds || 42)}
                </span>
              </div>
            )}

            <Waveform className="w-full max-w-md" />

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
              >
                <Play data-icon="inline-start" />
                Replay
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                disabled={busy}
              >
                <RotateCcw data-icon="inline-start" />
                Record again
              </Button>
            </div>

            {!submitted && (
              <Button
                size="lg"
                className="w-full max-w-xs"
                onClick={handleSubmit}
                disabled={busy}
              >
                {busy
                  ? 'Generating feedback…'
                  : 'Submit Explanation'}
              </Button>
            )}

            {/* ================= ERROR ================= */}

            {error && (
              <div className="w-full max-w-xl rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* ================= EVALUATION ================= */}

            {evaluation && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="w-full max-w-xl space-y-5 rounded-xl border bg-background/60 p-5"
              >
                {/* Complexity */}

                <div>
                  <h3 className="mb-3 text-sm font-semibold">
                    Complexity Check
                  </h3>

                  <div className="space-y-1 text-sm">
                    <p>
                      Stated:{' '}
                      <strong>
                        {
                          evaluation
                            .complexity_check
                            .stated_time
                        }
                      </strong>
                    </p>

                    <p>
                      Expected:{' '}
                      <strong>
                        {
                          evaluation
                            .complexity_check
                            .expected_time ??
                          'Unknown'
                        }
                      </strong>
                    </p>

                    <p
                      className={
                        evaluation
                          .complexity_check
                          .matches
                          ? 'text-primary'
                          : 'text-destructive'
                      }
                    >
                      {
                        evaluation
                          .complexity_check
                          .reason
                      }
                    </p>
                  </div>
                </div>

                {/* Strengths */}

                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    Strengths
                  </h3>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {evaluation.feedback.strengths.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="flex gap-2"
                        >
                          <span className="text-primary">
                            ✓
                          </span>

                          <span>{item}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {/* Weaknesses */}

                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    Weaknesses
                  </h3>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {evaluation.feedback.weaknesses.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="flex gap-2"
                        >
                          <span className="text-destructive">
                            •
                          </span>

                          <span>{item}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {/* Progressive Hints */}

                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    Progressive Hints
                  </h3>

                  <ol className="space-y-2 text-sm text-muted-foreground">
                    {evaluation.feedback.progressive_hints.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="flex gap-2"
                        >
                          <span className="font-semibold text-primary">
                            {index + 1}.
                          </span>

                          <span>{item}</span>
                        </li>
                      ),
                    )}
                  </ol>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}