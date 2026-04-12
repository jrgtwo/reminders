import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function SidebarHeader({
  title,
  collapsed,
  onToggle,
  side = 'left',
}: {
  title: string
  collapsed: boolean
  onToggle: () => void
  side?: 'left' | 'right'
}) {
  const chevronWhenOpen = side === 'left' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />
  const chevronWhenClosed = side === 'left' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />

  return (
    <div className="flex items-center px-3 py-2.5 border-b border-black/30 dark:border-black/60 bg-[var(--bg-header)] shrink-0 h-14">
      {side === 'right' && (
        <button
          onClick={onToggle}
          className={`w-6 h-6 flex items-center justify-center rounded text-white/50 hover:text-white/70 hover:bg-white/[0.08] transition-all ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? chevronWhenClosed : chevronWhenOpen}
        </button>
      )}
      {!collapsed && (
        <span
          className={`text-[28px] tracking-tight text-white/80 flex-1 ${side === 'right' ? 'ml-2' : ''}`}
          style={{ fontFamily: "'Bree Serif', serif" }}
        >
          {title}
        </span>
      )}
      {side === 'left' && (
        <button
          onClick={onToggle}
          className={`w-6 h-6 flex items-center justify-center rounded text-white/50 hover:text-white/70 hover:bg-white/[0.08] transition-all ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? chevronWhenClosed : chevronWhenOpen}
        </button>
      )}
    </div>
  )
}
