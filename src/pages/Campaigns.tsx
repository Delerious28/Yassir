import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore } from '../store/store'

export default function Campaigns() {
  const campaigns = useStore(s => s.campaigns)
  return (
    <div className="grid gap-5">
      <Card className="bg-gradient-to-r from-[rgba(var(--accent),0.08)] to-[rgba(var(--accent2),0.08)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[rgba(var(--fg),0.6)]">Campaign workspace</p>
            <h1 className="text-2xl font-bold tracking-tight">Design, test, and send sequences</h1>
            <p className="text-[rgba(var(--fg),0.75)] mt-1">Keep every sequence aligned with your schedule and instantly jump to send mode.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/campaigns/new"><Button>Create campaign</Button></Link>
            <Link to="/send"><Button variant="secondary">Open send center</Button></Link>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgba(var(--fg),0.65)]">Total campaigns</div>
          <div className="text-3xl font-semibold mt-2">{campaigns.length}</div>
          <p className="text-sm text-[rgba(var(--fg),0.7)] mt-1">Organize by team, product line, or region.</p>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgba(var(--fg),0.65)]">Average leads</div>
          <div className="text-3xl font-semibold mt-2">{campaigns.length ? Math.round(campaigns.reduce((sum, c) => sum + c.leadIds.length, 0) / campaigns.length) : 0}</div>
          <p className="text-sm text-[rgba(var(--fg),0.7)] mt-1">Ensure targeting is healthy before you launch.</p>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgba(var(--fg),0.65)]">Multi-step sequences</div>
          <div className="text-3xl font-semibold mt-2">{campaigns.filter(c => c.step2).length}</div>
          <p className="text-sm text-[rgba(var(--fg),0.7)] mt-1">Add step 2 for warm follow ups.</p>
        </Card>
      </div>

      <div className="grid gap-3">
        {campaigns.length === 0 && <Card>No campaigns yet. Create your first campaign.</Card>}
        {campaigns.map(c => (
          <Card key={c.id} className="border-[rgba(var(--border),0.85)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <div className="font-semibold text-lg">{c.name}</div>
                <div className="text-sm text-[rgba(var(--fg),0.65)]">
                  Leads: {c.leadIds.length} • {c.step2 ? `2 steps (+${c.step2DelayDays}d)` : '1 step'}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-[rgba(var(--accent),0.1)]">Step 1: {c.step1.subject || 'Subject TBD'}</span>
                  <span className="px-2 py-1 rounded-full bg-[rgba(var(--accent2),0.12)]">Send window: {c.step2DelayDays ?? 0}d</span>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Link className="flex-1" to={`/campaigns/${c.id}`}><Button className="w-full" variant="secondary">Edit details</Button></Link>
                <Link className="flex-1" to={`/campaigns/${c.id}/send`}><Button className="w-full">Send tab</Button></Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
