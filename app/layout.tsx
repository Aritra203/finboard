import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'FinBoard - Customizable Finance Dashboard',
  description: 'Build your own real-time finance monitoring dashboard with customizable widgets. Track stocks, crypto, and market data.',
  authors: [{ name: 'FinBoard' }],
  openGraph: {
    title: 'FinBoard - Finance Dashboard',
    description: 'Create custom widgets by connecting to any finance API. Track real-time market data.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@FinBoard',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
