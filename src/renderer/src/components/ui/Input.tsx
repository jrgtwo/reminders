import { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: Props) {
  const isDateTimeEmpty =
    (props.type === 'date' || props.type === 'time') && !props.value

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      )}
      <input
        className={`rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-elevated)] px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#6498c8] focus:border-transparent ${isDateTimeEmpty ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
