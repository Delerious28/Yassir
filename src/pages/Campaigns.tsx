import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore } from '../store/store'

export default function Campaigns() {
  const campaigns = useStore(s => s.campaigns)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">Campaigns</p>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Design and ship sequences</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Keep every sequence tidy and jump into send mode with a clean layout.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link to="/campaigns/new"><Button>Create campaign</Button></Link>
          <Link to="/send"><Button variant="secondary">Open send center</Button></Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Total campaigns</div>
          <div className="text-3xl font-semibold mt-2">{campaigns.length}</div>
          <p className="text-sm text-[rgb(var(--muted))] mt-1">Organize by initiative, region, or product line.</p>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Average leads</div>
          <div className="text-3xl font-semibold mt-2">{campaigns.length ? Math.round(campaigns.reduce((sum, c) => sum + c.leadIds.length, 0) / campaigns.length) : 0}</div>
          <p className="text-sm text-[rgb(var(--muted))] mt-1">Balance lists before you trigger sends.</p>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Multi-step</div>
          <div className="text-3xl font-semibold mt-2">{campaigns.filter(c => c.step2).length}</div>
          <p className="text-sm text-[rgb(var(--muted))] mt-1">Follow-ups ready to go.</p>
        </Card>
      </div>

      <div className="grid gap-3">
        {campaigns.length === 0 && <Card>No campaigns yet. Create your first sequence.</Card>}
        {campaigns.map(c => (
          <Card key={c.id}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <div className="font-semibold text-lg">{c.name}</div>
                <div className="text-sm text-[rgb(var(--muted))]">Leads: {c.leadIds.length} • {c.step2 ? `2 steps (+${c.step2DelayDays}d)` : '1 step'}</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-[rgba(var(--accent),0.1)]">Step 1: {c.step1.subject || 'Subject TBD'}</span>
                  <span className="px-2 py-1 rounded-full bg-[rgba(var(--fg),0.06)]">{c.step2 ? `Mail 2 after ${c.step2DelayDays ?? 0}d` : 'Single step'}</span>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Link className="flex-1" to={`/campaigns/${c.id}`}><Button className="w-full" variant="secondary">Edit</Button></Link>
                <Link className="flex-1" to={`/campaigns/${c.id}/send`}><Button className="w-full">Send tab</Button></Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
