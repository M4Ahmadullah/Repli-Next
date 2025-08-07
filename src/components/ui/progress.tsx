'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  indicatorColor?: string
}

const Progress: React.FC<ProgressProps> = ({ 
  className, 
  value = 0, 
  indicatorColor, 
  ...props 
}) => {
  return (
    <div 
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full transition-all',
          indicatorColor || 'bg-primary'
        )}
        style={{ 
          width: `${Math.min(value, 100)}%`,
          transition: 'width 0.5s ease-in-out'
        }}
      />
    </div>
  )
}

export { Progress } 