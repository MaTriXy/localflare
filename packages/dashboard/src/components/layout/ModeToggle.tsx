import { useState } from 'react'
import { Button, cn } from '@cloudflare/kumo'
import { HouseIcon, CloudIcon } from '@phosphor-icons/react'
import { useMode, useAuth } from '@/datasources'
import { AuthDialog } from './AuthDialog'

export function ModeToggle() {
  const { mode, setMode } = useMode()
  const { isAuthenticated } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const handleToggle = (newMode: 'local' | 'remote') => {
    if (newMode === mode) return

    if (newMode === 'remote' && !isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    setMode(newMode)
  }

  const handleAuthSuccess = () => {
    setShowAuthDialog(false)
    setMode('remote')
  }

  return (
    <>
      <div className="flex items-center rounded-lg bg-kumo-tint/50 p-0.5">
        <button
          onClick={() => handleToggle('local')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
            mode === 'local'
              ? 'bg-kumo-base text-kumo-default shadow-sm'
              : 'text-kumo-subtle hover:text-kumo-default'
          )}
        >
          <HouseIcon size={13} />
          Local
        </button>
        <button
          onClick={() => handleToggle('remote')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
            mode === 'remote'
              ? 'bg-kumo-base text-kumo-default shadow-sm'
              : 'text-kumo-subtle hover:text-kumo-default'
          )}
        >
          <CloudIcon size={13} />
          Remote
        </button>
      </div>

      {isAuthenticated && mode === 'remote' && (
        <Button
          variant="ghost"
          size="xs"
          shape="square"
          onClick={() => setShowAuthDialog(true)}
          aria-label="Remote settings"
        >
          <CloudIcon size={14} />
        </Button>
      )}

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}
