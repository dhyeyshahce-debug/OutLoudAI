import { cn } from '@/lib/utils'

export function Logo({
  className,
  showWordmark = true,
  size = 'default',
}: {
  className?: string
  showWordmark?: boolean
  size?: 'sm' | 'default'
}) {
  const box = size === 'sm' ? 'size-7' : 'size-8'
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'relative grid place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm',
          box,
        )}
      >
        <MicWave />
      </span>
      {showWordmark && (
        <span className="text-sm font-semibold tracking-tight">
          OUTLOUD <span className="text-primary">AI</span>
        </span>
      )}
    </span>
  )
}

function MicWave() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  )
}
