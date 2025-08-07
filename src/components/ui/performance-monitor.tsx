'use client'

import { useEffect, useState } from 'react'

interface PerformanceMonitorProps {
  name: string
  onLoad?: () => void
}

export function PerformanceMonitor({ name, onLoad }: PerformanceMonitorProps) {
  const [startTime] = useState(Date.now())
  const [loadTime, setLoadTime] = useState<number | null>(null)

  useEffect(() => {
    const handleLoad = () => {
      const time = Date.now() - startTime
      setLoadTime(time)
      console.log(`⏱️ [PERF] ${name} loaded in ${time}ms`)
      onLoad?.()
    }

    // If already loaded, call immediately
    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [name, startTime, onLoad])

  return null // This component doesn't render anything
} 