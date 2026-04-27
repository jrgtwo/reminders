import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import Dialog from './ui/Dialog'
import { useUIStore } from '../store/ui.store'

export default function SignInWall(): ReactElement | null {
  const open = useUIStore((s) => s.signInWallOpen)
  const setOpen = useUIStore((s) => s.setSignInWallOpen)
  const navigate = useNavigate()

  if (!open) return null

  const close = (): void => setOpen(false)

  const goToSignIn = (): void => {
    setOpen(false)
    navigate('/account')
  }

  return (
    <Dialog title="Sign in to save your data" onClose={close}>
      <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed mb-5">
        The web version requires a free account so your data can be encrypted and synced to your
        devices instead of left in this browser.
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={close}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={goToSignIn}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] hover:brightness-110 text-white transition-all"
        >
          Sign in
        </button>
      </div>
    </Dialog>
  )
}
