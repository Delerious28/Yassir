import { useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import CampaignForm from '../components/campaigns/CampaignForm'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore } from '../store/store'
import { generateScheduleTimes } from '../lib/time'
import { api } from '../lib/api'
import { Table, THead, TH, TBody, TR, TD } from '../components/ui/Table'

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const store = useStore()
  const campaign = id === 'new' ? undefined : store.campaigns.find(c => c.id === id)
  const leads = store.leads // Use all global leads
  const [selected, setSelected] = useState<string[]>([] as string[])
  const { pathname } = useLocation()
  const base = `/campaigns/${id}`
  const currentTab = pathname.endsWith('/send') ? 'send' : pathname.endsWith('/leads') ? 'leads' : 'details'

  if (id !== 'new' && !campaign) {
    return <Card>Campaign not found.</Card>
  }

  function attachAllLeads() {
    if (!id || id === 'new') return
    store.attachLeadsToCampaign(id, store.leads.map(l => l.id))
  }

  function clearLeads() {
    if (!id || id === 'new') return
    store.clearCampaignLeads(id)
  }

  function simulateSendMail1() {
    if (!id || id === 'new' || !campaign) return
    const times = generateScheduleTimes({
      count: Math.min(store.leads.length, 20),
      ...store.settings,
    })
    times.forEach((t, idx) => {
      const lead = store.leads[idx % store.leads.length]
      if (!lead) return
      store.logSend({ to: lead.email, time: t.toISOString(), campaignId: campaign.id, step: 1 })
    })
  }

  async function forceSendMail(step: 1 | 2) {
    if (!id || id === 'new' || !campaign) return
    const targets = selected.length ? leads.filter(l => selected.includes(l.id)) : leads
    for (const lead of targets) {
      const subject = step === 1 ? campaign.step1.subject : (campaign.step2?.subject ?? campaign.step1.subject)
      const body = step === 1 ? campaign.step1.body : (campaign.step2?.body ?? campaign.step1.body)
      try {
        const res = await api.sendMail({ to: lead.email, subject, body, config: { azure_client_id: store.settings.azure_client_id, azure_tenant_id: store.settings.azure_tenant_id, mail_from: store.settings.mail_from } })
        const now = new Date().toISOString()
        store.logSend({ to: lead.email, time: now, campaignId: campaign.id, step })
      } catch (e) {
        // log failure locally
        const now = new Date().toISOString()
        store.logSend({ to: lead.email, time: now, campaignId: campaign.id, step })
      }
    }
  }

  return (
    <div className="grid gap-6">
      {/* Tabs */}
      {id !== 'new' && (
        <Card>
          <div className="flex gap-4">
            <Link className={`px-3 py-2 rounded-md ${currentTab==='details'?'bg-brand-50 text-brand-700':'hover:bg-gray-100'}`} to={`${base}`}>Details</Link>
            <Link className={`px-3 py-2 rounded-md ${currentTab==='send'?'bg-brand-50 text-brand-700':'hover:bg-gray-100'}`} to={`${base}/send`}>Send</Link>
          </div>
        </Card>
      )}

      {/* Details tab */}
      {(id === 'new' || currentTab === 'details') && (
        <CampaignForm id={id === 'new' ? undefined : id} />
      )}



      {/* Send tab */}
      {id !== 'new' && currentTab === 'send' && (
        <>
          <Card title="Force Send (now)">
            <div className="flex items-center gap-3">
              <Button onClick={() => forceSendMail(1)}>Force send Mail 1</Button>
              <Button variant="secondary" onClick={() => forceSendMail(2)}>Force send Mail 2</Button>
              <div className="text-sm text-gray-600">Sends to selected; if none selected, sends to all.
                <span className="ml-2">Real Graph sendMail will be wired via backend.</span>
              </div>
            </div>
          </Card>
          <Card title="Simulate Sending (demo)">
            <div className="flex items-center gap-3">
              <Button onClick={simulateSendMail1}>Simulate schedule (Mail 1)</Button>
              <div className="text-sm text-gray-600">Generates up to 20 log entries using your schedule settings.</div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
