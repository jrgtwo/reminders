import type { ReactNode } from 'react'

export default function MobilePageHeader({
  title,
  actions,
}: {
  title: string
  actions?: ReactNode
}) {
  return (
    <div className="flex items-center px-4 py-3 border-b border-black/10 dark:border-white/[0.07] shrink-0">
      <span
        className="text-[28px] tracking-tight text-slate-700 dark:text-white/80 flex-1"
        style={{ fontFamily: "'Bree Serif', serif" }}
      >
        {title}
      </span>
      {actions}
    </div>
  )
}
