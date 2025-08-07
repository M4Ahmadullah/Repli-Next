'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Save, Trash2 } from 'lucide-react'

// Define bot settings interface
interface BotSettings {
  personality: 'professional' | 'friendly' | 'casual' | 'custom'
  customPersonality?: string
  autoRespond: boolean
  businessHours: {
    enabled: boolean
    timezone: string
    schedule: {
      [key: string]: { start: string; end: string; enabled: boolean }
    }
  }
  fallbackMessage: string
}

// Predefined timezones
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'UTC'
]

export function BotSettingsPanel({ userId, botId, onDeleteSuccess }: { userId: string; botId?: string; onDeleteSuccess?: () => void }) {
  const [settings, setSettings] = useState<BotSettings>({
    personality: 'professional',
    autoRespond: true,
    businessHours: {
      enabled: true,
      timezone: 'America/New_York',
      schedule: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '17:00', enabled: true },
        saturday: { start: '09:00', end: '12:00', enabled: false },
        sunday: { start: '09:00', end: '12:00', enabled: false }
      }
    },
    fallbackMessage: 'Thank you for your message. We will get back to you as soon as possible.',
    customPersonality: ''
  })
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/bot/settings/${userId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch bot settings')
        }
        
        const data = await response.json()
        setSettings(data)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [userId])

  const updateSettings = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/bot/settings/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to update bot settings')
      }

      toast.success('Bot settings updated successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  const updateBusinessHours = (day: string, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        schedule: {
          ...prev.businessHours.schedule,
          [day]: {
            ...prev.businessHours.schedule[day],
            [field]: value
          }
        }
      }
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bot Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          Loading settings...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bot Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personality Settings */}
        <div className="space-y-4">
          <Label>Bot Personality</Label>
          <Select 
            value={settings.personality}
            onValueChange={(value: BotSettings['personality']) => 
              setSettings(prev => ({ ...prev, personality: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select personality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {settings.personality === 'custom' && (
            <Textarea
              placeholder="Define your custom bot personality..."
              value={settings.customPersonality}
              onChange={(e) => 
                setSettings(prev => ({ 
                  ...prev, 
                  customPersonality: e.target.value 
                }))
              }
            />
          )}
        </div>

        {/* Auto Respond Settings */}
        <div className="flex items-center space-x-4">
          <Switch
            checked={settings.autoRespond}
            onCheckedChange={(checked: boolean) => 
              setSettings(prev => ({ ...prev, autoRespond: checked }))
            }
          />
          <Label>Enable Auto-Respond</Label>
        </div>

        {/* Fallback Message */}
        <div className="space-y-2">
          <Label>Fallback Message</Label>
          <Textarea
            placeholder="Enter a default message for when the bot can't handle a request..."
            value={settings.fallbackMessage}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                fallbackMessage: e.target.value 
              }))
            }
          />
        </div>

        {/* Business Hours */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Switch
              checked={settings.businessHours.enabled}
              onCheckedChange={(checked: boolean) => 
                setSettings(prev => ({ 
                  ...prev, 
                  businessHours: { 
                    ...prev.businessHours, 
                    enabled: checked 
                  } 
                }))
              }
            />
            <Label>Enable Business Hours</Label>
          </div>

          {settings.businessHours.enabled && (
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={settings.businessHours.timezone}
                onValueChange={(value) => 
                  setSettings(prev => ({ 
                    ...prev, 
                    businessHours: { 
                      ...prev.businessHours, 
                      timezone: value 
                    } 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Business Hours Schedule */}
              <div className="space-y-2 mt-4">
                {Object.entries(settings.businessHours.schedule).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-2">
                    <div className="w-24 capitalize">{day}</div>
                    <Switch
                      checked={hours.enabled}
                      onCheckedChange={(checked: boolean) => 
                        updateBusinessHours(day, 'enabled', checked)
                      }
                    />
                    {hours.enabled && (
                      <div className="flex space-x-2">
                        <Input
                          type="time"
                          value={hours.start}
                          onChange={(e) => 
                            updateBusinessHours(day, 'start', e.target.value)
                          }
                        />
                        <Input
                          type="time"
                          value={hours.end}
                          onChange={(e) => 
                            updateBusinessHours(day, 'end', e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          {botId && (
            <Button 
              variant="destructive"
              onClick={async () => {
                try {
                  const response = await fetch(`/api/bots/${botId}`, {
                    method: 'DELETE',
                  });
                  
                  const result = await response.json();
                  
                  if (result.success) {
                    toast.success('Bot deleted successfully!', {
                      description: 'The bot has been permanently removed from your account.',
                      duration: 4000,
                      style: {
                        background: '#10b981',
                        color: 'white',
                        border: '1px solid #059669',
                      },
                    });
                    onDeleteSuccess?.();
                  } else {
                    throw new Error(result.error || 'Failed to delete bot');
                  }
                } catch (error) {
                  console.error('Delete bot error:', error);
                  toast.error('Failed to delete bot', {
                    description: error instanceof Error ? error.message : 'An unexpected error occurred',
                    duration: 5000,
                  });
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Bot
            </Button>
          )}
          
          <Button 
            onClick={updateSettings} 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 