// API contracts for future Python backend; mocked for now
import type { Campaign, Lead, LogEntry, Settings, UUID } from '../store/types'

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
