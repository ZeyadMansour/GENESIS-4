'use client'

const commands = [
  { cmd: '/new', desc: 'Start a fresh conversation', icon: '🔄' },
  { cmd: '/reset', desc: 'Reset current session', icon: '🔁' },
  { cmd: '/model ', desc: 'Switch LLM model (e.g. /model openrouter:hermes-4-14b)', icon: '🧠' },
  { cmd: '/personality ', desc: 'Set agent personality', icon: '🎭' },
  { cmd: '/skills', desc: 'Browse available skills', icon: '⚡' },
  { cmd: '/compress', desc: 'Compress conversation context', icon: '📦' },
  { cmd: '/usage', desc: 'Show session usage stats', icon: '📊' },
  { cmd: '/retry', desc: 'Retry last response', icon: '🔁' },
  { cmd: '/undo', desc: 'Undo last turn', icon: '↩️' },
  { cmd: '/platforms', desc: 'Show connected platforms', icon: '🔌' },
  { cmd: '/stop', desc: 'Stop current generation', icon: '⏹️' },
]

export function SlashCommands({ onSelect, onClose }: {
  onSelect: (cmd: string) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-20 left-4 right-4 z-50 slash-popup p-2 max-h-64 overflow-y-auto">
        <div className="text-xs text-genesis-muted px-3 py-2 font-mono uppercase tracking-wider">
          Slash Commands
        </div>
        {commands.map((c) => (
          <button
            key={c.cmd}
            onClick={() => onSelect(c.cmd)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-genesis-accent/20 transition-colors text-left"
          >
            <span className="text-base">{c.icon}</span>
            <div>
              <div className="text-sm font-mono text-genesis-fg">{c.cmd}</div>
              <div className="text-xs text-genesis-muted">{c.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
