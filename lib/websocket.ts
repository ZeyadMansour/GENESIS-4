const WS_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://genesis4-backend.onrender.com')
  .replace('https://', 'wss://').replace('http://', 'ws://')

type StreamCallback = (data: any) => void

class WsService {
  private ws: WebSocket | null = null
  private callbacks: StreamCallback[] = []
  private reconnectTimer: any = null
  private sessionId: string = 'default'

  connect(sessionId: string) {
    this.sessionId = sessionId
    this.disconnect()

    try {
      this.ws = new WebSocket(`${WS_URL}/ws/${sessionId}`)
      
      this.ws.onopen = () => {
        console.log('[GENESIS-4] WebSocket connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.callbacks.forEach(cb => cb(data))
        } catch {}
      }

      this.ws.onclose = () => {
        console.log('[GENESIS-4] WebSocket closed')
        this.reconnectTimer = setTimeout(() => this.connect(sessionId), 3000)
      }

      this.ws.onerror = (err) => {
        console.error('[GENESIS-4] WebSocket error', err)
      }
    } catch {
      console.warn('[GENESIS-4] WebSocket unavailable, using REST fallback')
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  async send(data: any): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      throw new Error('WebSocket not connected')
    }
  }

  onStream(callback: StreamCallback) {
    this.callbacks.push(callback)
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback)
    }
  }
}

export const wsService = new WsService()
