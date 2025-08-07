'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Building2, 
  Clock, 
  Globe, 
  Users, 
  Settings, 
  CheckCircle,
  AlertCircle,
  MessageSquare
} from 'lucide-react'
import { BotApiClient } from '@/lib/api/bot-client'
import { useUser } from '@clerk/nextjs'

interface BusinessHours {
  monday: { enabled: boolean; open: string; close: string }
  tuesday: { enabled: boolean; open: string; close: string }
  wednesday: { enabled: boolean; open: string; close: string }
  thursday: { enabled: boolean; open: string; close: string }
  friday: { enabled: boolean; open: string; close: string }
  saturday: { enabled: boolean; open: string; close: string }
  sunday: { enabled: boolean; open: string; close: string }
}

interface BusinessProfile {
  name: string
  description: string
  industry: string
  website: string
  phone: string
  email: string
  address: string
  timezone: string
  businessHours: BusinessHours
  botPersonality: string
  autoRespond: boolean
  fallbackMessage: string
}

const INDUSTRIES = [
  'technology',
  'retail',
  'healthcare',
  'finance',
  'hospitality',
  'education',
  'professional_services',
  'e_commerce',
  'other'
]

const PERSONALITIES = [
  'professional',
  'friendly',
  'casual',
  'technical',
  'empathetic'
]

export const BusinessProfileSetup: React.FC = () => {
  const { user } = useUser()
  const [profile, setProfile] = useState<BusinessProfile>({
    name: '',
    description: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    timezone: 'UTC',
    businessHours: {
      monday: { enabled: true, open: '09:00', close: '17:00' },
      tuesday: { enabled: true, open: '09:00', close: '17:00' },
      wednesday: { enabled: true, open: '09:00', close: '17:00' },
      thursday: { enabled: true, open: '09:00', close: '17:00' },
      friday: { enabled: true, open: '09:00', close: '17:00' },
      saturday: { enabled: false, open: '10:00', close: '14:00' },
      sunday: { enabled: false, open: '10:00', close: '14:00' }
    },
    botPersonality: 'professional',
    autoRespond: true,
    fallbackMessage: 'Thank you for your message. We\'ll get back to you soon!'
  })

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const botApiClient = new BotApiClient(user.id)
      const response = await botApiClient.createBusinessProfile(user.id, profile)

      if (response.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(response.error || 'Failed to save business profile')
      }
    } catch (err) {
      setError('Failed to save business profile')
      console.error('Business profile save error:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateBusinessHours = (day: keyof BusinessHours, field: keyof BusinessHours[keyof BusinessHours], value: any) => {
    setProfile(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }))
  }

  const getCompletionPercentage = () => {
    const requiredFields = ['name', 'industry', 'botPersonality']
    const completedFields = requiredFields.filter(field => profile[field as keyof BusinessProfile])
    return Math.round((completedFields.length / requiredFields.length) * 100)
  }

  const completionPercentage = getCompletionPercentage()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business Profile Setup</h2>
          <p className="text-muted-foreground">
            Configure your business information and bot personality
          </p>
        </div>
        <Badge variant={completionPercentage === 100 ? 'default' : 'secondary'}>
          {completionPercentage}% Complete
        </Badge>
      </div>

      <Progress value={completionPercentage} className="w-full" />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Tell us about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={profile.description}
                onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your business"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select value={profile.industry} onValueChange={(value) => setProfile(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry ? industry.charAt(0).toUpperCase() + industry.slice(1).replace('_', ' ') : 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={profile.website}
                onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              How customers can reach you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contact@yourbusiness.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter your business address"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bot Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Bot Configuration
            </CardTitle>
            <CardDescription>
              Customize your bot's personality and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personality">Bot Personality *</Label>
              <Select value={profile.botPersonality} onValueChange={(value) => setProfile(prev => ({ ...prev, botPersonality: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select personality" />
                </SelectTrigger>
                <SelectContent>
                  {PERSONALITIES.map((personality) => (
                    <SelectItem key={personality} value={personality}>
                      {personality ? personality.charAt(0).toUpperCase() + personality.slice(1) : 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-responder</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically respond to messages outside business hours
                </p>
              </div>
              <Switch
                checked={profile.autoRespond}
                onCheckedChange={(checked) => setProfile(prev => ({ ...prev, autoRespond: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback">Fallback Message</Label>
              <Textarea
                id="fallback"
                value={profile.fallbackMessage}
                onChange={(e) => setProfile(prev => ({ ...prev, fallbackMessage: e.target.value }))}
                placeholder="Message to send when auto-responder is enabled"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Business Hours
            </CardTitle>
            <CardDescription>
              Set your operating hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(profile.businessHours).map(([day, hours]) => (
              <div key={day} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={hours.enabled}
                    onCheckedChange={(checked) => updateBusinessHours(day as keyof BusinessHours, 'enabled', checked)}
                  />
                  <Label className="capitalize">{day}</Label>
                </div>
                {hours.enabled && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateBusinessHours(day as keyof BusinessHours, 'open', e.target.value)}
                      className="w-24"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateBusinessHours(day as keyof BusinessHours, 'close', e.target.value)}
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {saved && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Business profile saved successfully!</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading || completionPercentage < 100}>
          {loading ? 'Saving...' : 'Save Business Profile'}
        </Button>
      </div>
    </div>
  )
} 