import { create } from 'zustand'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  streaming?: boolean
  thinking?: boolean
  toolCalls?: any[]
}

interface AppState {
  messages: Message[]
  activeSession: string
  activeProvider: string
  activeModel: string
  providers: Record<string, { key: string; url?: string }>
  
  addMessage: (msg: Message) => void
  updateLastMessage: (updates: Partial<Message>) => void
  clearMessages: () => void
  setActiveModel: (model: string) => void
  setActiveProvider: (provider: string) => void
  setProviderKey: (provider: string, key: string, url?: string) => void
  removeProvider: (provider: string) => void
}

export const useStore = create<AppState>((set, get) => ({
  messages: [
    { role: 'system', content: 'GENESIS-4 initialized. Triple-sandbox active. Ready.' },
  ],
  activeSession: 'default',
  activeProvider: 'gemini',
  activeModel: 'gemini-2.0-flash',
  providers: {},

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  
  updateLastMessage: (updates) => set((s) => {
    const msgs = [...s.messages]
    const last = msgs[msgs.length - 1]
    if (last && last.role === 'assistant') {
      msgs[msgs.length - 1] = { ...last, ...updates }
    }
    return { messages: msgs }
  }),
  
  clearMessages: () => set({
    messages: [{ role: 'system', content: 'Session reset.' }],
    activeSession: 'session-' + Date.now(),
  }),
  
  setActiveModel: (model) => set({ activeModel: model }),
  setActiveProvider: (provider) => set({ activeProvider: provider }),
  
  setProviderKey: (provider, key, url) => set((s) => ({
    providers: { ...s.providers, [provider]: { key, url } }
  })),
  
  removeProvider: (provider) => set((s) => {
    const { [provider]: _, ...rest } = s.providers
    return { providers: rest }
  }),
}))
