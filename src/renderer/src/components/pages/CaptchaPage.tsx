import { useState, useEffect } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'

export default function CaptchaPage() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setEmail(params.get('email') ?? '')
  }, [])

  function handleSuccess(token: string) {
    const redirect = `reminders://captcha?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
    window.location.href = redirect
    setDone(true)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] flex flex-col items-center justify-center gap-4 p-6">
      {done ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Returning to app…</p>
      ) : error ? (
        <p className="text-sm text-red-500">Verification failed. Please close and try again.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400">Complete the security check to continue</p>
          <Turnstile
            siteKey={import.meta.env.VITE_CAPTCHA_SITE_KEY}
            onSuccess={handleSuccess}
            onError={() => setError(true)}
          />
        </>
      )}
    </div>
  )
}
