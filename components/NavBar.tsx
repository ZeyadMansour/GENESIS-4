'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Chat', icon: '💬' },
  { href: '/terminal', label: 'Term', icon: '⬛' },
  { href: '/memory', label: 'Mem', icon: '🧠' },
  { href: '/skills', label: 'Skills', icon: '⚡' },
  { href: '/cron', label: 'Cron', icon: '⏰' },
  { href: '/settings', label: 'Set', icon: '⚙️' },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center justify-between px-4 py-2 border-b border-genesis-border safe-top bg-genesis-bg/90 backdrop-blur-sm sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-lg">☤</span>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-genesis-muted">
          GENESIS-4
        </span>
      </Link>

      <div className="flex gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-colors ${
                active
                  ? 'bg-genesis-accent text-genesis-fg'
                  : 'text-genesis-muted hover:text-genesis-fg hover:bg-genesis-paper'
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
