import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore } from '../store/store'

export default function Campaigns() {
  const campaigns = useStore(s => s.campaigns)
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Campaigns</h2>
        <Link to="/campaigns/new"><Button>New Campaign</Button></Link>
      </div>
      <div className="grid gap-3">
        {campaigns.length === 0 && <Card> No campaigns yet. Create your first campaign. </Card>}
        {campaigns.map(c => (
          <Card key={c.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-600">Leads: {c.leadIds.length} • {c.step2 ? `2 steps (+${c.step2DelayDays}d)` : '1 step'}</div>
              </div>
              <Link to={`/campaigns/${c.id}`}><Button variant="secondary">Open</Button></Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
