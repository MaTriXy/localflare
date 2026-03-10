import { useState, useEffect } from "react"
import { NavLink } from "react-router-dom"
import {
  DatabaseIcon,
  HardDriveIcon,
  FolderIcon,
  StackIcon,
  QueueIcon,
  GlobeIcon,
  TerminalIcon,
  ChartBarIcon,
  CaretLeftIcon,
  CaretRightIcon,
  HouseIcon,
  SunIcon,
  MoonIcon,
  CaretDownIcon,
  type Icon,
} from "@phosphor-icons/react"
import { Surface, Tooltip, Button, cn } from "@cloudflare/kumo"
import { useBindings } from "@/hooks"
import { useMode } from "@/datasources"
import { useTheme } from "@/components/layout/ThemeProvider"
import { ModeToggle } from "./ModeToggle"

type ConnectionStatus = "connected" | "connecting" | "disconnected"

interface NavItem {
  icon: Icon
  label: string
  path: string
}

interface NavGroup {
  title: string
  items: NavItem[]
  defaultOpen?: boolean
}

const navGroups: NavGroup[] = [
  {
    title: "Storage",
    defaultOpen: true,
    items: [
      { icon: DatabaseIcon, label: "D1 Databases", path: "/d1" },
      { icon: HardDriveIcon, label: "KV Namespaces", path: "/kv" },
      { icon: FolderIcon, label: "R2 Buckets", path: "/r2" },
    ],
  },
  {
    title: "Compute",
    defaultOpen: true,
    items: [
      { icon: StackIcon, label: "Durable Objects", path: "/do" },
      { icon: QueueIcon, label: "Queues", path: "/queues" },
    ],
  },
  {
    title: "Monitoring",
    defaultOpen: true,
    items: [
      { icon: GlobeIcon, label: "Network", path: "/network" },
      { icon: TerminalIcon, label: "Tail Logs", path: "/logs" },
    ],
  },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting")
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((g) => [g.title, g.defaultOpen ?? true]))
  )
  const { mode: themeMode, toggle } = useTheme()
  const { mode: dsMode } = useMode()

  const { data: bindings, isError, isLoading } = useBindings()

  useEffect(() => {
    if (isLoading) setConnectionStatus("connecting")
    else if (isError) setConnectionStatus("disconnected")
    else if (bindings) setConnectionStatus("connected")
  }, [isLoading, isError, bindings])

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <Surface
      as="aside"
      data-sidebar-open={!isCollapsed}
      className={cn(
        "flex h-screen flex-col border-r border-kumo-line bg-kumo-base transition-all duration-200",
        isCollapsed ? "w-14" : "w-56"
      )}
    >
      {/* Header */}
      <div className="flex h-12 items-center border-b border-kumo-line px-3">
        {!isCollapsed && (
          <NavLink to="/" className="flex items-center gap-2 min-w-0">
            <svg
              className="size-6 shrink-0"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" rx="20" className="fill-[#f6821f]" />
              <path d="M20 75 L20 45 L32 45 L32 75 Z" fill="white" />
              <path d="M38 75 L38 30 L50 30 L50 75 Z" fill="white" />
              <path d="M56 75 L56 55 L68 55 L68 75 Z" fill="white" />
              <path d="M74 75 L74 20 L86 20 L86 75 Z" fill="white" />
            </svg>
            <span className="text-sm font-semibold text-kumo-default truncate">
              {bindings?.name ?? "Localflare"}
            </span>
          </NavLink>
        )}
        <div className={cn("ml-auto", isCollapsed && "mx-auto")}>
          <Button
            variant="ghost"
            shape="square"
            size="xs"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <CaretRightIcon size={14} /> : <CaretLeftIcon size={14} />}
          </Button>
        </div>
      </div>

      {/* Mode Toggle */}
      {!isCollapsed && (
        <div className="flex items-center justify-center border-b border-kumo-line px-3 py-2">
          <ModeToggle />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Home */}
        <div className="px-2">
          <SidebarLink
            to="/"
            end
            icon={HouseIcon}
            label="Overview"
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Groups */}
        {navGroups.map((group) => (
          <div key={group.title} className="mt-3">
            {!isCollapsed && (
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex w-full items-center justify-between px-4 py-1 text-[11px] font-medium text-kumo-subtle uppercase tracking-wider hover:text-kumo-default transition-colors"
              >
                {group.title}
                <CaretDownIcon
                  size={10}
                  className={cn(
                    "transition-transform",
                    !openGroups[group.title] && "-rotate-90"
                  )}
                />
              </button>
            )}
            {(isCollapsed || openGroups[group.title]) && (
              <div className="mt-0.5 px-2 space-y-px">
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Analytics */}
        <div className="mt-3 px-2">
          <SidebarLink
            to="/analytics"
            icon={ChartBarIcon}
            label="Analytics Explorer"
            isCollapsed={isCollapsed}
          />
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-kumo-line p-2">
        <div className={cn("flex items-center gap-2", isCollapsed ? "justify-center" : "px-2")}>
          <span
            className={cn(
              "size-1.5 rounded-full shrink-0",
              connectionStatus === "connected" && "bg-green-500",
              connectionStatus === "connecting" && "bg-yellow-500 animate-pulse",
              connectionStatus === "disconnected" && "bg-red-500"
            )}
          />
          {!isCollapsed && (
            <span className="flex-1 text-[11px] text-kumo-subtle truncate">
              {connectionStatus === "connected" && (
                dsMode === 'remote' ? 'Remote' : `Port ${new URLSearchParams(window.location.search).get("port") || "8787"}`
              )}
              {connectionStatus === "connecting" && "Connecting..."}
              {connectionStatus === "disconnected" && "Disconnected"}
            </span>
          )}
          <Tooltip content={themeMode === "light" ? "Dark mode" : "Light mode"} side="right">
            <Button
              variant="ghost"
              shape="square"
              size="xs"
              aria-label={themeMode === "light" ? "Switch to dark mode" : "Switch to light mode"}
              onClick={toggle}
            >
              {themeMode === "light" ? <MoonIcon size={14} /> : <SunIcon size={14} />}
            </Button>
          </Tooltip>
        </div>
      </div>
    </Surface>
  )
}

interface SidebarLinkProps {
  to: string
  end?: boolean
  icon: Icon
  label: string
  isCollapsed: boolean
}

function SidebarLink({ to, end, icon: IconComponent, label, isCollapsed }: SidebarLinkProps) {
  const link = (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
          isCollapsed && "justify-center px-2",
          isActive
            ? "bg-kumo-tint text-kumo-default font-medium"
            : "text-kumo-strong hover:bg-kumo-tint/60 hover:text-kumo-default"
        )
      }
    >
      <IconComponent size={16} className="shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )

  if (isCollapsed) {
    return (
      <Tooltip content={label} side="right">
        {link}
      </Tooltip>
    )
  }

  return link
}
