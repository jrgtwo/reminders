import { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export default function Button({ variant = 'primary', size = 'md', className = '', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-[translate,box-shadow,background-color,border-color,filter] duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-[3px] hover:shadow-lg dark:hover:shadow-none dark:hover:brightness-125 dark:hover:border-white/25 active:translate-y-[1px] active:shadow-sm dark:active:shadow-none dark:active:brightness-100'

  const variants = {
    primary: 'bg-blue-500 dark:bg-[#6498c8] hover:bg-blue-600 dark:hover:bg-[#7aabd4] text-[#f0f0f0] focus:ring-blue-500 dark:focus:ring-[#6498c8] border border-blue-600/30 dark:border-[#5a89b5]/40 border-b-[2.5px] border-b-blue-700/40 dark:border-b-[#4a6f8f]/60',
    ghost:
      'hover:bg-gray-100 dark:hover:bg-[var(--bg-elevated)] text-gray-700 dark:text-gray-300 focus:ring-gray-400 border border-slate-200 dark:border-white/[0.1] border-b-[2.5px] border-b-slate-300 dark:border-b-white/[0.18]',
    danger: 'bg-red-600 hover:bg-red-700 text-[#f0f0f0] focus:ring-red-500 border border-red-700/30 border-b-[2.5px] border-b-red-800/40',
  }

  const sizes = {
    sm: 'text-sm px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
  )
}
