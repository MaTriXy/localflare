import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  HardDriveIcon,
  KeyIcon,
  PlusIcon,
  TrashIcon,
  CopyIcon,
} from "@phosphor-icons/react"
import { useDataSource, useMode } from "@/datasources"
import { queryKeys } from "@/hooks"
import { Button, cn } from "@cloudflare/kumo"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"

function formatValue(value: unknown): { formatted: string; isJson: boolean } {
  if (typeof value !== "string") {
    return { formatted: JSON.stringify(value, null, 2), isJson: true }
  }
  try {
    const parsed = JSON.parse(value)
    return { formatted: JSON.stringify(parsed, null, 2), isJson: true }
  } catch {
    return { formatted: value, isJson: false }
  }
}

export function KVExplorer() {
  const [selectedNs, setSelectedNs] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [searchPrefix, setSearchPrefix] = useState("")
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)

  const queryClient = useQueryClient()
  const ds = useDataSource()
  const { mode } = useMode()

  const { data: namespaces, isLoading: loadingNamespaces } = useQuery({
    queryKey: queryKeys.kv.namespaces(mode),
    queryFn: () => ds.kv.listNamespaces().then(namespaces => ({ namespaces })),
  })

  const { data: keys, isLoading: loadingKeys } = useQuery({
    queryKey: queryKeys.kv.keys(mode, selectedNs ?? '', searchPrefix),
    queryFn: () => selectedNs ? ds.kv.listKeys(selectedNs, { prefix: searchPrefix || undefined }) : null,
    enabled: !!selectedNs,
  })

  const { data: keyValue, isLoading: loadingValue } = useQuery({
    queryKey: queryKeys.kv.value(mode, selectedNs ?? '', selectedKey ?? ''),
    queryFn: () => selectedNs && selectedKey ? ds.kv.getValue(selectedNs, selectedKey) : null,
    enabled: !!selectedNs && !!selectedKey,
  })

  const setValueMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => {
      if (!selectedNs) throw new Error("No namespace selected")
      return ds.kv.setValue(selectedNs, key, value)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kv.keys(mode, selectedNs ?? '') })
      setNewKey(""); setNewValue(""); setShowAddForm(false)
    },
  })

  const deleteKeyMutation = useMutation({
    mutationFn: (key: string) => {
      if (!selectedNs) throw new Error("No namespace selected")
      return ds.kv.deleteKey(selectedNs, key)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kv.keys(mode, selectedNs ?? '') })
      setSelectedKey(null)
    },
  })

  const formattedValue = useMemo(() => {
    if (!keyValue?.value) return null
    return formatValue(keyValue.value)
  }, [keyValue?.value])

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text) }

  if (loadingNamespaces) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="animate-pulse text-kumo-strong">Loading namespaces...</div>
      </div>
    )
  }

  if (!namespaces?.namespaces.length) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-semibold text-kumo-default">KV Namespaces</h1>
        <p className="text-sm text-kumo-strong mt-1">Manage your Workers KV key-value storage</p>
        <div className="mt-8 rounded-lg border border-kumo-line p-8 text-center">
          <HardDriveIcon size={32} className="text-kumo-subtle mx-auto mb-3" />
          <p className="text-sm text-kumo-default font-medium">No KV namespaces configured</p>
          <p className="text-xs text-kumo-strong mt-1">Add a KV namespace binding to your wrangler.toml to get started</p>
        </div>
      </div>
    )
  }

  const keyCount = keys?.keys?.length ?? 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-kumo-line">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-kumo-default">KV Namespaces</h1>
            <p className="text-sm text-kumo-strong mt-1">Manage your Workers KV key-value storage</p>
          </div>
          {selectedNs && (
            <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
              <PlusIcon size={14} className="mr-1.5" />
              Add Key
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-px rounded-lg border border-kumo-line bg-kumo-line overflow-hidden mt-5 max-w-sm">
          <div className="bg-kumo-base px-4 py-3">
            <p className="text-xs text-kumo-strong">Namespaces</p>
            <p className="text-xl font-semibold text-kumo-default mt-0.5 tabular-nums">{namespaces.namespaces.length}</p>
          </div>
          <div className="bg-kumo-base px-4 py-3">
            <p className="text-xs text-kumo-strong">Keys</p>
            <p className="text-xl font-semibold text-kumo-default mt-0.5 tabular-nums">{keyCount}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Namespace List */}
        <div className="w-52 border-r border-kumo-line flex flex-col bg-kumo-elevated">
          <div className="px-3 py-2.5 border-b border-kumo-line">
            <span className="text-[11px] font-medium text-kumo-subtle uppercase tracking-wider">Namespaces</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {namespaces.namespaces.map((ns) => (
              <button
                key={ns.binding}
                onClick={() => { setSelectedNs(ns.binding); setSelectedKey(null) }}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors",
                  selectedNs === ns.binding
                    ? "bg-kumo-tint text-kumo-default font-medium"
                    : "text-kumo-strong hover:bg-kumo-tint/60 hover:text-kumo-default"
                )}
              >
                <HardDriveIcon size={14} className={cn("shrink-0", selectedNs === ns.binding && "text-kv")} />
                {ns.binding}
              </button>
            ))}
          </div>
        </div>

        {/* Keys List */}
        <div className="w-64 border-r border-kumo-line flex flex-col bg-kumo-base">
          {selectedNs ? (
            <>
              <div className="p-3 border-b border-kumo-line">
                <SearchInput
                  value={searchPrefix}
                  onChange={setSearchPrefix}
                  placeholder="Filter by prefix..."
                  className="h-8"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingKeys ? (
                  <div className="p-4 text-center text-kumo-strong text-sm">Loading keys...</div>
                ) : keys?.keys?.length ? (
                  <div className="p-2 space-y-px">
                    {keys.keys.map((key) => (
                      <button
                        key={key.name}
                        onClick={() => setSelectedKey(key.name)}
                        className={cn(
                          "w-full text-left px-2.5 py-2 rounded-md transition-colors group",
                          selectedKey === key.name
                            ? "bg-kumo-tint"
                            : "hover:bg-kumo-tint/60"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <KeyIcon
                            size={12}
                            className={cn("shrink-0", selectedKey === key.name ? "text-kv" : "text-kumo-strong")}
                          />
                          <span className={cn(
                            "font-mono text-xs truncate",
                            selectedKey === key.name ? "font-medium text-kumo-default" : "text-kumo-strong"
                          )}>
                            {key.name}
                          </span>
                        </div>
                        {key.expiration && (
                          <div className="mt-1 ml-5 text-[10px] text-kumo-subtle">
                            Expires: {new Date(Number(key.expiration) * 1000).toLocaleDateString()}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-kumo-strong">
                      {searchPrefix ? "No keys match your search" : "No keys in this namespace"}
                    </p>
                    <Button variant="secondary" size="sm" className="mt-3" onClick={() => setShowAddForm(true)}>
                      <PlusIcon size={14} className="mr-1.5" />
                      Add Key
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-sm text-kumo-strong text-center">Select a namespace</p>
            </div>
          )}
        </div>

        {/* Value Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-kumo-base">
          {showAddForm ? (
            <div className="p-6">
              <div className="max-w-xl space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <PlusIcon size={16} />
                  Add New Key
                </h3>
                <div>
                  <label className="text-xs font-medium text-kumo-strong">Key</label>
                  <Input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="my-key"
                    className="mt-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-kumo-strong">Value</label>
                  <textarea
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Enter value (plain text or JSON)..."
                    className="mt-1.5 w-full min-h-48 p-3 rounded-md border border-kumo-line bg-kumo-base font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-kumo-ring"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => setValueMutation.mutate({ key: newKey, value: newValue })}
                    disabled={!newKey || !newValue || setValueMutation.isPending}
                  >
                    Save Key
                  </Button>
                  <Button variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          ) : selectedKey ? (
            <div className="flex flex-col h-full">
              {/* Key Header */}
              <div className="px-6 py-4 border-b border-kumo-line flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <KeyIcon size={16} className="text-kv shrink-0" />
                    <h3 className="font-mono text-sm font-semibold truncate">{selectedKey}</h3>
                  </div>
                  {keyValue?.metadata != null && (
                    <p className="text-xs text-kumo-strong mt-1 ml-6">
                      Metadata: {JSON.stringify(keyValue.metadata)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => copyToClipboard(formattedValue?.formatted || "")}>
                    <CopyIcon size={14} className="mr-1.5" /> Copy
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteKeyMutation.mutate(selectedKey)}
                    disabled={deleteKeyMutation.isPending}
                  >
                    <TrashIcon size={14} className="mr-1.5" /> Delete
                  </Button>
                </div>
              </div>

              {/* Value Display */}
              <div className="flex-1 overflow-auto p-6">
                {loadingValue ? (
                  <div className="flex items-center justify-center h-32 text-kumo-strong">Loading value...</div>
                ) : formattedValue ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-kumo-strong">Value</span>
                      {formattedValue.isJson && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">JSON</span>
                      )}
                    </div>
                    <pre className={cn(
                      "p-4 rounded-lg border border-kumo-line font-mono text-sm whitespace-pre-wrap break-all overflow-auto max-h-[calc(100vh-400px)]",
                      formattedValue.isJson ? "bg-kumo-tint/50" : "bg-kumo-tint/30"
                    )}>
                      {formattedValue.isJson ? (
                        <JsonHighlight json={formattedValue.formatted} />
                      ) : formattedValue.formatted}
                    </pre>
                  </div>
                ) : (
                  <div className="text-kumo-strong text-sm">No value</div>
                )}
              </div>
            </div>
          ) : selectedNs ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <KeyIcon size={32} className="text-kumo-subtle mb-3" />
              <p className="text-sm text-kumo-default font-medium">Select a key</p>
              <p className="text-xs text-kumo-strong mt-1">Choose a key from the list to view its value</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HardDriveIcon size={32} className="text-kumo-subtle mb-3" />
              <p className="text-sm text-kumo-default font-medium">Select a namespace</p>
              <p className="text-xs text-kumo-strong mt-1">Choose a namespace from the sidebar to browse keys</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function JsonHighlight({ json }: { json: string }) {
  const highlighted = json
    .replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="text-green-400">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="text-orange-400">$1</span>')
    .replace(/: (true|false)/g, ': <span class="text-blue-400">$1</span>')
    .replace(/: (null)/g, ': <span class="text-gray-400">$1</span>')

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />
}
