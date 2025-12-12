import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore } from '../store/store'
import { Link } from 'react-router-dom'
import { api, renderTemplateWithContent } from '../lib/api'
import type { Campaign } from '../store/types'

export default function SendPage() {
  const campaigns = useStore(s => s.campaigns)
  const leads = useStore(s => s.leads)
  const settings = useStore(s => s.settings)
  const logSend = useStore(s => s.logSend)

  function getEmailBody(campaign: Campaign, step: 1 | 2): string {
    // If campaign uses a template, render it with content
    if (campaign.templateId) {
      console.log('[Send] Campaign uses template:', campaign.templateId)
      const template = settings.templates?.find(t => t.id === campaign.templateId)
      console.log('[Send] Found template:', template?.name)
      if (template) {
        const contentBlocks = step === 1 ? campaign.step1Content : campaign.step2Content
        console.log('[Send] Content blocks:', contentBlocks)
        if (contentBlocks) {
          const rendered = renderTemplateWithContent(template, contentBlocks, settings.brandLogoUrl)
          console.log('[Send] Rendered HTML (first 200 chars):', rendered.substring(0, 200))
          return rendered
        }
      }
    }
    
    // Fallback to plain text body
    console.log('[Send] Using plain text fallback')
    return step === 1 ? campaign.step1.body : (campaign.step2?.body || campaign.step1.body)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">Send</p>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Control outbound pushes</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Flat, clear controls for opening send tabs or forcing one-off sends.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold">{leads.length}</div>
          <div className="text-sm text-[rgb(var(--muted))]">lead pool available</div>
        </div>
      </div>

      <div className="space-y-3">
        {campaigns.length === 0 && (
          <Card>No campaigns yet. <Link className="text-[rgb(var(--accent))] underline" to="/campaigns/new">Create one</Link>.</Card>
        )}
        {campaigns.map(c => {
          return (
            <Card key={c.id}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-lg">{c.name}</div>
                  <div className="text-sm text-[rgb(var(--muted))]">{leads.length} total leads available</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-[rgba(var(--accent),0.1)]">Mail 1: {c.step1.subject || 'Subject TBD'}</span>
                    <span className="px-2 py-1 rounded-full bg-[rgba(var(--fg),0.06)]">{c.step2 ? `Mail 2 after ${c.step2DelayDays ?? 0}d` : 'Single step'}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Button className="w-full sm:w-40" onClick={() => window.location.href = `/campaigns/${c.id}/send`}>
                    Open send tab
                  </Button>
                  <Button className="w-full sm:w-40" variant="secondary" onClick={async ()=>{
                      const targets = leads
                      for (const lead of targets) {
                        const subject = c.step1.subject
                        const body = getEmailBody(c, 1)
                        try {
                          await api.sendMail({ to: lead.email, subject, body, config: { azure_client_id: settings.azure_client_id, azure_tenant_id: settings.azure_tenant_id, mail_from: settings.mail_from } })
                          const now = new Date().toISOString()
                          logSend({ to: lead.email, time: now, campaignId: c.id, step: 1 })
                        } catch (e) {
                          const now = new Date().toISOString()
                          logSend({ to: lead.email, time: now, campaignId: c.id, step: 1 })
                        }
                      }
                    }}>
                    Force Mail 1
                  </Button>
                  <Button className="w-full sm:w-40" variant="secondary" onClick={async ()=>{
                      const targets = leads
                      for (const lead of targets) {
                        const subject = (c.step2?.subject ?? c.step1.subject)
                        const body = getEmailBody(c, 2)
                        try {
                          await api.sendMail({ to: lead.email, subject, body, config: { azure_client_id: settings.azure_client_id, azure_tenant_id: settings.azure_tenant_id, mail_from: settings.mail_from } })
                          const now = new Date().toISOString()
                          logSend({ to: lead.email, time: now, campaignId: c.id, step: 2 })
                        } catch (e) {
                          const now = new Date().toISOString()
                          logSend({ to: lead.email, time: now, campaignId: c.id, step: 2 })
                        }
                      }
                    }}>
                    Force Mail 2
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
