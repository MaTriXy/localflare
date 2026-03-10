import { useQueryClient } from "@tanstack/react-query"
import {
  DatabaseIcon,
  HardDriveIcon,
  FolderIcon,
  StackIcon,
  QueueIcon,
  ArrowRightIcon,
  ChartBarIcon,
  type Icon,
} from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Text, cn } from "@cloudflare/kumo"
import { useBindings, queryKeys } from "@/hooks"
import { useMode } from "@/datasources"
import { DataTableLoading } from "@/components/ui/data-table"
import { LandingPage } from "@/components/landing/LandingPage"

interface ServiceConfig {
  key: string
  title: string
  description: string
  icon: Icon
  path: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCount: (bindings: any) => number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getItems: (bindings: any) => string[]
}

const services: ServiceConfig[] = [
  {
    key: "d1",
    title: "D1 Databases",
    description: "SQLite databases at the edge",
    icon: DatabaseIcon,
    path: "/d1",
    getCount: (bindings) => bindings.d1?.length ?? 0,
    getItems: (bindings) => bindings.d1?.map((d: { binding: string }) => d.binding) ?? [],
  },
  {
    key: "kv",
    title: "KV Namespaces",
    description: "Key-value storage",
    icon: HardDriveIcon,
    path: "/kv",
    getCount: (bindings) => bindings.kv?.length ?? 0,
    getItems: (bindings) => bindings.kv?.map((k: { binding: string }) => k.binding) ?? [],
  },
  {
    key: "r2",
    title: "R2 Buckets",
    description: "Object storage",
    icon: FolderIcon,
    path: "/r2",
    getCount: (bindings) => bindings.r2?.length ?? 0,
    getItems: (bindings) => bindings.r2?.map((r: { binding: string }) => r.binding) ?? [],
  },
  {
    key: "do",
    title: "Durable Objects",
    description: "Stateful serverless",
    icon: StackIcon,
    path: "/do",
    getCount: (bindings) => bindings.durableObjects?.length ?? 0,
    getItems: (bindings) => bindings.durableObjects?.map((d: { binding: string }) => d.binding) ?? [],
  },
  {
    key: "queues",
    title: "Queues",
    description: "Message queues",
    icon: QueueIcon,
    path: "/queues",
    getCount: (bindings) => bindings.queues?.producers?.length ?? 0,
    getItems: (bindings) => bindings.queues?.producers?.map((q: { binding: string }) => q.binding) ?? [],
  },
]

export function Home() {
  const queryClient = useQueryClient()
  const { mode } = useMode()
  const { data: bindings, isLoading, error } = useBindings()

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.bindings.all(mode) })
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <DataTableLoading />
      </div>
    )
  }

  if (error) {
    return <LandingPage onRetry={handleRetry} />
  }

  const totalD1 = bindings?.bindings.d1?.length ?? 0
  const totalKV = bindings?.bindings.kv?.length ?? 0
  const totalR2 = bindings?.bindings.r2?.length ?? 0
  const totalDO = bindings?.bindings.durableObjects?.length ?? 0
  const totalQueues = bindings?.bindings.queues?.producers?.length ?? 0
  const totalBindings = totalD1 + totalKV + totalR2 + totalDO + totalQueues

  const activeServices = services.filter((s) => s.getCount(bindings?.bindings) > 0)

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Text variant="heading1" as="h1">Overview</Text>
          <p className="text-sm text-kumo-strong mt-1">
            Local dashboard for {bindings?.name ?? "your Worker"}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-lg border border-kumo-line bg-kumo-line overflow-hidden mb-8">
          <StatCell label="D1 Databases" value={totalD1} />
          <StatCell label="KV Namespaces" value={totalKV} />
          <StatCell label="R2 Buckets" value={totalR2} />
          <StatCell label="Total Bindings" value={totalBindings} />
        </div>

        {/* Services Table */}
        {activeServices.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-kumo-default mb-3">Services</h2>
            <div className="rounded-lg border border-kumo-line overflow-hidden">
              {activeServices.map((service, i) => {
                const count = service.getCount(bindings?.bindings)
                const items = service.getItems(bindings?.bindings)
                return (
                  <Link
                    key={service.key}
                    to={service.path}
                    className={cn(
                      "group flex items-center gap-4 px-4 py-3 bg-kumo-base hover:bg-kumo-tint/40 transition-colors",
                      i > 0 && "border-t border-kumo-line"
                    )}
                  >
                    <service.icon size={18} className="text-kumo-strong shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-kumo-default">{service.title}</span>
                      {items.length > 0 && (
                        <span className="ml-2 text-xs text-kumo-subtle">
                          {items.slice(0, 3).join(", ")}
                          {items.length > 3 && ` +${items.length - 3}`}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-kumo-strong tabular-nums">{count}</span>
                    <ArrowRightIcon
                      size={14}
                      className="text-kumo-subtle group-hover:text-kumo-default transition-colors shrink-0"
                    />
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Quick Links */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-kumo-default mb-3">Quick Links</h2>
          <div className="rounded-lg border border-kumo-line overflow-hidden">
            <Link
              to="/analytics"
              className="group flex items-center gap-4 px-4 py-3 bg-kumo-base hover:bg-kumo-tint/40 transition-colors"
            >
              <ChartBarIcon size={18} className="text-kumo-strong shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-kumo-default">Analytics Explorer</span>
                <span className="ml-2 text-xs text-kumo-subtle">
                  Query and visualize Analytics Engine data
                </span>
              </div>
              <ArrowRightIcon
                size={14}
                className="text-kumo-subtle group-hover:text-kumo-default transition-colors shrink-0"
              />
            </Link>
          </div>
        </section>

        {/* Environment Variables */}
        {bindings?.bindings.vars && bindings.bindings.vars.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-kumo-default mb-3">
              Environment Variables
              <span className="ml-2 text-xs font-normal text-kumo-subtle">
                {bindings.bindings.vars.length}
              </span>
            </h2>
            <div className="rounded-lg border border-kumo-line overflow-hidden">
              {bindings.bindings.vars.map((v, i) => (
                <div
                  key={v.key}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 bg-kumo-base text-xs font-mono",
                    i > 0 && "border-t border-kumo-line"
                  )}
                >
                  <span className="text-kumo-default font-medium min-w-28">{v.key}</span>
                  <span className="text-kumo-subtle">=</span>
                  <span className={cn(
                    "truncate",
                    v.isSecret ? "text-kumo-inactive italic" : "text-kumo-default"
                  )}>
                    {v.isSecret ? "••••••••" : `"${v.value}"`}
                  </span>
                  {v.isSecret && (
                    <span className="ml-auto text-[10px] text-kumo-subtle border border-kumo-line rounded px-1.5 py-0.5 shrink-0">
                      secret
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-kumo-base px-4 py-4">
      <p className="text-xs text-kumo-strong">{label}</p>
      <p className="text-2xl font-semibold text-kumo-default mt-1 tabular-nums">{value}</p>
    </div>
  )
}
