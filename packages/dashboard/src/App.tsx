import { forwardRef } from 'react'
import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LinkProvider } from '@cloudflare/kumo'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { DataSourceProvider } from '@/datasources'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { D1Explorer } from '@/components/d1/D1Explorer'
import { KVExplorer } from '@/components/kv/KVExplorer'
import { R2Explorer } from '@/components/r2/R2Explorer'
import { DOExplorer } from '@/components/do/DOExplorer'
import { QueuesExplorer } from '@/components/queues/QueuesExplorer'
import { TailLogs } from '@/components/logs/TailLogs'
import { NetworkInspector } from '@/components/network/NetworkInspector'
import { AnalyticsExplorer } from '@/components/analytics/AnalyticsExplorer'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 5000,
    },
  },
})

const KumoLink = forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }
>((props, ref) => {
  const { to, href, ...rest } = props
  return <RouterLink ref={ref} to={to || href || ''} {...rest} />
})
KumoLink.displayName = 'KumoLink'

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <DataSourceProvider>
          <LinkProvider component={KumoLink}>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="d1" element={<D1Explorer />} />
                  <Route path="kv" element={<KVExplorer />} />
                  <Route path="r2" element={<R2Explorer />} />
                  <Route path="do" element={<DOExplorer />} />
                  <Route path="queues" element={<QueuesExplorer />} />
                  <Route path="network" element={<NetworkInspector />} />
                  <Route path="logs" element={<TailLogs />} />
                </Route>
                <Route path="/analytics" element={<AnalyticsExplorer />} />
              </Routes>
            </BrowserRouter>
          </LinkProvider>
        </DataSourceProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
