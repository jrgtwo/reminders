import { Plus } from 'lucide-react'

export default function SidebarAddButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <div className="p-3 border-t border-slate-200 dark:border-white/[0.07] shrink-0">
      <button
        onClick={onClick}
        className="flex items-center justify-center gap-2 w-full text-[13px] font-medium text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] border-b-[2.5px] border-b-slate-300 dark:border-b-white/[0.18] px-3 py-2 rounded-lg hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25 btn-3d"
      >
        <Plus size={20} />
        {label}
      </button>
    </div>
  )
}
