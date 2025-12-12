import { NavLink } from 'react-router-dom'
import { Mail, LayoutDashboard, CalendarClock, ListChecks, Users, Settings as SettingsIcon, NotebookPen, Send, Palette } from 'lucide-react'
import { useStore } from '../store/store'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/campaigns', label: 'Campaigns', icon: NotebookPen },
  { to: '/send', label: 'Send', icon: Send },
  { to: '/templates', label: 'Email designer', icon: Palette },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/schedule', label: 'Schedule', icon: CalendarClock },
  { to: '/logs', label: 'Logs', icon: ListChecks },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const settings = useStore(s => s.settings)
  const appName = settings.appName || 'Outreach'
  const appLogoUrl = settings.brandLogoUrl || settings.appLogoUrl

  return (
    <aside className="w-64 hidden md:flex flex-col border-r border-[rgba(var(--border),0.7)] bg-[rgba(var(--card-bg),0.92)] backdrop-blur-xl shadow-lg shadow-[rgba(var(--fg),0.04)]">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-[rgba(var(--border),0.6)] bg-gradient-to-r from-[rgba(var(--accent),0.08)] to-[rgba(var(--accent2),0.06)]">
        {appLogoUrl ? (
          <img src={appLogoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-lg bg-white/60 p-1" />
        ) : (
          <div className="w-9 h-9 rounded-xl grid place-items-center bg-white/60">
            <Mail className="text-[rgb(var(--accent))]" />
          </div>
        )}
        <div>
          <span className="block text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Workspace</span>
          <span className="font-semibold tracking-tight text-[rgb(var(--fg))]">{appName}</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg border transition shadow-sm ${
                isActive
                  ? 'border-[rgba(var(--accent),0.4)] bg-[rgba(var(--accent),0.12)] text-[rgb(var(--fg))] shadow-[0_10px_30px_rgba(0,0,0,0.08)]'
                  : 'border-transparent text-[rgba(var(--fg),0.8)] hover:border-[rgba(var(--border),0.9)] hover:bg-[rgba(var(--fg),0.04)]'
              }`
            }
          >
            <div className="w-9 h-9 rounded-lg grid place-items-center bg-[rgba(var(--fg),0.04)]">
              <Icon size={18} />
            </div>
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 text-xs text-[rgb(var(--muted))] border-t border-[rgba(var(--border),0.6)] bg-[rgba(var(--fg),0.02)]">Built for Graph API</div>
    </aside>
  )
}
