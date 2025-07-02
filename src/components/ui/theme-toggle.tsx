'use client'

import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className={cn("w-16 h-8 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse", className)} />
    )
  }

  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "relative flex items-center w-16 h-8 rounded-full p-1 transition-all duration-500 ease-in-out",
        "bg-gradient-to-r from-gray-200 to-gray-100 dark:from-emerald-600 dark:to-green-600",
        "shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95",
        "border-2 border-gray-300 dark:border-emerald-400",
        "focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-emerald-300",
        className
      )}
      whileTap={{ scale: 0.95 }}
      initial={false}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-300/20 to-gray-200/20 dark:from-emerald-500/20 dark:to-green-500/20 blur-md" />
      
      {/* Sliding knob */}
      <motion.div
        className={cn(
          "relative w-6 h-6 rounded-full shadow-lg flex items-center justify-center z-10",
          "bg-white dark:bg-gray-900",
          "border-2 border-gray-200 dark:border-emerald-200"
        )}
        layout
        initial={false}
        animate={{
          x: isDark ? 32 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
          mass: 0.8
        }}
      >
        {/* Icon container with rotation */}
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 180, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex items-center justify-center"
            >
              <Moon className="w-3.5 h-3.5 text-emerald-600 drop-shadow-sm" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 180, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -180, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex items-center justify-center"
            >
              <Sun className="w-3.5 h-3.5 text-gray-600 drop-shadow-sm" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Decorative sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1 left-2"
          animate={{
            opacity: isDark ? [0, 1, 0] : [1, 0, 1],
            scale: isDark ? [0.5, 1, 0.5] : [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Sparkles className="w-2 h-2 text-gray-400 dark:text-emerald-300" />
        </motion.div>
        <motion.div
          className="absolute bottom-1 right-2"
          animate={{
            opacity: isDark ? [0, 1, 0] : [1, 0, 1],
            scale: isDark ? [0.5, 1, 0.5] : [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            delay: 1,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Sparkles className="w-1.5 h-1.5 text-gray-500 dark:text-green-300" />
        </motion.div>
      </div>

      {/* Accessibility label */}
      <span className="sr-only">
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
    </motion.button>
  )
} 