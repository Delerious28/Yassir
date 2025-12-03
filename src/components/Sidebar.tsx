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
    <aside className="w-64 hidden md:flex flex-col bg-white border-r border-gray-200">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-200">
        {appLogoUrl ? (
          <img src={appLogoUrl} alt="Logo" className="w-6 h-6 object-contain" />
        ) : (
          <Mail className="text-brand-600" />
        )}
        <span className="font-semibold">{appName}</span>
      </div>
      <nav className="flex-1 p-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md mb-1 font-medium hover:bg-gray-100 ${
                isActive ? 'text-brand-700 bg-brand-50' : 'text-gray-700'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 text-xs text-gray-500">Built for Graph API</div>
    </aside>
  )
}
