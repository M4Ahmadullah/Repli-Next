'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Globe, 
  AlertCircle, 
  Sparkles,
  Save,
  CheckCircle
} from 'lucide-react'

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy: {
    dataSharing: boolean
    analytics: boolean
  }
  preferences: {
    language: string
    timezone: string
    theme: 'light' | 'dark' | 'auto'
  }
  subscription: {
    plan: string
    status: string
    nextBilling: string
  }
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      dataSharing: false,
      analytics: true
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      theme: 'auto'
    },
    subscription: {
      plan: 'free',
      status: 'active',
      nextBilling: ''
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      if (!user?.id) {
        setError('User ID not available')
        setLoading(false)
        return
      }

      // Fetch user settings
      const response = await fetch(`/api/users/${user.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      if (data.success) {
        setSettings({
          notifications: data.settings?.notifications || {
            email: true,
            push: true,
            sms: false
          },
          privacy: data.settings?.privacy || {
            dataSharing: false,
            analytics: true
          },
          preferences: data.settings?.preferences || {
            language: 'en',
            timezone: 'UTC',
            theme: 'auto'
          },
          subscription: data.subscription || {
            plan: 'free',
            status: 'active',
            nextBilling: ''
          }
        })
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to fetch settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoaded && user) {
      fetchSettings()
    }
  }, [isLoaded, user, fetchSettings])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
              <CardDescription>
                You need to be signed in to view this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => window.location.href = '/sign-in'} className="btn-primary">
                <Sparkles className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Error Loading Settings</CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => fetchSettings()} className="btn-primary">
                <Sparkles className="w-5 h-5 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
            Settings
          </h1>
          <p className="text-emerald-600 dark:text-emerald-400">
            Configure your bot settings and preferences
          </p>
        </div>
          <Button 
            onClick={handleSaveSettings} 
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications */}
          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-emerald-900 dark:text-emerald-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                Notifications
              </CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400">
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="text-emerald-900 dark:text-emerald-100">
                  Email Notifications
                </Label>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications" className="text-emerald-900 dark:text-emerald-100">
                  Push Notifications
                </Label>
                <Switch
                  id="push-notifications"
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, push: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-notifications" className="text-emerald-900 dark:text-emerald-100">
                  SMS Notifications
                </Label>
                <Switch
                  id="sms-notifications"
                  checked={settings.notifications.sms}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, sms: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-emerald-900 dark:text-emerald-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                Privacy & Security
              </CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400">
                Control your data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="data-sharing" className="text-emerald-900 dark:text-emerald-100">
                  Data Sharing
                </Label>
                <Switch
                  id="data-sharing"
                  checked={settings.privacy.dataSharing}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, dataSharing: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="analytics" className="text-emerald-900 dark:text-emerald-100">
                  Analytics Collection
                </Label>
                <Switch
                  id="analytics"
                  checked={settings.privacy.analytics}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, analytics: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-emerald-900 dark:text-emerald-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                Preferences
              </CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400">
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language" className="text-emerald-900 dark:text-emerald-100">
                  Language
                </Label>
                <Select
                  value={settings.preferences.language}
                  onValueChange={(value) => 
                    setSettings(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, language: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-emerald-900 dark:text-emerald-100">
                  Timezone
                </Label>
                <Select
                  value={settings.preferences.timezone}
                  onValueChange={(value) => 
                    setSettings(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, timezone: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">Eastern Time</SelectItem>
                    <SelectItem value="PST">Pacific Time</SelectItem>
                    <SelectItem value="GMT">GMT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-emerald-900 dark:text-emerald-100">
                  Theme
                </Label>
                <Select
                  value={settings.preferences.theme}
                  onValueChange={(value: 'light' | 'dark' | 'auto') => 
                    setSettings(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, theme: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-emerald-900 dark:text-emerald-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                Subscription
              </CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400">
                Your current plan and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-emerald-600 dark:text-emerald-400">Plan:</span>
                <Badge className="bg-emerald-500 text-white">
                  {settings.subscription.plan ? settings.subscription.plan.charAt(0).toUpperCase() + settings.subscription.plan.slice(1) : 'Unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-600 dark:text-emerald-400">Status:</span>
                <Badge className={settings.subscription.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}>
                  {settings.subscription.status ? settings.subscription.status.charAt(0).toUpperCase() + settings.subscription.status.slice(1) : 'Unknown'}
                </Badge>
              </div>
              {settings.subscription.nextBilling && (
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400">Next Billing:</span>
                  <span className="text-emerald-900 dark:text-emerald-100">
                    {new Date(settings.subscription.nextBilling).toLocaleDateString()}
                  </span>
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => window.location.href = '/dashboard/billing'}
              >
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 