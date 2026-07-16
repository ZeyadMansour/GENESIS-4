import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GENESIS-4',
  description: 'The fourth-generation universal AI agent. Triple-sandbox architecture. Any model, any provider.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GENESIS-4',
    startupImage: ['/icon-512.png'],
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'theme-color': '#0000f2',
  },
}

export const viewport: Viewport = {
  themeColor: '#0000f2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-genesis-bg text-genesis-fg min-h-screen safe-top safe-bottom">
        {children}
      </body>
    </html>
  )
}
