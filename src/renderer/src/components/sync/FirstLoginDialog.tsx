import Dialog from '../ui/Dialog'
import { useSyncStore, type MigrationCase } from '../../store/sync.store'

const COPY: Record<MigrationCase, { title: string; body: string; confirm: string }> = {
  'local-only': {
    title: 'Upload local data to the cloud?',
    body: 'You have local data on this device. Upload it to your account so it syncs across devices.',
    confirm: 'Upload',
  },
  'cloud-only': {
    title: 'Download your cloud data?',
    body: 'Your account has data stored in the cloud. Download it to this device now.',
    confirm: 'Download',
  },
  both: {
    title: 'Merge local and cloud data?',
    body: 'Both this device and your account have existing data. They will be merged together.',
    confirm: 'Merge',
  },
  neither: {
    title: '',
    body: '',
    confirm: '',
  },
}

export default function FirstLoginDialog() {
  const migrationCase = useSyncStore((s) => s.migrationCase)
  const completeMigration = useSyncStore((s) => s.completeMigration)

  if (!migrationCase) return null

  const { title, body, confirm } = COPY[migrationCase]

  return (
    <Dialog title={title} onClose={() => completeMigration('skip')}>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{body}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => completeMigration('skip')}
          className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[var(--bg-elevated)] transition-colors"
        >
          Skip
        </button>
        <button
          onClick={() => completeMigration('sync')}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {confirm}
        </button>
      </div>
    </Dialog>
  )
}
