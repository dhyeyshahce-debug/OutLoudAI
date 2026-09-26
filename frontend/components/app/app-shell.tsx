"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, PanelLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { SidebarNav } from "@/components/app/sidebar-nav"
import { UserMenu } from "@/components/app/user-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out lg:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
          {collapsed ? <Logo iconOnly /> : <Logo />}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav collapsed={collapsed} />
        </div>

        <div className="border-t border-sidebar-border p-3">
          <div className={cn("mb-2 flex", collapsed ? "justify-center" : "justify-end")}>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft />
            </Button>
          </div>
          <UserMenu collapsed={collapsed} />
        </div>
      </aside>

      {/* Main column */}
      <div className={cn("flex min-h-svh flex-col transition-[padding] duration-300 ease-out", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" aria-label="Open navigation">
                  <Menu />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-16 items-center border-b border-sidebar-border px-4">
                <Logo />
              </div>
              <div className="p-3" onClick={() => setMobileOpen(false)}>
                <SidebarNav />
              </div>
              <div className="border-t border-sidebar-border p-3">
                <UserMenu />
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" aria-label="OUTLOUD AI home">
            <Logo />
          </Link>

          <ThemeToggle />
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
