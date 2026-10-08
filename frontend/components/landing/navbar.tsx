'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button, buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/components/auth/auth-context'
import { cn } from '@/lib/utils'

const links = [
  { label: 'How it Works', href: '/how-it-works' },
  { label: 'Practice', href: '/practice' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b bg-background/70 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="OUTLOUD AI home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === l.href
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline truncate max-w-[140px]">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="gap-1.5"
              >
                <LogOut className="size-3.5" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}
              >
                Sign In
              </Link>
              <Link href="/signup" className={cn(buttonVariants({ size: 'sm' }))}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

