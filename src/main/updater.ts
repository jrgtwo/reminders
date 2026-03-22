import { autoUpdater } from 'electron-updater'
import { dialog } from 'electron'
import { is } from '@electron-toolkit/utils'

export function setupAutoUpdater(): void {
  if (is.dev) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-downloaded', async () => {
    const { response } = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'A new version has been downloaded. Restart to install it.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    })
    if (response === 0) {
      autoUpdater.quitAndInstall()
    }
  })

  // Silently ignore when no update server is configured
  autoUpdater.checkForUpdatesAndNotify().catch(() => {})
}
