import { Turnstile } from '@marsidev/react-turnstile'
import { Mail, Check, AlertCircle } from 'lucide-react'
import Button from './ui/Button'
import { useSignIn } from './hooks/useSignIn'

export default function SignInPage() {
  const { email, setEmail, status, setStatus, captchaToken, setCaptchaToken, turnstileRef, handleSubmit } =
    useSignIn()

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[var(--bg-app)] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Sign in</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email to receive a sign-in link.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            <Check size={20} className="mt-0.5 shrink-0" />
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
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-card)] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Turnstile
              ref={turnstileRef}
              siteKey={import.meta.env.VITE_CAPTCHA_SITE_KEY}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
            <Button
              type="submit"
              className="w-full justify-center"
              disabled={status === 'sending' || !captchaToken}
            >
              <Mail size={20} />
              {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
            </Button>
            {status === 'error' && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-[#e8a045]">
                <AlertCircle size={20} />
                Failed to send — check your email and try again.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
