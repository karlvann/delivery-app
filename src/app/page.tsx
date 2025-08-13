'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import to avoid SSR issues with Google Maps
const SinglePageDeliveryForm = dynamic(
  () => import('./components/SinglePageDeliveryForm'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery calculator...</p>
        </div>
      </div>
    )
  }
)

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <SinglePageDeliveryForm />
    </Suspense>
  )
}