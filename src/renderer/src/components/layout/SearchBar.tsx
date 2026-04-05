import { forwardRef, useState } from 'react'
import { Search, Bell, CheckSquare, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '../../hooks/useSearch'
import type { Reminder, TodoListItem, Note } from '../../types/models'
import { parseDateStr } from '../../utils/dates'

function formatNoteDate(dateStr: string): string {
  const d = parseDateStr(dateStr)
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

const SearchBar = forwardRef<HTMLInputElement>(function SearchBar(_props, ref) {
  const [query, setQuery] = useState('')
  const results = useSearch(query)
  const navigate = useNavigate()

  const hasResults = results.reminders.length > 0 || results.items.length > 0 || results.notes.length > 0
  const open = query.trim().length > 0 && hasResults

  function handleReminderClick(r: Reminder) {
    setQuery('')
    navigate(`/day/${r.date}`, { state: { tab: 'reminders' } })
  }

  function handleItemClick(i: TodoListItem) {
    setQuery('')
    navigate(`/lists/${i.listId}`)
  }

  function handleNoteClick(n: Note) {
    setQuery('')
    navigate(`/day/${n.date}`)
  }

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          ref={ref}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery('')
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          placeholder="Search… (/)"
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-white/[0.08] border border-transparent dark:border-white/[0.1] focus:border-blue-400 dark:focus:border-white/25 focus:bg-white dark:focus:bg-white/[0.12] focus:outline-none focus:ring-1 focus:ring-blue-400/20 dark:focus:ring-white/15 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 transition-all"
        />
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-[var(--bg-search)] dark:backdrop-blur-xl rounded-xl shadow-xl shadow-black/20 dark:shadow-black/50 border border-gray-200 dark:border-white/[0.1] overflow-hidden">
          {results.reminders.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wide border-b border-gray-100 dark:border-white/[0.07]">
                Reminders
              </div>
              {results.reminders.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleReminderClick(r)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-all"
                >
                  <Bell size={14} className="text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white/80 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 dark:text-white/30">{r.date}</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {results.items.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wide border-b border-gray-100 dark:border-white/[0.07]">
                Todos
              </div>
              {results.items.map((i) => (
                <button
                  key={i.id}
                  onClick={() => handleItemClick(i)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-all"
                >
                  <CheckSquare
                    size={14}
                    className={`shrink-0 ${i.completed ? 'text-gray-300 dark:text-white/20' : 'text-[#6498c8]'}`}
                  />
                  <div className="min-w-0">
                    <p className={`text-sm truncate ${i.completed ? 'line-through text-gray-400 dark:text-white/30' : 'text-gray-900 dark:text-white/80'}`}>{i.title}</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {results.notes.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wide border-b border-gray-100 dark:border-white/[0.07]">
                Notes
              </div>
              {results.notes.map((n) => (
                <button
                  key={n.date}
                  onClick={() => handleNoteClick(n)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-all"
                >
                  <FileText size={14} className="text-slate-400 dark:text-white/30 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white/80 truncate leading-snug">
                      {n.content.split('\n').find((l) => l.trim()) ?? n.date}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-white/30">{formatNoteDate(n.date)}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
})

export default SearchBar
