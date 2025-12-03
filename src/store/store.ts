import { create } from 'zustand'
import { nanoid } from '../utils/nanoid'
import type { Campaign, ConnectionStatus, Lead, LogEntry, Settings, UiTheme, UUID } from './types'

type State = {
  leads: Lead[]
  campaigns: Campaign[]
  logs: LogEntry[]
  settings: Settings
  connection: ConnectionStatus
  uiTheme: UiTheme
}

type Actions = {
  setConnection: (status: ConnectionStatus) => void
  addLeads: (leads: Omit<Lead, 'id'>[]) => void
  removeLead: (id: UUID) => void
  addCampaign: (c: Omit<Campaign, 'id' | 'leadIds'> & { leadIds?: UUID[] }) => UUID
  updateCampaign: (id: UUID, patch: Partial<Omit<Campaign, 'id'>>) => void
  attachLeadsToCampaign: (campaignId: UUID, leadIds: UUID[]) => void
  clearCampaignLeads: (campaignId: UUID) => void
  logSend: (entry: Omit<LogEntry, 'id'>) => void
  setSettings: (s: Partial<Settings>) => void
  setUiTheme: (t: UiTheme) => void
}

const initial: State = {
  leads: [],
  campaigns: [],
  logs: [],
  connection: 'mock',
  settings: {
    windowStart: '09:00',
    windowEnd: '17:00',
    intervalMinMins: 3,
    intervalMaxMins: 6,
  },
  uiTheme: 'light',
}

function loadState(): Partial<State> {
  try {
    const raw = localStorage.getItem('outreach-state')
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed as Partial<State>
  } catch {
    return {}
  }
}

function saveState(state: State) {
  try {
    const toSave: State = {
      leads: state.leads,
      campaigns: state.campaigns,
      logs: state.logs,
      connection: state.connection,
      settings: state.settings,
      uiTheme: state.uiTheme,
    }
    localStorage.setItem('outreach-state', JSON.stringify(toSave))
  } catch {
    // ignore
  }
}

function applyTheme(theme: UiTheme) {
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-dark')
  root.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light')
}

export const useStore = create<State & Actions>((set, get) => {
  const loadedState = loadState()
  if (loadedState.uiTheme && loadedState.uiTheme !== 'light' && loadedState.uiTheme !== 'dark') {
    loadedState.uiTheme = 'light'
  }
  const initialState = { ...initial, ...loadedState }

  // Apply theme immediately on load
  if (typeof document !== 'undefined') {
    applyTheme(initialState.uiTheme)
  }
  
  return {
    ...initialState,
    setConnection: (status) => set({ connection: status }),
    addLeads: (items) => set((s) => {
      const newLeads = items.map(l => ({ ...l, id: nanoid() }))
      const newLeadIds = newLeads.map(l => l.id)
      // Auto-attach new leads to all existing campaigns
      const updatedCampaigns = s.campaigns.map(c => ({
        ...c,
        leadIds: Array.from(new Set([...c.leadIds, ...newLeadIds]))
      }))
      return { leads: [...s.leads, ...newLeads], campaigns: updatedCampaigns }
    }),
    removeLead: (id) => set((s) => ({ leads: s.leads.filter(l => l.id !== id) })),
    addCampaign: (c) => {
      const id = nanoid()
      const campaign: Campaign = {
        id,
        name: c.name,
        step1: c.step1,
        step2: c.step2,
        step2DelayDays: c.step2DelayDays,
        leadIds: c.leadIds ?? [],
      }
      set((s) => ({ campaigns: [campaign, ...s.campaigns] }))
      return id
    },
    updateCampaign: (id, patch) => set((s) => ({
      campaigns: s.campaigns.map(c => c.id === id ? { ...c, ...patch } : c)
    })),
    attachLeadsToCampaign: (campaignId, leadIds) => set((s) => ({
      campaigns: s.campaigns.map(c => c.id === campaignId ? { ...c, leadIds: Array.from(new Set([...(c.leadIds||[]), ...leadIds])) } : c)
    })),
    clearCampaignLeads: (campaignId) => set((s) => ({
      campaigns: s.campaigns.map(c => c.id === campaignId ? { ...c, leadIds: [] } : c)
    })),
    logSend: (entry) => set((s) => ({ logs: [{ ...entry, id: nanoid() }, ...s.logs] })),
    setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    setUiTheme: (t) => set(() => ({ uiTheme: t })),
  }
})

// Persist on any change
try {
  const unsub = useStore.subscribe((state) => {
    saveState(state)
    // Apply theme to document root
    applyTheme(state.uiTheme)
  })
  // ;(window as any).__outreach_unsub = unsub
} catch {
  // SSR or localStorage not available; ignore
}
