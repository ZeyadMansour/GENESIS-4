'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/NavBar'
import { apiService } from '@/lib/api'

export default function SkillsPage() {
  const [skills, setSkills] = useState<any[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => { loadSkills() }, [])

  async function loadSkills() {
    try {
      const data = await apiService.getSkills()
      setSkills(data.skills || [])
    } catch {}
  }

  async function handleCreate() {
    if (!name || !code) return
    await apiService.createSkill(name, description, code)
    setName('')
    setDescription('')
    setCode('')
    loadSkills()
  }

  async function handleDelete(skillName: string) {
    await apiService.deleteSkill(skillName)
    loadSkills()
  }

  return (
    <div className="flex flex-col h-screen bg-genesis-bg">
      <NavBar />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h1 className="text-lg font-mono uppercase tracking-wider">Skills</h1>

        {/* Create Skill */}
        <div className="bg-genesis-paper rounded-xl p-4 border border-genesis-border space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Skill name (e.g. web-research)"
            className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg placeholder:text-genesis-muted"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description..."
            className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg placeholder:text-genesis-muted"
          />
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Python code for this skill..."
            rows={6}
            className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg placeholder:text-genesis-muted resize-none"
          />
          <button
            onClick={handleCreate}
            className="w-full bg-genesis-accent text-genesis-fg rounded-lg py-2 text-sm font-mono uppercase tracking-wider"
          >
            Create Skill
          </button>
        </div>

        {/* Skills List */}
        <div className="space-y-2">
          {skills.map((s: any) => (
            <div key={s.name} className="bg-genesis-paper rounded-lg p-3 border border-genesis-border">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono text-genesis-fg">⚡ {s.name}</span>
                  <span className="text-xs text-genesis-muted ml-2">
                    Used {s.usage_count || 0}× • {(s.success_rate || 1) * 100}% success
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(s.name)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-genesis-muted mt-1">{s.description}</p>
            </div>
          ))}
          {skills.length === 0 && (
            <p className="text-xs text-genesis-muted text-center py-8">
              No skills created yet. Skills are auto-generated from complex interactions or created manually.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
