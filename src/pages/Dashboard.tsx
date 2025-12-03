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
      <Card className="bg-gradient-to-r from-[rgba(var(--accent),0.12)] to-[rgba(var(--accent2),0.12)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[rgba(var(--fg),0.6)]">Mission Control</p>
            <h1 className="text-3xl font-bold tracking-tight text-[rgb(var(--fg))]">Run outreach with clarity</h1>
            <p className="text-[rgba(var(--fg),0.75)] mt-2 max-w-2xl">Monitor pipeline health, jump into campaigns, and keep your schedule balanced from one tidy command center.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/campaigns/new"><Button>Create campaign</Button></Link>
            <Link to="/settings"><Button variant="secondary">Review settings</Button></Link>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgba(var(--fg),0.6)]">Leads ready</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold">{leads.length}</div>
            <span className="text-xs px-3 py-1 rounded-full bg-[rgba(var(--accent),0.12)] text-[rgb(var(--fg))]">Upload CSV</span>
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgba(var(--fg),0.6)]">Campaigns</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold">{campaigns.length}</div>
            <span className="text-xs px-3 py-1 rounded-full bg-[rgba(var(--accent2),0.12)] text-[rgb(var(--fg))]">Draft & Live</span>
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgba(var(--fg),0.6)]">Recent sends</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold">{logs.length}</div>
            <span className="text-xs px-3 py-1 rounded-full bg-[rgba(var(--accent),0.12)] text-[rgb(var(--fg))]">Last 50 shown</span>
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgba(var(--fg),0.6)]">Engagement pulse</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold">{Math.max(logs.length - campaigns.length, 0)}</div>
            <span className="text-xs px-3 py-1 rounded-full bg-[rgba(var(--accent2),0.12)] text-[rgb(var(--fg))]">Last interactions</span>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Quick Actions" className="lg:col-span-2">
          <div className="flex flex-wrap gap-3">
            <Link to="/leads"><Button>Upload leads</Button></Link>
            <Link to="/campaigns"><Button variant="secondary">Manage campaigns</Button></Link>
            <Link to="/schedule"><Button variant="secondary">Adjust schedule</Button></Link>
            <Link to="/logs"><Button variant="ghost">View logs</Button></Link>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm text-[rgba(var(--fg),0.72)]">
            <div className="p-3 rounded-lg bg-[rgba(var(--accent),0.06)]">Stay within your daily caps and keep Azure auth fresh before forcing sends.</div>
            <div className="p-3 rounded-lg bg-[rgba(var(--accent2),0.06)]">Preview copy and cadence in each campaign before switching on a schedule.</div>
          </div>
        </Card>

        <Card title="Activity Highlights">
          <div className="space-y-3 text-sm text-[rgba(var(--fg),0.85)]">
            {campaigns.slice(0, 3).map(c => (
              <div key={c.id} className="p-3 rounded-lg border border-[rgba(var(--border),0.8)] bg-[rgba(var(--card-bg),0.65)]">
                <div className="font-medium flex items-center justify-between">
                  <span>{c.name}</span>
                  <span className="text-xs px-2 py-1 rounded-md bg-[rgba(var(--accent),0.12)]">{c.leadIds.length} leads</span>
                </div>
                <div className="text-xs text-[rgba(var(--fg),0.65)] mt-1">{c.step2 ? 'Two-step follow up scheduled' : 'Single message sequence'}</div>
              </div>
            ))}
            {campaigns.length === 0 && <div className="text-[rgba(var(--fg),0.65)]">No campaigns yet. Start with your first outreach plan.</div>}
          </div>
        </Card>
      </div>
    </div>
  )
}
