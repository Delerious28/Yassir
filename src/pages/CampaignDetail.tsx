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
  const leads = store.leads
  const [selected, setSelected] = useState<string[]>([] as string[])
  const { pathname } = useLocation()
  const base = `/campaigns/${id}`
  const currentTab = pathname.endsWith('/send') ? 'send' : 'details'

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
    const times = generateScheduleTimes({ count: Math.min(store.leads.length, 20), ...store.settings })
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
        await api.sendMail({ to: lead.email, subject, body, config: { azure_client_id: store.settings.azure_client_id, azure_tenant_id: store.settings.azure_tenant_id, mail_from: store.settings.mail_from } })
        const now = new Date().toISOString()
        store.logSend({ to: lead.email, time: now, campaignId: campaign.id, step })
      } catch (e) {
        const now = new Date().toISOString()
        store.logSend({ to: lead.email, time: now, campaignId: campaign.id, step })
      }
    }
  }

  return (
    <div className="space-y-6">
      {id !== 'new' && campaign && (
        <Card>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">Campaign</p>
              <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">{campaign.name}</h1>
              <p className="text-sm text-[rgb(var(--muted))]">{campaign.step2 ? 'Two-touch sequence with a follow-up.' : 'Single-touch sequence ready to send.'}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={attachAllLeads}>Attach all leads</Button>
              <Button variant="ghost" onClick={clearLeads}>Clear leads</Button>
            </div>
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm text-[rgb(var(--muted))]">
            <div className="p-3 rounded-lg bg-[rgba(var(--fg),0.04)]">{campaign.leadIds.length} linked leads</div>
            <div className="p-3 rounded-lg bg-[rgba(var(--fg),0.04)]">{campaign.step2 ? `Mail 2 after ${campaign.step2DelayDays ?? 0} days` : 'Single step cadence'}</div>
            <div className="p-3 rounded-lg bg-[rgba(var(--fg),0.04)]">Use Send tab for instant sends and simulations.</div>
          </div>
        </Card>
      )}

      {id !== 'new' && (
        <Card className="p-0">
          <div className="flex gap-3 px-5 pt-4">
            <Link className={`px-3 py-2 rounded-lg text-sm font-semibold ${currentTab === 'details' ? 'bg-[rgba(var(--accent),0.12)] text-[rgb(var(--fg))]' : 'hover:bg-[rgba(var(--fg),0.04)]'}`} to={`${base}`}>Details</Link>
            <Link className={`px-3 py-2 rounded-lg text-sm font-semibold ${currentTab === 'send' ? 'bg-[rgba(var(--accent),0.12)] text-[rgb(var(--fg))]' : 'hover:bg-[rgba(var(--fg),0.04)]'}`} to={`${base}/send`}>Send</Link>
          </div>
        </Card>
      )}

      {(id === 'new' || currentTab === 'details') && (
        <CampaignForm id={id === 'new' ? undefined : id} />
      )}

      {id !== 'new' && currentTab === 'send' && campaign && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card title="Force send now" className="lg:col-span-2">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => forceSendMail(1)} className="w-full sm:w-auto">Force Mail 1</Button>
                <Button variant="secondary" onClick={() => forceSendMail(2)} className="w-full sm:w-auto">Force Mail 2</Button>
                <div className="text-sm text-[rgb(var(--muted))]">Targets selected leads; defaults to all when none chosen.</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-[rgb(var(--muted))]">
                <div className="p-3 rounded-lg bg-[rgba(var(--fg),0.04)]">Refresh Microsoft authentication in Settings before forcing sends.</div>
                <div className="p-3 rounded-lg bg-[rgba(var(--fg),0.04)]">Use a small selection below to test copy safely.</div>
              </div>
            </div>
          </Card>

          <Card title="Simulate schedule (demo)">
            <div className="space-y-3 text-sm text-[rgb(var(--muted))]">
              <Button onClick={simulateSendMail1} className="w-full">Generate demo logs</Button>
              <p>Create up to 20 log entries using your current schedule to review pacing.</p>
            </div>
          </Card>

          <Card title="Lead selection" className="lg:col-span-3">
            <div className="flex flex-wrap gap-2 mb-3 text-sm">
              <Button variant="secondary" onClick={() => setSelected(leads.map(l => l.id))}>Select all</Button>
              <Button variant="ghost" onClick={() => setSelected([])}>Clear selection</Button>
              <span className="text-[rgb(var(--muted))]">{selected.length} lead(s) targeted</span>
            </div>
            <Table>
              <THead>
                <TH className="w-12">Pick</TH>
                <TH>Email</TH>
              </THead>
              <TBody>
                {leads.length === 0 && (
                  <TR><td className="p-4 text-center text-[rgb(var(--muted))]" colSpan={2}>No leads yet. Upload leads to send.</td></TR>
                )}
                {leads.map(l => (
                  <TR key={l.id}>
                    <TD className="w-12">
                      <input
                        type="checkbox"
                        checked={selected.includes(l.id)}
                        onChange={e => {
                          if (e.target.checked) setSelected([...selected, l.id])
                          else setSelected(selected.filter(id => id !== l.id))
                        }}
                      />
                    </TD>
                    <TD>{l.email}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  )
}
