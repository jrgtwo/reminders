import { useRef, useState } from 'react'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useAuthStore } from '../../store/auth.store'

export function useSignIn() {
  const sendMagicLink = useAuthStore((s) => s.sendMagicLink)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim() || !captchaToken) return
    setStatus('sending')
    try {
      await sendMagicLink(email.trim(), captchaToken)
      setStatus('sent')
    } catch {
      setStatus('error')
      turnstileRef.current?.reset()
      setCaptchaToken(null)
    }
  }

  return { email, setEmail, status, setStatus, captchaToken, setCaptchaToken, turnstileRef, handleSubmit }
}
