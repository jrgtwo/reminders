import { useState } from 'react'
import { Mail, Check, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import Button from './ui/Button'

export default function SignInPage() {
  const sendMagicLink = useAuthStore((s) => s.sendMagicLink)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    try {
      await sendMagicLink(email.trim())
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Sign in</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email to receive a sign-in link.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            <Check size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Check your email</p>
              <p className="text-xs mt-0.5 opacity-80">We sent a sign-in link to {email}</p>
            </div>
            <button
              className="ml-auto text-xs underline opacity-70 hover:opacity-100 shrink-0"
              onClick={() => setStatus('idle')}
            >
              Change
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" className="w-full justify-center" disabled={status === 'sending'}>
              <Mail size={14} />
              {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
            </Button>
            {status === 'error' && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={12} />
                Failed to send — check your email and try again.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
