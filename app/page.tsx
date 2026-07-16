'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { ChatBubble } from '@/components/ChatBubble'
import { ThinkingBlock } from '@/components/ThinkingBlock'
import { SlashCommands } from '@/components/SlashCommands'
import { NavBar } from '@/components/NavBar'
import { wsService } from '@/lib/websocket'
import { apiService } from '@/lib/api'

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [showSlash, setShowSlash] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
    messages, addMessage, updateLastMessage,
    activeSession, activeModel, activeProvider,
  } = useStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    wsService.connect(activeSession)
    return () => wsService.disconnect()
  }, [activeSession])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming) return

    const msg = input.trim()
    setInput('')
    setShowSlash(false)
    setStreaming(true)

    addMessage({ role: 'user', content: msg })

    // Handle slash commands locally
    if (msg.startsWith('/')) {
      handleSlashCommand(msg)
      setStreaming(false)
      return
    }

    addMessage({ role: 'assistant', content: '', streaming: true })

    try {
      await wsService.send({
        message: msg,
        session_id: activeSession,
        model: `${activeProvider}:${activeModel}`,
        reasoning: true,
      })
    } catch {
      // Fallback to REST
      const response = await apiService.chat(msg, activeSession)
      updateLastMessage({ content: response.content, streaming: false })
      setStreaming(false)
    }
  }, [input, streaming, activeSession, activeProvider, activeModel])

  const handleSlashCommand = (cmd: string) => {
    const parts = cmd.split(' ')
    const command = parts[0].toLowerCase()

    switch (command) {
      case '/new':
      case '/reset':
        useStore.getState().clearMessages()
        addMessage({ role: 'system', content: 'Session reset. New conversation started.' })
        break
      case '/model':
        const model = parts.slice(1).join(' ')
        if (model) {
          useStore.getState().setActiveModel(model)
          addMessage({ role: 'system', content: `✓ Switched to ${model}` })
        }
        break
      case '/skills':
        addMessage({ role: 'system', content: 'Opening skills browser...' })
        break
      case '/compress':
        addMessage({ role: 'system', content: 'Context compressed. Summarizing previous conversation...' })
        break
      case '/usage':
        addMessage({ role: 'system', content: 'Usage: This session has ' + messages.length + ' messages.' })
        break
      default:
        addMessage({ role: 'system', content: `Unknown command: ${command}` })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    if (e.key === '/' && input === '') {
      setShowSlash(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (e.target.value === '/') {
      setShowSlash(true)
    } else if (!e.target.value.startsWith('/')) {
      setShowSlash(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-genesis-bg">
      <NavBar />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className="message-enter">
            {msg.role === 'system' ? (
              <div className="text-genesis-muted text-xs text-center py-2 font-mono uppercase tracking-wider">
                {msg.content}
              </div>
            ) : msg.content.includes('thinking') ? (
              <ThinkingBlock content={msg.content} />
            ) : (
              <ChatBubble message={msg} />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Slash Command Popup */}
      {showSlash && (
        <SlashCommands
          onSelect={(cmd) => {
            setInput(cmd + ' ')
            setShowSlash(false)
          }}
          onClose={() => setShowSlash(false)}
        />
      )}

      {/* Input Bar */}
      <div className="p-3 border-t border-genesis-border safe-bottom">
        <div className="flex gap-2 items-end bg-genesis-paper rounded-xl p-2 border border-genesis-border">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message GENESIS-4... ( / for commands)"
            rows={1}
            className="flex-1 bg-transparent text-genesis-fg placeholder:text-genesis-muted resize-none outline-none font-mono text-sm py-2 px-1 max-h-32"
            style={{ minHeight: '36px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="shrink-0 w-9 h-9 rounded-lg bg-genesis-accent text-genesis-fg flex items-center justify-center disabled:opacity-30 transition-opacity"
          >
            {streaming ? (
              <span className="thinking-animate">●</span>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
