'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/NavBar'
import { apiService } from '@/lib/api'
import { useStore } from '@/lib/store'

export default function SettingsPage() {
  const [providers, setProviders] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [status, setStatus] = useState('')
  const { activeProvider, activeModel, setActiveProvider, setActiveModel } = useStore()

  useEffect(() => {
    loadProviders()
    loadModels()
  }, [])

  async function loadProviders() {
    try {
      const data = await apiService.getProviders()
      setProviders(data.providers || [])
    } catch {}
  }

  async function loadModels(provider?: string) {
    try {
      const data = await apiService.getModels(provider)
      setModels(data.models || [])
    } catch {}
  }

  async function handleSaveKey() {
    if (!selectedProvider || !apiKey) return
    setStatus('Saving...')
    try {
      await apiService.setProviderKey(selectedProvider, apiKey, customUrl || undefined)
      setStatus('✓ API key saved')
      setApiKey('')
      setCustomUrl('')
      loadProviders()
      loadModels(selectedProvider)
    } catch (err: any) {
      setStatus('✗ Error: ' + (err.message || 'Failed'))
    }
  }

  async function handleRemoveKey(provider: string) {
    try {
      await apiService.removeProviderKey(provider)
      loadProviders()
      setModels([])
      setStatus('✓ Key removed')
    } catch {}
  }

  async function handleSelectModel(provider: string, model: string) {
    try {
      await apiService.setActiveModel(provider, model)
      setActiveProvider(provider)
      setActiveModel(model)
      setStatus(`✓ Active: ${provider}/${model}`)
    } catch {}
  }

  async function handleSearch() {
    if (!searchQuery) {
      loadModels()
      return
    }
    try {
      const data = await apiService.searchModels(searchQuery)
      setModels(data.models || [])
    } catch {}
  }

  return (
    <div className="flex flex-col h-screen bg-genesis-bg">
      <NavBar />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-lg font-mono uppercase tracking-wider">Settings</h1>
          <p className="text-xs text-genesis-muted mt-1">
            Active: {activeProvider}/{activeModel}
          </p>
        </div>

        {/* Status */}
        {status && (
          <div className={`text-xs font-mono p-2 rounded ${
            status.startsWith('✓') ? 'bg-green-900/30 text-green-300' :
            status.startsWith('✗') ? 'bg-red-900/30 text-red-300' :
            'bg-genesis-paper text-genesis-muted'
          }`}>
            {status}
          </div>
        )}

        {/* Add Provider Key */}
        <section className="space-y-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-genesis-muted">
            Add Provider API Key
          </h2>

          <select
            value={selectedProvider}
            onChange={(e) => {
              setSelectedProvider(e.target.value)
              setCustomUrl('')
            }}
            className="w-full bg-genesis-paper border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg"
          >
            <option value="">Select provider...</option>
            {providers.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.configured ? '(✓ configured)' : ''}
              </option>
            ))}
          </select>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your API key..."
            className="w-full bg-genesis-paper border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg placeholder:text-genesis-muted"
          />

          {selectedProvider === 'custom' && (
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Custom API base URL (e.g. https://my-api.com/v1)"
              className="w-full bg-genesis-paper border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg placeholder:text-genesis-muted"
            />
          )}

          <button
            onClick={handleSaveKey}
            disabled={!selectedProvider || !apiKey}
            className="w-full bg-genesis-accent text-genesis-fg rounded-lg py-2 text-sm font-mono uppercase tracking-wider disabled:opacity-30"
          >
            Save API Key
          </button>
        </section>

        {/* Configured Providers */}
        <section className="space-y-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-genesis-muted">
            Configured Providers
          </h2>
          {providers.filter((p: any) => p.configured).length === 0 ? (
            <p className="text-xs text-genesis-muted">No providers configured yet.</p>
          ) : (
            providers.filter((p: any) => p.configured).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between bg-genesis-paper rounded-lg p-3 border border-genesis-border">
                <div>
                  <div className="text-sm font-mono">{p.name}</div>
                  <div className="text-xs text-genesis-muted">{p.description}</div>
                </div>
                <button
                  onClick={() => handleRemoveKey(p.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-mono px-2 py-1"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </section>

        {/* Model Selection */}
        <section className="space-y-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-genesis-muted">
            Available Models
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search models..."
              className="flex-1 bg-genesis-paper border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg placeholder:text-genesis-muted"
            />
            <button
              onClick={handleSearch}
              className="bg-genesis-accent text-genesis-fg rounded-lg px-3 py-2 text-sm font-mono"
            >
              Search
            </button>
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {models.map((m: any) => (
              <button
                key={`${m.provider}:${m.id}`}
                onClick={() => handleSelectModel(m.provider, m.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeProvider === m.provider && activeModel === m.id
                    ? 'bg-genesis-accent text-genesis-fg'
                    : 'bg-genesis-paper hover:bg-genesis-accent/20 border border-genesis-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-mono">{m.name || m.id}</div>
                  {activeProvider === m.provider && activeModel === m.id && (
                    <span className="text-xs">✓ Active</span>
                  )}
                </div>
                <div className="text-xs text-genesis-muted mt-0.5">
                  {m.provider_name} • {m.id}
                </div>
              </button>
            ))}
            {models.length === 0 && (
              <p className="text-xs text-genesis-muted p-3">
                No models loaded. Configure a provider above first.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
