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
    <header className="h-16 flex items-center border-b border-[rgba(var(--border),0.6)] bg-[rgba(var(--card-bg),0.9)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="font-semibold text-lg tracking-tight text-[rgb(var(--fg))]">
            {title}
          </Link>
          <span className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted))] hidden sm:inline">Orchestrate outreach</span>
        </div>
        <ConnectionStatus />
      </div>
    </header>
  )
}
