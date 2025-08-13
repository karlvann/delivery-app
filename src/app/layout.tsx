import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import ErrorBoundary from './components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Ausbeds Delivery Calculator',
  description: 'Calculate delivery costs for Ausbeds mattresses',
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCAn-JvV4sTaGP5P4zFb0PlzFYOinzH1A8'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}