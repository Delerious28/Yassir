// API contracts for future Python backend; mocked for now
import type { Campaign, Lead, LogEntry, Settings, UUID, EmailTemplate, EmailBlock, CampaignContentBlock } from '../store/types'

export function renderTemplateWithContent(
  template: EmailTemplate,
  contentBlocks: CampaignContentBlock[],
  brandLogoUrl?: string
): string {
  const contentMap = new Map(contentBlocks.map(cb => [cb.blockId, cb]))
  
  const html = template.blocks.map(block => {
    const campaignContent = contentMap.get(block.id)
    const content = campaignContent?.content || block.content
    const buttonUrl = campaignContent?.buttonUrl || block.buttonUrl || '#'
    
    const padding = block.padding || '12px'
    const align = block.align || 'left'
    const background = block.background || ''
    const textColor = block.textColor || ''
    const brandColor = template.brandColor || '#2563EB'

    if (block.type === 'image') {
      if (!content) return ''
      const bgStyle = background ? `background:${background};` : ''
      return `<div style="padding:${padding};text-align:${align};${bgStyle}"><img src="${content}" alt="" style="max-width:100%;border-radius:12px" /></div>`
    }

    if (block.type === 'button') {
      const bg = block.background || brandColor
      const fg = block.textColor || '#ffffff'
      // Make anchor take full clickable area; move padding/background to anchor
      const bgStyle = background ? `background:${background};` : ''
      return `<div style="text-align:${align};${bgStyle}"><a href="${buttonUrl}" style="display:block;padding:${padding};background:${bg};color:${fg};border-radius:12px;font-weight:600;text-decoration:none;text-align:${align}">${content}</a></div>`
    }

    const fontFamily = block.fontFamily || 'Inter, system-ui, sans-serif'
    const fontSize = block.fontSize || '16px'
    const bgStyle = background ? `background:${background};` : ''
    const colorStyle = textColor ? `color:${textColor};` : ''
    return `<div style="padding:${padding};text-align:${align};${bgStyle}${colorStyle}"><p style="margin:0;line-height:1.5;font-family:${fontFamily};font-size:${fontSize};">${content}</p></div>`
  }).join('')

  // Wrap in email structure with optional logo
  let emailHtml = '<div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto;">'
  
  if (brandLogoUrl) {
    emailHtml += `<div style="background:#f3f4f6;padding:20px;margin-bottom:20px;"><img src="${brandLogoUrl}" alt="Logo" style="height:40px;" /></div>`
  }
  
  emailHtml += html
  emailHtml += '</div>'
  
  return emailHtml
}

export type Api = {
  // Outlook / Graph
  connectOutlook: () => Promise<{ status: 'connected' | 'disconnected' }>

  // Data models
  listLeads: () => Promise<Lead[]>
  listCampaigns: () => Promise<Campaign[]>
  listLogs: () => Promise<LogEntry[]>
  getSettings: () => Promise<Settings>
  setSettings: (s: Partial<Settings>) => Promise<Settings>

  // Scheduling/Send
  previewSchedule: (campaignId: UUID) => Promise<string[]> // ISO strings
  sendMail: (args: { to: string, subject: string, body: string, config?: { azure_client_id?: string, azure_tenant_id?: string, azure_client_secret?: string, mail_from?: string } }) => Promise<{ status: string }>
}

export const api: Api = {
  async connectOutlook() {
    // Placeholder: actual implementation will use Microsoft Graph auth flow
    await delay(300)
    return { status: 'connected' }
  },
  async listLeads() { return [] },
  async listCampaigns() { return [] },
  async listLogs() { return [] },
  async getSettings() { return { windowStart: '09:00', windowEnd: '17:00', intervalMinMins: 3, intervalMaxMins: 6 } },
  async setSettings(s) { return { windowStart: '09:00', windowEnd: '17:00', intervalMinMins: 3, intervalMaxMins: 6, ...s } },
  async previewSchedule() { return [] },
  async sendMail({ to, subject, body, config }) {
    // Calls local FastAPI backend stub
    const resp = await fetch('http://localhost:8000/send/mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body, ...(config||{}) }),
    })
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => null)
      if (resp.status === 401) {
        const message = errorData?.detail || 'Authentication expired. Please re-authenticate in Settings.'
        throw new Error(message)
      }
      throw new Error(errorData?.detail || `Backend error ${resp.status}`)
    }
    const json = await resp.json()
    return { status: json.status || 'unknown' }
  },
}

function delay(ms: number) { return new Promise(res => setTimeout(res, ms)) }
