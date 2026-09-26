import Link from "next/link"
import { ArrowUpRight, Clock } from "lucide-react"

import type { Scenario } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DifficultyBadge } from "@/components/difficulty-badge"

export function ScenarioCard({ scenario, className }: { scenario: Scenario; className?: string }) {
  return (
    <Link
      href={`/practice/${scenario.id}`}
      className={cn(
        "group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
        className,
      )}
    >
      <Card className="flex h-full flex-col gap-4 p-5 transition-all group-hover:border-primary/40 group-hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-xl">
            {scenario.emoji}
          </span>
          <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <h3 className="font-medium leading-snug text-pretty">{scenario.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{scenario.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge level={scenario.difficulty} />
          <Badge variant="secondary" className="gap-1 font-normal">
            <Clock className="size-3" />
            {scenario.duration}
          </Badge>
        </div>
      </Card>
    </Link>
  )
}
