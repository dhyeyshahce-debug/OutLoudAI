'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (password !== confirm) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If Supabase requires email confirmation
    if (data.user && !data.session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    router.push('/practice')
  }

  if (success) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We sent you a confirmation link. Click it to activate your account, then sign in."
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            Go to Sign In
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="grid size-14 place-items-center rounded-full bg-primary/10">
            <svg viewBox="0 0 24 24" className="size-7 text-primary" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              <path d="m16 19 2 2 4-4" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Didn&apos;t get the email? Check your spam folder.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Start practicing out loud."
      subtitle="Create an account to begin your first session."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" name="name" placeholder="Aarav Sharma" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm">Confirm Password</FieldLabel>
            <Input id="confirm" name="confirm" type="password" placeholder="••••••••" required />
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </FieldGroup>
      </form>
    </AuthShell>
  )
}

