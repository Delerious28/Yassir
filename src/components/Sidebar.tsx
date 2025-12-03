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
    <aside className="w-64 hidden md:flex flex-col bg-[rgba(var(--card-bg),0.78)] border-r border-[rgb(var(--border))] shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-[rgb(var(--border))]">
        {appLogoUrl ? (
          <img src={appLogoUrl} alt="Logo" className="w-6 h-6 object-contain" />
        ) : (
          <Mail className="text-brand-600" />
        )}
        <span className="font-semibold text-[rgb(var(--fg))] tracking-tight">{appName}</span>
      </div>
      <nav className="flex-1 p-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg mb-1 font-medium transition hover:bg-[rgba(var(--accent),0.08)] ${
                isActive ? 'text-[rgb(var(--fg))] bg-[rgba(var(--accent),0.15)] border border-[rgba(var(--accent),0.25)] shadow-[0_10px_28px_rgba(59,130,246,0.18)]' : 'text-[rgba(var(--fg),0.78)]'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 text-xs text-[rgba(var(--fg),0.65)]">Built for Graph API</div>
    </aside>
  )
}
