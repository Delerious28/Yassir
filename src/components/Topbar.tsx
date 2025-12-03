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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center">
      <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="font-semibold text-gray-900">{title}</Link>
        </div>
        <ConnectionStatus />
      </div>
    </header>
  )
}
