import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export default function ErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  let title = 'Something went wrong'
  let message = 'An unexpected error occurred.'

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page not found'
      message = 'The page you were looking for doesn\u2019t exist.'
    } else {
      title = `${error.status} ${error.statusText}`
      message = error.data?.message || 'An error occurred while loading this page.'
    }
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--bg-app)] text-slate-900 dark:text-slate-100">
      <div className="flex flex-col items-center gap-4 text-center px-6 max-w-md">
        <AlertTriangle size={48} className="text-[#e8a045]" />
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-white/50">{message}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
        >
          Go home
        </button>
      </div>
    </div>
  )
}
