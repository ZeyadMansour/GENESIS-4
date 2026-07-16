'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

export function ThinkingBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false)

  // Parse thinking and response sections
  const thinkMatch = content.match(/thinking\n([\s\S]*?)\nresponse/)
  const responseMatch = content.match(/response\n([\s\S]*?)$/)

  const thinking = thinkMatch?.[1]?.trim() || ''
  const response = responseMatch?.[1]?.trim() || content

  return (
    <div className="message-enter">
      {/* Thinking Section */}
      {thinking && (
        <div className="mb-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-genesis-muted hover:text-genesis-fg transition-colors w-full text-left py-1"
          >
            <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
            <span className="thinking-animate">●</span>
            Thinking...
            <span className="text-genesis-muted/50">
              ({thinking.split(' ').length} words)
            </span>
          </button>
          {expanded && (
            <div className="mt-2 p-3 bg-genesis-thinking rounded-lg border border-genesis-border text-xs font-mono text-genesis-muted leading-relaxed max-h-64 overflow-y-auto">
              <ReactMarkdown>{thinking}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Response Section */}
      <div className="bg-genesis-paper rounded-2xl rounded-bl-sm px-4 py-3 border border-genesis-border max-w-[85%]">
        <div className="text-sm font-mono prose prose-invert max-w-none">
          <ReactMarkdown>{response}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
