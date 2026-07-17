let pyodideInstance: any = null
let loading = false
let loadPromise: Promise<any> | null = null

export const pyodideService = {
  async load(): Promise<any> {
    if (pyodideInstance) return pyodideInstance
    if (loading && loadPromise) return loadPromise

    loading = true
    loadPromise = (async () => {
      try {
        // Load Pyodide from CDN
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js'
        document.head.appendChild(script)

        await new Promise((resolve) => { script.onload = resolve })

        // @ts-ignore
        pyodideInstance = await (window as any).loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
        })

        console.log('[GENESIS-4] Pyodide loaded — Python on-device ready')
        loading = false
        return pyodideInstance
      } catch (err) {
        console.error('[GENESIS-4] Pyodide load failed:', err)
        loading = false
        return null
      }
    })()

    return loadPromise
  },

  async run(code: string): Promise<{ stdout: string; stderr: string; result: any }> {
    const pyodide = await this.load()
    if (!pyodide) {
      return { stdout: '', stderr: 'Pyodide not available', result: null }
    }

    try {
      // Capture stdout
      let stdout = ''
      pyodide.setStdout({ batched: (text: string) => { stdout += text + '\n' } })
      pyodide.setStderr({ batched: (text: string) => { stdout += '[stderr] ' + text + '\n' } })

      const result = await pyodide.runPythonAsync(code)
      return { stdout: stdout.trim(), stderr: '', result }
    } catch (err: any) {
      return { stdout: '', stderr: err.message || 'Python error', result: null }
    }
  },

  isLoaded(): boolean {
    return pyodideInstance !== null
  },
}
