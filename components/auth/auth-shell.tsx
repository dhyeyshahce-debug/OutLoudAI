import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40 mask-fade-edges" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <header className="relative flex items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" aria-label="OUTLOUD AI home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <div className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border bg-card/70 p-6 shadow-xl shadow-primary/5 backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex flex-col gap-1.5 text-center">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
          <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>
        </div>
      </div>
    </main>
  )
}
