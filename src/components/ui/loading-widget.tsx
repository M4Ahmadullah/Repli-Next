'use client'

import { motion } from 'framer-motion'
import { Bot, Sparkles, MessageSquare, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface LoadingWidgetProps {
  title?: string
  description?: string
  showStats?: boolean
}

export function LoadingWidget({ 
  title = "Loading Repli", 
  description = "Preparing your AI-powered dashboard...",
  showStats = false 
}: LoadingWidgetProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="elegant-card border-0 shadow-2xl bg-white/80 dark:bg-emerald-900/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            {/* Animated Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Bot className="w-10 h-10 text-white" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl font-bold text-green-800 dark:text-green-100 mb-3"
            >
              {title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-green-600 dark:text-green-300 mb-6"
            >
              {description}
            </motion.p>

            {/* Loading Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center items-center gap-2 mb-6"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-emerald-500 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.div>

            {/* Optional Stats Preview */}
            {showStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-emerald-200 dark:border-emerald-700"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-8 h-8 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </motion.div>
                  <div className="text-sm text-green-600 dark:text-green-400">Messages</div>
                </div>
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    className="w-8 h-8 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-lg flex items-center justify-center mx-auto mb-2"
                  >
                    <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <div className="text-sm text-green-600 dark:text-green-400">Analytics</div>
                </div>
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    className="w-8 h-8 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-2"
                  >
                    <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </motion.div>
                  <div className="text-sm text-green-600 dark:text-green-400">AI Ready</div>
                </div>
              </motion.div>
            )}

            {/* Subtle pulse effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 rounded-2xl"
              animate={{
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 