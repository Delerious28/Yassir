import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore } from '../store/store'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const leads = useStore(s => s.leads)
  const campaigns = useStore(s => s.campaigns)
  const logs = useStore(s => s.logs)

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-sm text-gray-500">Leads</div>
          <div className="text-3xl font-semibold">{leads.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Campaigns</div>
          <div className="text-3xl font-semibold">{campaigns.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Sends (log)</div>
          <div className="text-3xl font-semibold">{logs.length}</div>
        </Card>
      </div>
      <Card title="Quick Actions">
        <div className="flex flex-wrap gap-3">
          <Link to="/leads"><Button>Upload Leads</Button></Link>
          <Link to="/campaigns"><Button variant="secondary">Manage Campaigns</Button></Link>
          <Link to="/schedule"><Button variant="secondary">Adjust Schedule</Button></Link>
          <Link to="/logs"><Button variant="ghost">View Logs</Button></Link>
        </div>
      </Card>
    </div>
  )
}
