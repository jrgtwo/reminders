import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  onPrev: () => void
  onNext: () => void
}

export function Pagination({ page, totalPages, totalItems, onPrev, onNext }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-2 py-2">
      <span className="text-[12px] text-slate-400 dark:text-white/55">
        {totalItems} items
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="p-1 rounded-md text-slate-400 dark:text-white/55 hover:bg-slate-100 dark:hover:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] border-b-[2px] border-b-slate-300 dark:border-b-white/[0.18] active:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-[12px] text-slate-500 dark:text-white/60 tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="p-1 rounded-md text-slate-400 dark:text-white/55 hover:bg-slate-100 dark:hover:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] border-b-[2px] border-b-slate-300 dark:border-b-white/[0.18] active:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
