import type { Theme, TimeFormat } from './hooks/useSettingsPage'

export default function AppearanceSection({
  theme,
  setTheme,
  timeFormat,
  setTimeFormat,
}: {
  theme: Theme
  setTheme: (t: Theme) => void
  timeFormat: TimeFormat
  setTimeFormat: (f: TimeFormat) => void
}) {
  const themes: { id: Theme; label: string; header: string; body: string }[] = [
    { id: 'light', label: 'Light', header: '#1c1f26', body: '#F3F4F6' },
    { id: 'dark', label: 'Dark', header: '#010409', body: '#0d1117' },
    { id: 'dim', label: 'Dim', header: '#1c2128', body: '#22272e' },
    { id: 'warm', label: 'Warm', header: '#100e0a', body: '#18150f' },
    { id: 'midnight', label: 'Midnight', header: '#060606', body: '#000000' },
    { id: 'nord', label: 'Nord', header: '#242933', body: '#2e3440' },
    { id: 'forest', label: 'Forest', header: '#0d150d', body: '#141f14' },
    { id: 'dusk', label: 'Dusk', header: '#0f0a16', body: '#16101e' },
    { id: 'grey', label: 'Grey', header: '#111111', body: '#1a1a1a' },
  ]

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Appearance
      </h2>
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] space-y-3">
        <p className="text-sm font-medium">Theme</p>
        <div className="grid grid-cols-4 gap-3">
          {themes.map(({ id, label, header, body }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`flex flex-col items-center gap-2 group`}
            >
              <div
                className={`w-full aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                  theme === id
                    ? 'border-blue-500 shadow-md shadow-blue-500/20'
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <div className="h-[30%]" style={{ background: header }} />
                <div className="h-[70%]" style={{ background: body }} />
              </div>
              <span
                className={`text-xs font-medium ${theme === id ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Time format</p>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200 dark:bg-[var(--bg-elevated)]">
            {(['12h', '24h'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setTimeFormat(fmt)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  timeFormat === fmt
                    ? 'bg-white dark:bg-[var(--bg-card)] text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
