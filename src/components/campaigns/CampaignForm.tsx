import { useState } from 'react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { useStore } from '../../store/store'
import type { Campaign, EmailStep, UUID } from '../../store/types'

export default function CampaignForm({ id }: { id?: UUID }) {
  const campaign = useStore(s => s.campaigns.find(c => c.id === id))
  const addCampaign = useStore(s => s.addCampaign)
  const updateCampaign = useStore(s => s.updateCampaign)

  const [name, setName] = useState(campaign?.name ?? '')
  const [step1, setStep1] = useState<EmailStep>(campaign?.step1 ?? { subject: '', body: '' })
  const [step2, setStep2] = useState<EmailStep | undefined>(campaign?.step2 ?? { subject: '', body: '' })
  const [delay, setDelay] = useState<number>(campaign?.step2DelayDays ?? 3)

  const hasStep2 = !!campaign?.step2 || !!(step2 && (step2.subject || step2.body))

  function save() {
    if (!name.trim() || !step1.subject.trim() || !step1.body.trim()) return
    if (!id) {
      const newId = addCampaign({ name, step1, step2: hasStep2 ? step2 : undefined, step2DelayDays: hasStep2 ? delay : undefined })
      window.location.href = `/campaigns/${newId}`
    } else {
      updateCampaign(id, { name, step1, step2: hasStep2 ? step2 : undefined, step2DelayDays: hasStep2 ? delay : undefined })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card title="Campaign">
        <div className="grid gap-3">
          <label className="text-sm font-medium">Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. SaaS Founders NL" className="border rounded-md px-3 py-2" />
        </div>
      </Card>
      <Card title="Mail 1">
        <div className="grid gap-3">
          <label className="text-sm font-medium">Subject</label>
          <input value={step1.subject} onChange={e=>setStep1({ ...step1, subject: e.target.value })} className="border rounded-md px-3 py-2" />
          <label className="text-sm font-medium">Body</label>
          <textarea value={step1.body} onChange={e=>setStep1({ ...step1, body: e.target.value })} rows={8} className="border rounded-md px-3 py-2" />
        </div>
      </Card>
      <Card title="Mail 2 (optional)">
        <div className="grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Subject</label>
              <input value={step2?.subject ?? ''} onChange={e=>setStep2({ ...(step2||{subject:'',body:''}), subject: e.target.value })} className="border rounded-md px-3 py-2 w-full" />
            </div>
            <div>
              <label className="text-sm font-medium">Delay (days)</label>
              <input type="number" min={1} value={delay} onChange={e=>setDelay(Number(e.target.value)||1)} className="border rounded-md px-3 py-2 w-full" />
            </div>
          </div>
          <label className="text-sm font-medium">Body</label>
          <textarea value={step2?.body ?? ''} onChange={e=>setStep2({ ...(step2||{subject:'',body:''}), body: e.target.value })} rows={6} className="border rounded-md px-3 py-2" />
        </div>
      </Card>
      <div className="flex gap-3">
        <Button onClick={save}>Save</Button>
        <Button variant="secondary" onClick={()=>window.history.back()}>Back</Button>
      </div>
    </div>
  )
}
