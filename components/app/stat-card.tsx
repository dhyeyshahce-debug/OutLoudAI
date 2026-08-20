import type { LucideIcon } from "lucide-react"
import { TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export function StatCard({
  label,
  value,
  unit,
  delta,
  icon: Icon,
}: {
  label: string
  value: string | number
  unit?: string
  delta?: string
  icon: LucideIcon
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tabular-nums tracking-tight">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {delta && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            <TrendingUp className="size-3.5" />
            {delta}
          </span>
        )}
      </CardContent>
    </Card>
  )
}
