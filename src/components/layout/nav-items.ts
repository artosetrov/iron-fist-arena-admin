import {
  LayoutDashboard, Database, Users, Swords, Package, Trophy,
  Calendar, Sliders, Scroll, ImageIcon, Settings, Shield, Dice3,
  Coins, ScrollText,
} from 'lucide-react'

export const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Tables', href: '/tables', icon: Database },
  { label: 'Players', href: '/players', icon: Users },
  { label: 'Arena', href: '/matches', icon: Swords },
  { label: 'Economy', href: '/economy', icon: Coins },
  { label: 'Items', href: '/items', icon: ScrollText },
  { label: 'Loot Tables', href: '/loot', icon: Dice3 },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Seasons', href: '/seasons', icon: Trophy },
  { label: 'Achievements', href: '/achievements', icon: Shield },
  { label: 'Live Config', href: '/config', icon: Sliders },
  { label: 'Assets', href: '/assets', icon: ImageIcon },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const
