import { useRef, useState } from 'react'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useAuthStore } from '../../store/auth.store'

export function useSignIn() {
  const sendMagicLink = useAuthStore((s) => s.sendMagicLink)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setErrorMessage(null)
    try {
      await sendMagicLink(email.trim(), captchaToken ?? undefined)
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : String(err))
      turnstileRef.current?.reset()
      setCaptchaToken(null)
    }
  }

  return { email, setEmail, status, setStatus, errorMessage, captchaToken, setCaptchaToken, turnstileRef, handleSubmit }
}
