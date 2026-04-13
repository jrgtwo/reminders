import type { RecurrenceRule } from '../../types/models'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const selectClass =
  'rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-elevated)] text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-ring)] focus:ring-1 focus:ring-[var(--accent-ring)]'

const numberClass =
  'w-16 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-elevated)] text-gray-900 dark:text-gray-100 px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[var(--accent-ring)] focus:ring-1 focus:ring-[var(--accent-ring)]'

interface Props {
  value: RecurrenceRule
  onChange: (r: RecurrenceRule) => void
}

export default function RecurrenceEditor({ value, onChange }: Props) {
  function set<K extends keyof RecurrenceRule>(key: K, val: RecurrenceRule[K]) {
    onChange({ ...value, [key]: val })
  }

  const unitLabel =
    value.frequency === 'daily'
      ? 'day(s)'
      : value.frequency === 'weekly'
        ? 'week(s)'
        : value.frequency === 'monthly'
          ? 'month(s)'
          : 'year(s)'

  return (
    <div className="flex flex-col gap-4">
      {/* Frequency */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
        <select
          value={value.frequency}
          onChange={(e) => set('frequency', e.target.value as RecurrenceRule['frequency'])}
          className={selectClass}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* Interval */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700 dark:text-gray-300">Every</span>
        <input
          type="number"
          min={1}
          value={value.interval}
          onChange={(e) => set('interval', Math.max(1, parseInt(e.target.value) || 1))}
          className={numberClass}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">{unitLabel}</span>
      </div>

      {/* Day-of-week pills — weekly only */}
      {value.frequency === 'weekly' && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">On days</label>
          <div className="flex gap-1">
            {DAY_LABELS.map((label, i) => {
              const active = value.byDay?.includes(i) ?? false
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const current = value.byDay ?? []
                    const next = active ? current.filter((d) => d !== i) : [...current, i]
                    set('byDay', next.sort((a, b) => a - b))
                  }}
                  className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[var(--accent)] text-[#f0f0f0]'
                      : 'bg-gray-100 dark:bg-[var(--bg-elevated)] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* End condition */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ends</label>
        <div className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="recurrence-end"
              checked={!value.endDate && value.count === undefined}
              onChange={() => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { endDate: _e, count: _c, ...rest } = value
                onChange(rest as RecurrenceRule)
              }}
            />
            Never
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="recurrence-end"
              checked={!!value.endDate}
              onChange={() => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { count: _c, ...rest } = value
                onChange({ ...rest, endDate: new Date().toISOString().slice(0, 10) })
              }}
            />
            On date
            {value.endDate && (
              <input
                type="date"
                value={value.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className="ml-1 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-card)] text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:border-[var(--accent-ring)] focus:ring-1 focus:ring-[var(--accent-ring)]"
              />
            )}
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="recurrence-end"
              checked={value.count !== undefined && !value.endDate}
              onChange={() => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { endDate: _e, ...rest } = value
                onChange({ ...rest, count: 10 })
              }}
            />
            After
            {value.count !== undefined && !value.endDate && (
              <input
                type="number"
                min={1}
                value={value.count}
                onChange={(e) => set('count', Math.max(1, parseInt(e.target.value) || 1))}
                className={numberClass}
              />
            )}
            occurrences
          </label>
        </div>
      </div>
    </div>
  )
}
