import { useState } from 'react'
import { Button, Dialog } from '@cloudflare/kumo'
import { useAuth } from '@/datasources'
import { CloudflareClient } from '@/datasources/remote/client'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AuthDialog({ open, onOpenChange, onSuccess }: AuthDialogProps) {
  const { credentials, setCredentials, clearCredentials, isAuthenticated } = useAuth()
  const [apiToken, setApiToken] = useState(credentials?.apiToken ?? '')
  const [accountId, setAccountId] = useState(credentials?.accountId ?? '')
  const [r2AccessKeyId, setR2AccessKeyId] = useState(credentials?.r2AccessKeyId ?? '')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!apiToken.trim() || !accountId.trim()) {
      setError('Both fields are required.')
      return
    }

    setIsValidating(true)

    try {
      const client = new CloudflareClient({ apiToken: apiToken.trim(), accountId: accountId.trim() })
      const { valid } = await client.validate()

      if (!valid) {
        setError('Invalid API token. Please check your token and try again.')
        return
      }

      setCredentials({
        apiToken: apiToken.trim(),
        accountId: accountId.trim(),
        r2AccessKeyId: r2AccessKeyId.trim() || undefined,
      })
      onSuccess?.()
    } catch {
      setError('Failed to validate credentials. Please check your network connection.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleDisconnect = () => {
    clearCredentials()
    setApiToken('')
    setAccountId('')
    setR2AccessKeyId('')
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog className="max-w-md p-6">
        <Dialog.Title className="text-lg font-semibold text-kumo-default">Connect to Cloudflare</Dialog.Title>
        <Dialog.Description className="text-sm text-kumo-strong mt-1">
          Enter your Cloudflare API token and Account ID to access remote bindings.
        </Dialog.Description>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="account-id" className="text-sm font-medium text-kumo-default">
              Account ID
            </label>
            <input
              id="account-id"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. 023e105f4ecef8ad9ca31a8372d0c353"
              className="w-full rounded-md border border-kumo-line bg-kumo-base px-3 py-2 text-sm text-kumo-default placeholder:text-kumo-subtle focus:border-kumo-brand focus:outline-none focus:ring-1 focus:ring-kumo-brand"
            />
            <p className="text-xs text-kumo-subtle">
              Found in Cloudflare Dashboard &gt; Workers & Pages &gt; Account ID
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="api-token" className="text-sm font-medium text-kumo-default">
              API Token
            </label>
            <input
              id="api-token"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Your Cloudflare API token"
              className="w-full rounded-md border border-kumo-line bg-kumo-base px-3 py-2 text-sm text-kumo-default placeholder:text-kumo-subtle focus:border-kumo-brand focus:outline-none focus:ring-1 focus:ring-kumo-brand"
            />
            <p className="text-xs text-kumo-subtle">
              Create one at Cloudflare Dashboard &gt; My Profile &gt; API Tokens.
              Needs permissions: D1 Edit, Workers KV Storage Edit, R2 Edit, Queue Edit.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="r2-access-key" className="text-sm font-medium text-kumo-default">
              R2 Access Key ID <span className="text-kumo-subtle font-normal">(optional)</span>
            </label>
            <input
              id="r2-access-key"
              type="text"
              value={r2AccessKeyId}
              onChange={(e) => setR2AccessKeyId(e.target.value)}
              placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j"
              className="w-full rounded-md border border-kumo-line bg-kumo-base px-3 py-2 text-sm text-kumo-default placeholder:text-kumo-subtle focus:border-kumo-brand focus:outline-none focus:ring-1 focus:ring-kumo-brand"
            />
            <p className="text-xs text-kumo-subtle">
              Required for R2 object operations. Create at Cloudflare Dashboard &gt; R2 &gt; Manage API Tokens.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {isAuthenticated ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDisconnect}
                className="text-red-600 dark:text-red-400"
              >
                Disconnect
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isValidating}>
                {isValidating ? 'Validating...' : isAuthenticated ? 'Update' : 'Connect'}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  )
}
