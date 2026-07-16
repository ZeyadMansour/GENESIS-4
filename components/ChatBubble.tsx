'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Message } from '@/lib/store'

export function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const isStreaming = message.streaming

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-enter`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-genesis-accent text-genesis-fg rounded-br-sm'
            : 'bg-genesis-paper text-genesis-fg rounded-bl-sm border border-genesis-border'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap font-mono">{message.content}</p>
        ) : (
          <div className="text-sm font-mono prose prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const codeStr = String(children).replace(/\n$/, '')
                  
                  if (match) {
                    return (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          margin: '8px 0',
                        }}
                      >
                        {codeStr}
                      </SyntaxHighlighter>
                    )
                  }
                  return (
                    <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs" {...props}>
                      {children}
                    </code>
                  )
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                },
                a({ href, children }) {
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer"
                       className="text-genesis-accent underline hover:text-white transition-colors">
                      {children}
                    </a>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-genesis-accent thinking-animate ml-1" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
