'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/NavBar'
import { apiService } from '@/lib/api'

export default function CronPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [schedule, setSchedule] = useState('')
  const [task, setTask] = useState('')
  const [platform, setPlatform] = useState('app')

  useEffect(() => { loadJobs() }, [])

  async function loadJobs() {
    try {
      const data = await apiService.getCronJobs()
      setJobs(data.jobs || [])
    } catch {}
  }

  async function handleCreate() {
    if (!schedule || !task) return
    await apiService.createCronJob(schedule, task, platform)
    setSchedule('')
    setTask('')
    loadJobs()
  }

  async function handleDelete(jobId: string) {
    await apiService.deleteCronJob(jobId)
    loadJobs()
  }

  return (
    <div className="flex flex-col h-screen bg-genesis-bg">
      <NavBar />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h1 className="text-lg font-mono uppercase tracking-wider">Cron Scheduler</h1>

        {/* Schedule Job */}
        <div className="bg-genesis-paper rounded-xl p-4 border border-genesis-border space-y-3">
          <input
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="Schedule (e.g. every morning at 8am, every friday, daily)"
            className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg placeholder:text-genesis-muted"
          />
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Task description (e.g. Send me a daily summary of news)"
            rows={3}
            className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg placeholder:text-genesis-muted resize-none"
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-3 py-2 text-sm font-mono text-genesis-fg"
          >
            <option value="app">Deliver in App</option>
            <option value="telegram">Deliver via Telegram</option>
          </select>
          <button
            onClick={handleCreate}
            className="w-full bg-genesis-accent text-genesis-fg rounded-lg py-2 text-sm font-mono uppercase tracking-wider"
          >
            Schedule Job
          </button>
        </div>

        {/* Job List */}
        <div className="space-y-2">
          {jobs.map((j: any) => (
            <div key={j.id} className="bg-genesis-paper rounded-lg p-3 border border-genesis-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-genesis-fg">⏰ {j.schedule}</span>
                <button
                  onClick={() => handleDelete(j.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-genesis-muted mt-1">{j.task}</p>
              <div className="flex gap-3 mt-1 text-xs text-genesis-muted">
                <span>Platform: {j.platform}</span>
                <span>Cron: {j.cron}</span>
                {j.last_run && <span>Last: {new Date(j.last_run).toLocaleString()}</span>}
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="text-xs text-genesis-muted text-center py-8">No scheduled jobs.</p>
          )}
        </div>
      </div>
    </div>
  )
}
