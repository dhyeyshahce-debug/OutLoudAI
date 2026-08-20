import Link from "next/link"
import { ArrowRight, Award, Flame, Gauge, MessagesSquare, Mic, Target } from "lucide-react"

import { currentUser, scenarios, sessionHistory, weeklyActivity } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/app/page-header"
import { StatCard } from "@/components/app/stat-card"
import { ScenarioCard } from "@/components/app/scenario-card"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DifficultyBadge } from "@/components/difficulty-badge"

export default function DashboardPage() {
  const recommended = scenarios.slice(0, 3)
  const recent = sessionHistory.slice(0, 4)
  const maxActivity = Math.max(...weeklyActivity.map((d) => d.minutes))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader
        title={`Welcome back, ${currentUser.name.split(" ")[0]}`}
        description="You are on a 6-day streak. Keep the momentum going with a quick session."
      >
        <Link href="/practice" className={cn(buttonVariants())}>
          <Mic data-icon="inline-start" />
          Start a session
        </Link>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Overall score" value={82} unit="/ 100" delta="+6 this week" icon={Gauge} />
        <StatCard label="Sessions" value={48} delta="+4 this week" icon={MessagesSquare} />
        <StatCard label="Day streak" value={6} unit="days" delta="Personal best" icon={Flame} />
        <StatCard label="Goals hit" value={12} unit="/ 15" delta="80% rate" icon={Target} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>This week</CardTitle>
            <CardDescription>Minutes spoken per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-44 items-end justify-between gap-3">
              {weeklyActivity.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-all",
                        day.minutes === maxActivity ? "bg-primary" : "bg-primary/25",
                      )}
                      style={{ height: `${Math.max((day.minutes / maxActivity) * 100, 6)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next goal */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="size-4 text-primary" />
              Next milestone
            </CardTitle>
            <CardDescription>Reach a 90 clarity score</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-semibold tabular-nums">86</span>
                <span className="text-sm text-muted-foreground">/ 90</span>
              </div>
              <Progress value={(86 / 90) * 100} />
              <p className="text-sm text-muted-foreground">
                4 points to go. Focus on reducing filler words in your next session.
              </p>
            </div>
            <Link href="/progress" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
              View progress
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recommended scenarios */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recommended for you</h2>
          <Link
            href="/practice"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Browse all
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((s) => (
            <ScenarioCard key={s.id} scenario={s} />
          ))}
        </div>
      </section>

      {/* Recent sessions */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent sessions</h2>
          <Link
            href="/history"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View history
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <Card>
          <ul className="divide-y divide-border">
            {recent.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/results/${session.id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-lg">
                    {session.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{session.title}</p>
                    <p className="text-sm text-muted-foreground">{session.date}</p>
                  </div>
                  <DifficultyBadge level={session.difficulty} className="hidden sm:inline-flex" />
                  <div className="flex w-14 flex-col items-end">
                    <span className="text-lg font-semibold tabular-nums">{session.score}</span>
                    <span className="text-xs text-muted-foreground">score</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  )
}
