'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/NavBar'
import { apiService } from '@/lib/api'

export default function MemoryPage() {
  const [memories, setMemories] = useState<any[]>([])
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [category, setCategory] = useState('general')

  useEffect(() => { loadMemories() }, [])

  async function loadMemories() {
    try {
      const data = await apiService.getMemories()
      setMemories(data.memories || [])
    } catch {}
  }

  async function handleAdd() {
    if (!key || !value) return
    await apiService.addMemory(key, value, category)
    setKey('')
    setValue('')
    loadMemories()
  }

  async function handleDelete(memKey: string) {
    await apiService.deleteMemory(memKey)
    loadMemories()
  }

  return (
    <div className="flex flex-col h-screen bg-genesis-bg">
      <NavBar />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h1 className="text-lg font-mono uppercase tracking-wider">Persistent Memory</h1>

        {/* Add Memory */}
        <div className="bg-genesis-paper rounded-xl p-4 border border-genesis-border space-y-3">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Key (e.g. user_name)"
            className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg placeholder:text-genesis-muted"
          />
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value..."
            rows={3}
            className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg placeholder:text-genesis-muted resize-none"
          />
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-genesis-bg border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg"
            >
              <option value="general">General</option>
              <option value="project">Project</option>
              <option value="personal">Personal</option>
              <option value="skill">Skill</option>
              <option value="system">System</option>
            </select>
            <button
              onClick={handleAdd}
              className="bg-genesis-accent text-genesis-fg rounded-lg px-4 py-2 text-sm font-mono uppercase tracking-wider"
            >
              Store
            </button>
          </div>
        </div>

        {/* Memory List */}
        <div className="space-y-2">
          {memories.map((m: any) => (
            <div key={m.key} className="bg-genesis-paper rounded-lg p-3 border border-genesis-border flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-genesis-fg truncate">{m.key}</span>
                  <span className="text-xs text-genesis-muted bg-genesis-bg px-1.5 py-0.5 rounded">{m.category}</span>
                </div>
                <div className="text-xs text-genesis-muted mt-1 line-clamp-2">{m.value}</div>
              </div>
              <button
                onClick={() => handleDelete(m.key)}
                className="text-xs text-red-400 hover:text-red-300 ml-2 shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
          {memories.length === 0 && (
            <p className="text-xs text-genesis-muted text-center py-8">No memories stored yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
