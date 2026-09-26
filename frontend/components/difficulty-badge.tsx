import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Difficulty } from '@/lib/mock-data'

const styles: Record<Difficulty, string> = {
  Easy: 'text-emerald-600 dark:text-emerald-400',
  Medium: 'text-amber-600 dark:text-amber-400',
  Hard: 'text-rose-600 dark:text-rose-400',
}

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', className)}>
      <span className={cn('size-1.5 rounded-full bg-current', styles[difficulty])} />
      {difficulty}
    </Badge>
  )
}
