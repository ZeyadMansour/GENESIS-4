'use client'

import { useEffect, useRef } from 'react'
import { NavBar } from '@/components/NavBar'
import { pyodideService } from '@/lib/pyodide'
import { apiService } from '@/lib/api'

export default function TerminalPage() {
  const termRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<any>(null)
  const fitAddonRef = useRef<any>(null)

  useEffect(() => {
    let term: any = null

    async function initTerminal() {
      const { Terminal } = await import('@xterm/xterm')
      const { FitAddon } = await import('@xterm/addon-fit')
      const { WebLinksAddon } = await import('@xterm/addon-web-links')

      term = new Terminal({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 13,
        fontFamily: "'Courier Prime', 'Courier New', monospace",
        theme: {
          background: '#0000f2',
          foreground: '#f5f5f5',
          cursor: '#f5f5f5',
          selectionBackground: '#3b3bff',
          black: '#0a0a8a',
          red: '#ff5555',
          green: '#50fa7b',
          yellow: '#f1fa8c',
          blue: '#3b3bff',
          magenta: '#ff79c6',
          cyan: '#8be9fd',
          white: '#f5f5f5',
          brightBlack: '#1a1a5e',
          brightWhite: '#ffffff',
        },
        allowProposedApi: true,
      })

      const fitAddon = new FitAddon()
      const webLinksAddon = new WebLinksAddon()

      term.loadAddon(fitAddon)
      term.loadAddon(webLinksAddon)

      if (termRef.current) {
        term.open(termRef.current)
        fitAddon.fit()
      }

      xtermRef.current = term
      fitAddonRef.current = fitAddon

      // Welcome message
      term.writeln('')
      term.writeln('  ☤  GENESIS-4 TERMINAL')
      term.writeln('  ═══════════════════════════════════')
      term.writeln('')
      term.writeln('  Triple-sandbox architecture active:')
      term.writeln('  • Pyodide (on-device Python WASM)')
      term.writeln('  • Piston (cloud containers)')
      term.writeln('  • Terminal UI (xterm.js)')
      term.writeln('')
      term.writeln('  Type /help for commands.')
      term.writeln('')

      // Command handler
      const commandHistory: string[] = []
      let historyIndex = -1
      let currentLine = ''

      term.onData((data: string) => {
        if (data === '\r') {
          // Enter
          term.writeln('')
          if (currentLine.trim()) {
            commandHistory.push(currentLine)
            historyIndex = commandHistory.length
            handleCommand(currentLine.trim(), term)
          }
          currentLine = ''
          term.write('$ ')
        } else if (data === '\x7f') {
          // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1)
            term.write('\b \b')
          }
        } else if (data === '\x1b[A') {
          // Up arrow
          if (historyIndex > 0) {
            historyIndex--
            replaceLine(term, currentLine, commandHistory[historyIndex])
            currentLine = commandHistory[historyIndex]
          }
        } else if (data === '\x1b[B') {
          // Down arrow
          if (historyIndex < commandHistory.length - 1) {
            historyIndex++
            replaceLine(term, currentLine, commandHistory[historyIndex])
            currentLine = commandHistory[historyIndex]
          } else {
            historyIndex = commandHistory.length
            replaceLine(term, currentLine, '')
            currentLine = ''
          }
        } else {
          currentLine += data
          term.write(data)
        }
      })

      term.write('$ ')
    }

    initTerminal()

    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose()
      }
    }
  }, [])

  async function handleCommand(cmd: string, term: any) {
    const parts = cmd.split(' ')
    const command = parts[0].toLowerCase()

    switch (command) {
      case 'help':
        term.writeln('  Commands:')
        term.writeln('  /model [provider:model]  — Switch LLM')
        term.writeln('  /skills                  — List skills')
        term.writeln('  /new                     — New session')
        term.writeln('  py [code]                — Run Python on-device (Pyodide)')
        term.writeln('  cloud [code]             — Run in cloud sandbox (Piston)')
        term.writeln('  search [query]           — Web search')
        term.writeln('  memory                   — View memories')
        term.writeln('  clear                    — Clear terminal')
        term.writeln('  help                     — This message')
        break

      case 'clear':
        term.clear()
        break

      case 'py':
        const pyCode = parts.slice(1).join(' ')
        if (pyCode) {
          term.writeln('  ⚡ Running on-device (Pyodide WASM)...')
          const result = await pyodideService.run(pyCode)
          if (result.stdout) term.writeln('  ' + result.stdout.replace(/\n/g, '\n  '))
          if (result.stderr) term.writeln('  [ERROR] ' + result.stderr)
        }
        break

      case 'cloud':
        const cloudCode = parts.slice(1).join(' ')
        if (cloudCode) {
          term.writeln('  ☁️ Running in cloud sandbox (Piston)...')
          const result = await apiService.executeCode(cloudCode, 'python')
          if (result.output) term.writeln('  ' + result.output.replace(/\n/g, '\n  '))
          if (result.stderr) term.writeln('  [STDERR] ' + result.stderr)
        }
        break

      case 'search':
        const query = parts.slice(1).join(' ')
        if (query) {
          term.writeln('  🔍 Searching: ' + query)
          const result = await apiService.executeCode(
            `import json; print(json.dumps({"query": "${query}", "status": "searching"}))`,
            'python'
          )
        }
        break

      case 'memory':
        term.writeln('  🧠 Fetching memories...')
        const memories = await apiService.getMemories()
        if (memories.memories?.length) {
          memories.memories.forEach((m: any) => {
            term.writeln(`  • ${m.key}: ${m.value?.slice(0, 80)}`)
          })
        } else {
          term.writeln('  (no memories stored)')
        }
        break

      default:
        if (cmd.startsWith('/')) {
          term.writeln(`  Slash command: ${cmd}`)
          term.writeln('  (Use /help to see available commands)')
        } else {
          term.writeln(`  Unknown: ${cmd}`)
          term.writeln('  Type /help for commands.')
        }
    }

    term.writeln('')
  }

  function replaceLine(term: any, oldLine: string, newLine: string) {
    term.write('\r$ ' + ' '.repeat(oldLine.length))
    term.write('\r$ ' + newLine)
  }

  return (
    <div className="flex flex-col h-screen bg-genesis-bg">
      <NavBar />
      <div ref={termRef} className="flex-1 overflow-hidden" />
    </div>
  )
}
