export type UUID = string

export type Lead = {
  id: UUID
  email: string
}

export type EmailStep = {
  subject: string
  body: string
}

export type Campaign = {
  id: UUID
  name: string
  step1: EmailStep
  step2?: EmailStep
  step2DelayDays?: number
  leadIds: UUID[]
}

export type Settings = {
  windowStart: string // "HH:mm"
  windowEnd: string   // "HH:mm"
  intervalMinMins: number
  intervalMaxMins: number
  azure_client_id?: string
  azure_tenant_id?: string
  mail_from?: string
  appName?: string
  appLogoUrl?: string
}

export type UiTheme = 'light' | 'dark'

export type ConnectionStatus = 'disconnected' | 'connected' | 'mock'

export type LogEntry = {
  id: UUID
  to: string
  time: string // ISO
  campaignId: UUID
  step: 1 | 2
}
