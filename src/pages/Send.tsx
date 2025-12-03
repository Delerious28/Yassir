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
    <div className="grid gap-6">
      <Card title="Quick Send">
        <div className="text-sm text-gray-600 mb-3">Pick a campaign to open its Send tab and force-send emails to selected or all leads.</div>
        <div className="grid gap-2">
          {campaigns.length === 0 && (
            <div className="text-sm">No campaigns yet. <Link className="text-brand-700 underline" to="/campaigns/new">Create one</Link>.</div>
          )}
          {campaigns.map(c => {
            return (
              <div key={c.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-600">{leads.length} total leads</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => window.location.href = `/campaigns/${c.id}/send`}>Open Send Tab</Button>
                  <Button variant="secondary" onClick={async ()=>{
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
                  }}>Force Mail 1 (all)</Button>
                  <Button variant="secondary" onClick={async ()=>{
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
                  }}>Force Mail 2 (all)</Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
