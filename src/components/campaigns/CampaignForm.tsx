import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { useStore } from '../../store/store'
import type { Campaign, EmailStep, UUID, CampaignContentBlock, EmailTemplate } from '../../store/types'
import { renderTemplateWithContent } from '../../lib/api'
import { apiBaseUrl } from '../../lib/constants'

export default function CampaignForm({ id }: { id?: UUID }) {
  const campaign = useStore(s => s.campaigns.find(c => c.id === id))
  const addCampaign = useStore(s => s.addCampaign)
  const updateCampaign = useStore(s => s.updateCampaign)
  const settings = useStore(s => s.settings)
  
  const templates = settings.templates || []
  const defaultTemplate = templates.find(t => t.id === settings.defaultTemplateId) || templates[0]

  const [name, setName] = useState(campaign?.name ?? '')
  const [templateId, setTemplateId] = useState<UUID | undefined>(campaign?.templateId || defaultTemplate?.id)
  const [step1, setStep1] = useState<EmailStep>(campaign?.step1 ?? { subject: '', body: '' })
  const [step1Content, setStep1Content] = useState<CampaignContentBlock[]>(campaign?.step1Content ?? [])
  const [step2, setStep2] = useState<EmailStep | undefined>(campaign?.step2 ?? undefined)
  const [step2Content, setStep2Content] = useState<CampaignContentBlock[]>(campaign?.step2Content ?? [])
  const [delay, setDelay] = useState<number>(campaign?.step2DelayDays ?? 3)
  const [useTemplate, setUseTemplate] = useState<boolean>(campaign?.templateId ? true : (templates.length > 0))

  const selectedTemplate = templates.find(t => t.id === templateId)

  // Initialize content blocks when template changes
  useEffect(() => {
    if (selectedTemplate && step1Content.length === 0 && !campaign?.step1Content) {
      const initialContent = selectedTemplate.blocks.map(block => ({
        blockId: block.id,
        content: block.content,
        buttonUrl: block.buttonUrl
      }))
      setStep1Content(initialContent)
    }
  }, [templateId, selectedTemplate?.blocks?.length])

  const hasStep2 = !!campaign?.step2 || !!(step2 && step2.subject)

  function updateStep1BlockContent(blockId: UUID, content: string, buttonUrl?: string) {
    setStep1Content(prev => {
      const existing = prev.find(c => c.blockId === blockId)
      if (existing) {
        return prev.map(c => c.blockId === blockId ? { ...c, content, buttonUrl } : c)
      }
      return [...prev, { blockId, content, buttonUrl }]
    })
  }

  function updateStep2BlockContent(blockId: UUID, content: string, buttonUrl?: string) {
    setStep2Content(prev => {
      const existing = prev.find(c => c.blockId === blockId)
      if (existing) {
        return prev.map(c => c.blockId === blockId ? { ...c, content, buttonUrl } : c)
      }
      return [...prev, { blockId, content, buttonUrl }]
    })
  }

  function save() {
    if (!name.trim() || !step1.subject.trim()) return
    
    // Validate based on whether using template or plain text
    if (useTemplate && !templateId) {
      alert('Please select a template')
      return
    }
    if (!useTemplate && !step1.body.trim()) {
      alert('Please provide email body text')
      return
    }

    const campaignData = {
      name,
      templateId: useTemplate ? templateId : undefined,
      step1,
      step1Content: useTemplate ? step1Content : undefined,
      step2: hasStep2 ? step2 : undefined,
      step2Content: hasStep2 && useTemplate ? step2Content : undefined,
      step2DelayDays: hasStep2 ? delay : undefined
    }

    console.log('[CampaignForm] Saving campaign:', {
      useTemplate,
      templateId,
      step1ContentBlocks: step1Content.length,
      campaignData
    })

    if (!id) {
      const newId = addCampaign(campaignData)
      console.log('[CampaignForm] Created new campaign:', newId)
      window.location.href = `/campaigns/${newId}`
    } else {
      updateCampaign(id, campaignData)
      console.log('[CampaignForm] Updated campaign:', id)
    }
  }

  function toggleStep2() {
    if (hasStep2) {
      setStep2(undefined)
      setStep2Content([])
    } else {
      setStep2({ subject: '', body: '' })
      if (useTemplate && selectedTemplate) {
        setStep2Content(selectedTemplate.blocks.map(block => ({
          blockId: block.id,
          content: block.content,
          buttonUrl: block.buttonUrl
        })))
      }
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card title="Campaign">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. SaaS Founders NL" className="border rounded-md px-3 py-2" />
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email Format</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={useTemplate} onChange={() => setUseTemplate(true)} />
                <span className="text-sm">Use designed template</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!useTemplate} onChange={() => setUseTemplate(false)} />
                <span className="text-sm">Plain text</span>
              </label>
            </div>
          </div>

          {useTemplate && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Template</label>
              <select value={templateId || ''} onChange={e => setTemplateId(e.target.value)} className="border rounded-md px-3 py-2">
                <option value="">Select a template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} {t.id === settings.defaultTemplateId ? '(Default)' : ''}</option>
                ))}
              </select>
              {templates.length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No templates available. Create one in the Template Builder.</p>}
            </div>
          )}
        </div>
      </Card>

      <Card title="Mail 1">
        <div className="grid gap-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Subject</label>
            <input value={step1.subject} onChange={e=>setStep1({ ...step1, subject: e.target.value })} placeholder="Your email subject" className="border rounded-md px-3 py-2" />
          </div>

          {!useTemplate ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Body</label>
              <textarea value={step1.body} onChange={e=>setStep1({ ...step1, body: e.target.value })} rows={8} placeholder="Your email message" className="border rounded-md px-3 py-2" />
            </div>
          ) : selectedTemplate ? (
            <div className="grid gap-3">
              <label className="text-sm font-medium">Template Content</label>
              {selectedTemplate.blocks.map(block => {
                const campaignBlock = step1Content.find(c => c.blockId === block.id)
                return (
                  <div key={block.id} className="border rounded-lg p-3 space-y-2">
                    <div className="text-xs font-semibold text-[rgb(var(--muted))] uppercase">{block.type} Block</div>
                    {block.type === 'text' && (
                      <textarea
                        value={campaignBlock?.content || ''}
                        onChange={e => updateStep1BlockContent(block.id, e.target.value)}
                        placeholder="Enter your text"
                        rows={3}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      />
                    )}
                    {block.type === 'image' && (
                      <div className="grid gap-2">
                        <input
                          type="text"
                          value={campaignBlock?.content || ''}
                          onChange={e => updateStep1BlockContent(block.id, e.target.value)}
                          placeholder="Image URL"
                          className="w-full border rounded-md px-3 py-2 text-sm"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async e => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const form = new FormData()
                            form.append('file', file)
                            try {
                              const resp = await fetch(`${apiBaseUrl}/upload/image`, { method: 'POST', body: form })
                              const json = await resp.json()
                              if (json?.path) {
                                // Use absolute path for email clients
                                const url = json.path.startsWith('/') ? `${apiBaseUrl.replace(/\\/g,'')}${json.path}` : json.path
                                updateStep1BlockContent(block.id, url)
                              }
                            } catch (err) {
                              console.error('[CampaignForm] Image upload failed', err)
                            }
                          }}
                        />
                      </div>
                    )}
                    {block.type === 'button' && (
                      <div className="grid gap-2">
                        <input
                          type="text"
                          value={campaignBlock?.content || ''}
                          onChange={e => updateStep1BlockContent(block.id, e.target.value, campaignBlock?.buttonUrl)}
                          placeholder="Button text"
                          className="w-full border rounded-md px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={campaignBlock?.buttonUrl || ''}
                          onChange={e => updateStep1BlockContent(block.id, campaignBlock?.content || '', e.target.value)}
                          placeholder="Button URL"
                          className="w-full border rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">Select a template to configure content</p>
          )}
        </div>
      </Card>

      <Card title="Mail 2 (Follow-up)">
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable follow-up email</label>
            <Button variant="secondary" onClick={toggleStep2}>
              {hasStep2 ? 'Disable' : 'Enable'}
            </Button>
          </div>

          {hasStep2 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 grid gap-2">
                  <label className="text-sm font-medium">Subject</label>
                  <input value={step2?.subject ?? ''} onChange={e=>setStep2({ ...(step2||{subject:'',body:''}), subject: e.target.value })} placeholder="Follow-up subject" className="border rounded-md px-3 py-2" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Delay (days)</label>
                  <input type="number" min={1} value={delay} onChange={e=>setDelay(Number(e.target.value)||1)} className="border rounded-md px-3 py-2" />
                </div>
              </div>

              {!useTemplate ? (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Body</label>
                  <textarea value={step2?.body ?? ''} onChange={e=>setStep2({ ...(step2||{subject:'',body:''}), body: e.target.value })} rows={6} placeholder="Follow-up message" className="border rounded-md px-3 py-2" />
                </div>
              ) : selectedTemplate ? (
                <div className="grid gap-3">
                  <label className="text-sm font-medium">Template Content</label>
                  {selectedTemplate.blocks.map(block => {
                    const campaignBlock = step2Content.find(c => c.blockId === block.id)
                    return (
                      <div key={block.id} className="border rounded-lg p-3 space-y-2">
                        <div className="text-xs font-semibold text-[rgb(var(--muted))] uppercase">{block.type} Block</div>
                        {block.type === 'text' && (
                          <textarea
                            value={campaignBlock?.content || ''}
                            onChange={e => updateStep2BlockContent(block.id, e.target.value)}
                            placeholder="Enter your text"
                            rows={3}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                          />
                        )}
                        {block.type === 'image' && (
                          <div className="grid gap-2">
                            <input
                              type="text"
                              value={campaignBlock?.content || ''}
                              onChange={e => updateStep2BlockContent(block.id, e.target.value)}
                              placeholder="Image URL"
                              className="w-full border rounded-md px-3 py-2 text-sm"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async e => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const form = new FormData()
                                form.append('file', file)
                                try {
                                  const resp = await fetch(`${apiBaseUrl}/upload/image`, { method: 'POST', body: form })
                                  const json = await resp.json()
                                  if (json?.path) {
                                    const url = json.path.startsWith('/') ? `${apiBaseUrl.replace(/\\/g,'')}${json.path}` : json.path
                                    updateStep2BlockContent(block.id, url)
                                  }
                                } catch (err) {
                                  console.error('[CampaignForm] Image upload failed', err)
                                }
                              }}
                            />
                          </div>
                        )}
                        {block.type === 'button' && (
                          <div className="grid gap-2">
                            <input
                              type="text"
                              value={campaignBlock?.content || ''}
                              onChange={e => updateStep2BlockContent(block.id, e.target.value, campaignBlock?.buttonUrl)}
                              placeholder="Button text"
                              className="w-full border rounded-md px-3 py-2 text-sm"
                            />
                            <input
                              type="text"
                              value={campaignBlock?.buttonUrl || ''}
                              onChange={e => updateStep2BlockContent(block.id, campaignBlock?.content || '', e.target.value)}
                              placeholder="Button URL"
                              className="w-full border rounded-md px-3 py-2 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </>
          )}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button onClick={save}>Save</Button>
        <Button variant="secondary" onClick={()=>window.history.back()}>Back</Button>
      </div>
    </div>
  )
}
