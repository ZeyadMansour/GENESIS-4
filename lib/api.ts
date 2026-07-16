const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://genesis4-backend.onrender.com'

export const apiService = {
  async chat(message: string, sessionId: string, model?: string) {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId, model }),
    })
    return res.json()
  },

  async getProviders() {
    const res = await fetch(`${API_URL}/api/providers`)
    return res.json()
  },

  async setProviderKey(provider: string, apiKey: string, customUrl?: string) {
    const params = new URLSearchParams({ api_key: apiKey })
    if (customUrl) params.append('custom_url', customUrl)
    const res = await fetch(`${API_URL}/api/providers/${provider}/key?${params}`, { method: 'POST' })
    return res.json()
  },

  async removeProviderKey(provider: string) {
    const res = await fetch(`${API_URL}/api/providers/${provider}/key`, { method: 'DELETE' })
    return res.json()
  },

  async getModels(provider?: string) {
    const params = provider ? `?provider=${provider}` : ''
    const res = await fetch(`${API_URL}/api/models${params}`)
    return res.json()
  },

  async searchModels(query: string) {
    const res = await fetch(`${API_URL}/api/models/search?query=${encodeURIComponent(query)}`)
    return res.json()
  },

  async setActiveModel(provider: string, model: string) {
    const params = new URLSearchParams({ provider, model })
    const res = await fetch(`${API_URL}/api/models/active?${params}`, { method: 'POST' })
    return res.json()
  },

  async getActiveConfig() {
    const res = await fetch(`${API_URL}/api/models/active`)
    return res.json()
  },

  async getMemories() {
    const res = await fetch(`${API_URL}/api/memory`)
    return res.json()
  },

  async addMemory(key: string, value: string, category: string = 'general') {
    const res = await fetch(`${API_URL}/api/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, category }),
    })
    return res.json()
  },

  async deleteMemory(key: string) {
    const res = await fetch(`${API_URL}/api/memory/${key}`, { method: 'DELETE' })
    return res.json()
  },

  async getSkills() {
    const res = await fetch(`${API_URL}/api/skills`)
    return res.json()
  },

  async createSkill(name: string, description: string, code: string) {
    const res = await fetch(`${API_URL}/api/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, code }),
    })
    return res.json()
  },

  async deleteSkill(name: string) {
    const res = await fetch(`${API_URL}/api/skills/${name}`, { method: 'DELETE' })
    return res.json()
  },

  async getCronJobs() {
    const res = await fetch(`${API_URL}/api/cron`)
    return res.json()
  },

  async createCronJob(schedule: string, task: string, platform: string = 'app') {
    const res = await fetch(`${API_URL}/api/cron`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule, task, platform }),
    })
    return res.json()
  },

  async deleteCronJob(jobId: string) {
    const res = await fetch(`${API_URL}/api/cron/${jobId}`, { method: 'DELETE' })
    return res.json()
  },

  async executeCode(code: string, language: string = 'python') {
    const res = await fetch(`${API_URL}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    })
    return res.json()
  },

  async getSubagents() {
    const res = await fetch(`${API_URL}/api/subagents`)
    return res.json()
  },

  async spawnSubagent(task: string) {
    const params = new URLSearchParams({ task })
    const res = await fetch(`${API_URL}/api/subagent?${params}`, { method: 'POST' })
    return res.json()
  },
}
