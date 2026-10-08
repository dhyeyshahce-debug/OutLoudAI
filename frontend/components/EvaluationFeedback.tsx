"use client"

import { useState } from "react"

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

type Props = {
  request: EvaluationRequest
}

export default function EvaluationFeedback({ request }: Props) {
  const [result, setResult] = useState<EvaluationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function runEvaluation() {
    setLoading(true)
    setError("")

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

      const response = await fetch(
        `${baseUrl}/api/evaluation/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => null)

        throw new Error(
          body?.detail || "Evaluation failed."
        )
      }

      const data: EvaluationResponse = await response.json()

      setResult(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Evaluation failed."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <button
        onClick={runEvaluation}
        disabled={loading}
      >
        {loading
          ? "Generating feedback..."
          : "Get Feedback"}
      </button>

      {error && <p>{error}</p>}

      {result && (
        <>
          <h3>Complexity Check</h3>

          <p>
            Stated:{" "}
            <strong>
              {result.complexity_check.stated_time}
            </strong>
          </p>

          <p>
            Expected:{" "}
            <strong>
              {result.complexity_check.expected_time ?? "Unknown"}
            </strong>
          </p>

          <p>
            {result.complexity_check.reason}
          </p>

          <h3>Strengths</h3>

          <ul>
            {result.feedback.strengths.map(
              (item, index) => (
                <li key={index}>{item}</li>
              )
            )}
          </ul>

          <h3>Weaknesses</h3>

          <ul>
            {result.feedback.weaknesses.map(
              (item, index) => (
                <li key={index}>{item}</li>
              )
            )}
          </ul>

          <h3>Progressive Hints</h3>

          <ol>
            {result.feedback.progressive_hints.map(
              (item, index) => (
                <li key={index}>{item}</li>
              )
            )}
          </ol>
        </>
      )}
    </section>
  )
}