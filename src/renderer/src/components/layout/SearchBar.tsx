import { forwardRef, useState } from 'react'
import { Search, Bell, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '../../hooks/useSearch'
import type { Reminder, Todo } from '../../types/models'

const SearchBar = forwardRef<HTMLInputElement>(function SearchBar(_props, ref) {
  const [query, setQuery] = useState('')
  const results = useSearch(query)
  const navigate = useNavigate()

  const hasResults = results.reminders.length > 0 || results.todos.length > 0
  const open = query.trim().length > 0 && hasResults

  function handleReminderClick(r: Reminder) {
    setQuery('')
    navigate(`/day/${r.date}`)
  }

  function handleTodoClick(_t: Todo) {
    setQuery('')
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
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-gray-700 focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
        />
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {results.reminders.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                Reminders
              </div>
              {results.reminders.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleReminderClick(r)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Bell size={14} className="text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400">{r.date}</p>
                  </div>
                </button>
              ))}
            </>
          )}
          {results.todos.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                Todos
              </div>
              {results.todos.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTodoClick(t)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <CheckSquare
                    size={14}
                    className={`shrink-0 ${t.completed ? 'text-gray-300' : 'text-green-400'}`}
                  />
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{t.title}</p>
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
