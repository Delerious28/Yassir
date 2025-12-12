export type UUID = string

export type Lead = {
  id: UUID
  email: string
}

export type EmailStep = {
  subject: string
  body: string
}

export type CampaignContentBlock = {
  blockId: UUID // references template block
  content: string // text for text blocks, image URL for images, button label for buttons
  buttonUrl?: string // for button blocks
}

export type Campaign = {
  id: UUID
  name: string
  templateId?: UUID // references EmailTemplate
  step1: EmailStep
  step1Content?: CampaignContentBlock[] // template content for step 1
  step2?: EmailStep
  step2Content?: CampaignContentBlock[] // template content for step 2
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
  brandLogoUrl?: string
  defaultEmailTemplate?: EmailTemplate
  templates?: EmailTemplate[]
  defaultTemplateId?: UUID
}

export type EmailTemplate = {
  id: UUID
  name: string
  brandColor?: string
  blocks: EmailBlock[]
  attachments?: TemplateAttachment[]
}

export type EmailBlock = {
  id: UUID
  type: 'text' | 'image' | 'button'
  content: string
  align?: 'left' | 'center' | 'right'
  background?: string
  textColor?: string
  padding?: string
  fontFamily?: string
  fontSize?: string
  buttonUrl?: string
}

export type TemplateAttachment = {
  id: UUID
  label: string
  url?: string
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
