import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore } from '../store/store'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function SendPage() {
  const campaigns = useStore(s => s.campaigns)
  const leads = useStore(s => s.leads)
  const settings = useStore(s => s.settings)
  const logSend = useStore(s => s.logSend)

  return (
    <div className="grid gap-5">
      <Card className="bg-gradient-to-r from-[rgba(var(--accent),0.1)] to-[rgba(var(--accent2),0.08)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[rgba(var(--fg),0.6)]">Send center</p>
            <h1 className="text-2xl font-bold tracking-tight">Control outbound pushes</h1>
            <p className="text-[rgba(var(--fg),0.75)] mt-1">Open any campaign’s send tab for granular control or trigger force sends here.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold">{leads.length}</div>
            <div className="text-sm text-[rgba(var(--fg),0.7)]">lead pool available</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        {campaigns.length === 0 && (
          <Card>No campaigns yet. <Link className="text-[rgba(var(--accent),0.9)] underline" to="/campaigns/new">Create one</Link>.</Card>
        )}
        {campaigns.map(c => {
          return (
            <Card key={c.id} className="border-[rgba(var(--border),0.85)]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-lg">{c.name}</div>
                  <div className="text-sm text-[rgba(var(--fg),0.65)]">{leads.length} total leads available</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-[rgba(var(--accent),0.12)]">Mail 1: {c.step1.subject || 'Subject TBD'}</span>
                    <span className="px-2 py-1 rounded-full bg-[rgba(var(--accent2),0.12)]">{c.step2 ? `Mail 2 after ${c.step2DelayDays ?? 0}d` : 'Single step'}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Button className="w-full" onClick={() => window.location.href = `/campaigns/${c.id}/send`}>Open send tab</Button>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button className="w-full" variant="secondary" onClick={async ()=>{
                      const targets = leads
                      for (const lead of targets) {
                        const subject = c.step1.subject
                        const body = c.step1.body
                        try {
                          await api.sendMail({ to: lead.email, subject, body, config: { azure_client_id: settings.azure_client_id, azure_tenant_id: settings.azure_tenant_id, mail_from: settings.mail_from } })
                          const now = new Date().toISOString()
                          logSend({ to: lead.email, time: now, campaignId: c.id, step: 1 })
                        } catch (e) {
                          console.error('Send failed:', e)
                          if (e instanceof Error && e.message.includes('Authentication')) {
                            alert(e.message + ' Go to Settings → Authentication to re-authenticate.')
                            return
                          }
                          const now = new Date().toISOString()
                          logSend({ to: lead.email, time: now, campaignId: c.id, step: 1 })
                        }
                      }
                    }}>Force Mail 1</Button>
                    <Button className="w-full" variant="secondary" onClick={async ()=>{
                      const targets = leads
                      for (const lead of targets) {
                        const subject = (c.step2?.subject ?? c.step1.subject)
                        const body = (c.step2?.body ?? c.step1.body)
                        try {
                          await api.sendMail({ to: lead.email, subject, body, config: { azure_client_id: settings.azure_client_id, azure_tenant_id: settings.azure_tenant_id, mail_from: settings.mail_from } })
                          const now = new Date().toISOString()
                          logSend({ to: lead.email, time: now, campaignId: c.id, step: 2 })
                        } catch (e) {
                          console.error('Send failed:', e)
                          if (e instanceof Error && e.message.includes('Authentication')) {
                            alert(e.message + ' Go to Settings → Authentication to re-authenticate.')
                            return
                          }
                          const now = new Date().toISOString()
                          logSend({ to: lead.email, time: now, campaignId: c.id, step: 2 })
                        }
                      }
                    }}>Force Mail 2</Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
