import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { DataSource, DataSourceMode, CloudflareCredentials } from './types'
import { createDataSource } from './factory'

const STORAGE_KEY_MODE = 'localflare-datasource-mode'
const STORAGE_KEY_CREDENTIALS = 'localflare-cf-credentials'

function loadMode(): DataSourceMode {
  if (typeof window === 'undefined') return 'local'
  const stored = localStorage.getItem(STORAGE_KEY_MODE)
  return stored === 'remote' ? 'remote' : 'local'
}

function loadCredentials(): CloudflareCredentials | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CREDENTIALS)
    if (!stored) return null
    const parsed = JSON.parse(stored) as CloudflareCredentials
    if (parsed.apiToken && parsed.accountId) return parsed
    return null
  } catch {
    return null
  }
}

interface DataSourceContextValue {
  dataSource: DataSource
  mode: DataSourceMode
  setMode: (mode: DataSourceMode) => void
  credentials: CloudflareCredentials | null
  setCredentials: (creds: CloudflareCredentials) => void
  clearCredentials: () => void
  isAuthenticated: boolean
}

const DataSourceContext = createContext<DataSourceContextValue | null>(null)

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DataSourceMode>(loadMode)
  const [credentials, setCredentialsState] = useState<CloudflareCredentials | null>(loadCredentials)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MODE, mode)
  }, [mode])

  useEffect(() => {
    if (credentials) {
      localStorage.setItem(STORAGE_KEY_CREDENTIALS, JSON.stringify(credentials))
    } else {
      localStorage.removeItem(STORAGE_KEY_CREDENTIALS)
    }
  }, [credentials])

  const setMode = useCallback((newMode: DataSourceMode) => {
    // If switching to remote without credentials, stay on local
    // (the UI should open the auth dialog before calling this)
    if (newMode === 'remote' && !credentials) {
      return
    }
    setModeState(newMode)
  }, [credentials])

  const setCredentials = useCallback((creds: CloudflareCredentials) => {
    setCredentialsState(creds)
  }, [])

  const clearCredentials = useCallback(() => {
    setCredentialsState(null)
    setModeState('local')
  }, [])

  const isAuthenticated = credentials !== null

  const dataSource = useMemo(() => {
    try {
      return createDataSource(mode, credentials)
    } catch {
      // Fallback to local if remote creation fails
      return createDataSource('local', null)
    }
  }, [mode, credentials])

  const value = useMemo<DataSourceContextValue>(
    () => ({
      dataSource,
      mode,
      setMode,
      credentials,
      setCredentials,
      clearCredentials,
      isAuthenticated,
    }),
    [dataSource, mode, setMode, credentials, setCredentials, clearCredentials, isAuthenticated]
  )

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  )
}

export function useDataSource(): DataSource {
  const ctx = useContext(DataSourceContext)
  if (!ctx) throw new Error('useDataSource must be used within DataSourceProvider')
  return ctx.dataSource
}

export function useMode() {
  const ctx = useContext(DataSourceContext)
  if (!ctx) throw new Error('useMode must be used within DataSourceProvider')
  return { mode: ctx.mode, setMode: ctx.setMode }
}

export function useAuth() {
  const ctx = useContext(DataSourceContext)
  if (!ctx) throw new Error('useAuth must be used within DataSourceProvider')
  return {
    credentials: ctx.credentials,
    setCredentials: ctx.setCredentials,
    clearCredentials: ctx.clearCredentials,
    isAuthenticated: ctx.isAuthenticated,
  }
}

export function useDataSourceContext() {
  const ctx = useContext(DataSourceContext)
  if (!ctx) throw new Error('useDataSourceContext must be used within DataSourceProvider')
  return ctx
}
