'use client'

import { useState } from 'react'
import { Bell, Check, X, AlertCircle, MessageSquare, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

interface Notification {
  id: string
  type: 'message' | 'bot' | 'system' | 'warning'
  title: string
  description: string
  timestamp: Date
  read: boolean
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'message',
    title: 'New Message Received',
    description: 'Customer inquiry from +1 (555) 123-4567',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false
  },
  {
    id: '2',
    type: 'bot',
    title: 'Bot Training Complete',
    description: 'Customer Support Bot has finished training',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: false
  },
  {
    id: '3',
    type: 'system',
    title: 'System Update',
    description: 'New features have been deployed',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true
  },
  {
    id: '4',
    type: 'warning',
    title: 'Daily Limit Warning',
    description: 'You have used 80% of your daily message limit',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: false
  }
]

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'message':
      return MessageSquare
    case 'bot':
      return Bot
    case 'warning':
      return AlertCircle
    default:
      return Bell
  }
}

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'message':
      return 'text-blue-500'
    case 'bot':
      return 'text-emerald-500'
    case 'warning':
      return 'text-yellow-500'
    default:
      return 'text-gray-500'
  }
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }
  
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-800"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 shadow-lg"
        sideOffset={5}
      >
        <div className="flex items-center justify-between p-4 border-b border-emerald-200 dark:border-emerald-700">
          <DropdownMenuLabel className="text-emerald-900 dark:text-emerald-100 font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-emerald-600 hover:text-emerald-700 text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
              <p className="text-emerald-600 dark:text-emerald-400">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              const iconColor = getNotificationColor(notification.type)
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-emerald-100 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-800/50 transition-colors ${
                    !notification.read ? 'bg-emerald-50/50 dark:bg-emerald-800/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-emerald-100 dark:bg-emerald-800 ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-emerald-900 dark:text-emerald-100 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeNotification(notification.id)}
                            className="w-6 h-6 text-emerald-400 hover:text-emerald-600"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        {notification.description}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-emerald-500 dark:text-emerald-400">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                        
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 h-6 px-2"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-4 border-t border-emerald-200 dark:border-emerald-700">
            <Button
              variant="ghost"
              className="w-full text-emerald-600 hover:text-emerald-700 text-sm"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 