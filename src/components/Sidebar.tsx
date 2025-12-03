import { NavLink } from 'react-router-dom'
import { Mail, LayoutDashboard, CalendarClock, ListChecks, Users, Settings as SettingsIcon, NotebookPen, Send } from 'lucide-react'
import { useStore } from '../store/store'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/campaigns', label: 'Campaigns', icon: NotebookPen },
  { to: '/send', label: 'Send', icon: Send },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/schedule', label: 'Schedule', icon: CalendarClock },
  { to: '/logs', label: 'Logs', icon: ListChecks },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const settings = useStore(s => s.settings)
  const appName = settings.appName || 'Outreach'
  const appLogoUrl = settings.appLogoUrl

  return (
    <aside className="w-64 hidden md:flex flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--card-bg))]">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-[rgb(var(--border))]">
        {appLogoUrl ? (
          <img src={appLogoUrl} alt="Logo" className="w-7 h-7 object-contain" />
        ) : (
          <Mail className="text-[rgb(var(--accent))]" />
        )}
        <span className="font-semibold tracking-tight text-[rgb(var(--fg))]">{appName}</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg border transition ${
                isActive
                  ? 'border-[rgb(var(--accent))] bg-[rgba(var(--accent),0.1)] text-[rgb(var(--fg))]'
                  : 'border-transparent text-[rgba(var(--fg),0.8)] hover:border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.04)]'
              }`
            }
          >
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 text-xs text-[rgb(var(--muted))]">Built for Graph API</div>
    </aside>
  )
}
