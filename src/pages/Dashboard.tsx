import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore } from '../store/store'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const leads = useStore(s => s.leads)
  const campaigns = useStore(s => s.campaigns)
  const logs = useStore(s => s.logs)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">Workspace overview</p>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Stay on top of every send</h1>
          <p className="text-sm text-[rgb(var(--muted))] max-w-2xl">Check campaign health, jump to the right screen, and keep cadence on schedule without any visual noise.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/campaigns/new"><Button>Create campaign</Button></Link>
          <Link to="/settings"><Button variant="secondary">Settings</Button></Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Leads</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold">{leads.length}</div>
            <span className="text-xs px-3 py-1 rounded-full bg-[rgba(var(--accent),0.1)] text-[rgb(var(--fg))]">Ready</span>
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Campaigns</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold">{campaigns.length}</div>
            <span className="text-xs px-3 py-1 rounded-full bg-[rgba(var(--fg),0.06)] text-[rgb(var(--fg))]">Active & Draft</span>
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Log entries</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold">{logs.length}</div>
            <span className="text-xs px-3 py-1 rounded-full bg-[rgba(var(--accent2),0.1)] text-[rgb(var(--fg))]">Recent</span>
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Engagement pulse</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold">{Math.max(logs.length - campaigns.length, 0)}</div>
            <span className="text-xs px-3 py-1 rounded-full bg-[rgba(var(--fg),0.06)] text-[rgb(var(--fg))]">Mail touchpoints</span>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Quick actions" className="lg:col-span-2">
          <div className="flex flex-wrap gap-3">
            <Link to="/leads"><Button>Upload leads</Button></Link>
            <Link to="/campaigns"><Button variant="secondary">Manage campaigns</Button></Link>
            <Link to="/schedule"><Button variant="secondary">Adjust schedule</Button></Link>
            <Link to="/logs"><Button variant="ghost">View logs</Button></Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-[rgb(var(--muted))]">
            <div className="p-3 rounded-lg bg-[rgba(var(--fg),0.04)]">Keep Azure authentication fresh before forcing sends.</div>
            <div className="p-3 rounded-lg bg-[rgba(var(--fg),0.04)]">Preview cadence in campaigns before switching on automation.</div>
          </div>
        </Card>

        <Card title="Latest campaigns">
          <div className="space-y-3 text-sm text-[rgb(var(--fg))]">
            {campaigns.slice(0, 3).map(c => (
              <div key={c.id} className="p-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card-bg))]">
                <div className="font-semibold flex items-center justify-between">
                  <span>{c.name}</span>
                  <span className="text-xs px-2 py-1 rounded-md bg-[rgba(var(--accent),0.1)]">{c.leadIds.length} leads</span>
                </div>
                <div className="text-xs text-[rgb(var(--muted))] mt-1">{c.step2 ? 'Two-step follow up' : 'Single message sequence'}</div>
              </div>
            ))}
            {campaigns.length === 0 && <div className="text-[rgb(var(--muted))]">No campaigns yet. Start with your first outreach plan.</div>}
          </div>
        </Card>
      </div>
    </div>
  )
}
