import { ArrowLeft } from 'lucide-react'
import Button from '../ui/Button'
import { useSettingsPage } from './hooks/useSettingsPage'
import SyncSection from './SyncSection'
import SecuritySection from './SecuritySection'
import AppearanceSection from './AppearanceSection'
import DataSection from './DataSection'
import DangerZoneSection from './DangerZoneSection'
import NotificationsSection from './NotificationsSection'
import PrivacySection from './PrivacySection'

const isNativePlatform =
  typeof window !== 'undefined' &&
  (!!(window as any).electronAPI || !!(window as any).Capacitor?.isNativePlatform?.())

export default function SettingsPage() {
  const {
    navigate,
    theme,
    setTheme,
    timeFormat,
    setTimeFormat,
    isLoggedIn,
    syncStatus,
    lastSyncedAt,
    triggerSync,
    migrationPref,
    handleMigrationPrefChange,
    importStatus,
    exporting,
    importing,
    exportingIcal,
    importingIcal,
    rotateStatus,
    setRotateStatus,
    resetStatus,
    setResetStatus,
    clearStatus,
    setClearStatus,
    deleteAccountStatus,
    setDeleteAccountStatus,
    handleDeleteAccountRequest,
    handleRotateKey,
    handleExport,
    handleImport,
    handleExportIcal,
    handleImportIcal,
    handleResetFromCloud,
    handleClearLocalData,
  } = useSettingsPage()

  return (
    <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft size={20} />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>

      {isLoggedIn && (
        <SyncSection
          syncStatus={syncStatus}
          lastSyncedAt={lastSyncedAt}
          triggerSync={triggerSync}
          migrationPref={migrationPref}
          handleMigrationPrefChange={handleMigrationPrefChange}
        />
      )}

      {isLoggedIn && (
        <SecuritySection
          rotateStatus={rotateStatus}
          setRotateStatus={setRotateStatus}
          handleRotateKey={handleRotateKey}
        />
      )}

      <AppearanceSection
        theme={theme}
        setTheme={setTheme}
        timeFormat={timeFormat}
        setTimeFormat={setTimeFormat}
      />

      <NotificationsSection />

      {!isNativePlatform && <PrivacySection />}

      <DataSection
        isLoggedIn={isLoggedIn}
        syncStatus={syncStatus}
        importStatus={importStatus}
        exporting={exporting}
        importing={importing}
        exportingIcal={exportingIcal}
        importingIcal={importingIcal}
        resetStatus={resetStatus}
        setResetStatus={setResetStatus}
        clearStatus={clearStatus}
        setClearStatus={setClearStatus}
        handleExport={handleExport}
        handleImport={handleImport}
        handleExportIcal={handleExportIcal}
        handleImportIcal={handleImportIcal}
        handleResetFromCloud={handleResetFromCloud}
        handleClearLocalData={handleClearLocalData}
      />

      {isLoggedIn && (
        <DangerZoneSection
          deleteAccountStatus={deleteAccountStatus}
          setDeleteAccountStatus={setDeleteAccountStatus}
          handleDeleteAccountRequest={handleDeleteAccountRequest}
        />
      )}
    </div>
  )
}
