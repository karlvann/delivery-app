'use client'

import { useEffect } from 'react'
import Script from 'next/script'

interface GoogleMapsLoaderProps {
  apiKey: string
}

export default function GoogleMapsLoader({ apiKey }: GoogleMapsLoaderProps) {
  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
      strategy="afterInteractive"
    />
  )
}