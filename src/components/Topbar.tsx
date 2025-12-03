import { Link, useLocation } from 'react-router-dom'
import ConnectionStatus from './settings/ConnectionStatus'

export default function Topbar() {
  const { pathname } = useLocation()
  const title =
    pathname.startsWith('/campaigns') ? 'Campaigns' :
    pathname.startsWith('/leads') ? 'Leads' :
    pathname.startsWith('/schedule') ? 'Schedule' :
    pathname.startsWith('/logs') ? 'Logs' :
    pathname.startsWith('/settings') ? 'Settings' : 'Dashboard'

  return (
    <header className="h-16 bg-[rgba(var(--card-bg),0.78)] border-b border-[rgb(var(--border))] flex items-center shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="font-semibold text-[rgb(var(--fg))] tracking-tight">{title}</Link>
        </div>
        <ConnectionStatus />
      </div>
    </header>
  )
}
