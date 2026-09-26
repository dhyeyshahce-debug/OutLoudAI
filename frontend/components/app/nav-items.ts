import {
  History,
  LayoutDashboard,
  Mic,
  Settings,
  TrendingUp,
} from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Practice', href: '/practice', icon: Mic },
  { label: 'History', href: '/history', icon: History },
  { label: 'Progress', href: '/progress', icon: TrendingUp },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const
