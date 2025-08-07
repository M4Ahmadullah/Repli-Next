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
  User, 
  Building2, 
  Settings, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  MessageSquare
} from 'lucide-react'
import { BotApiClient } from '@/lib/api/bot-client'
import { useUser } from '@clerk/nextjs'

interface BusinessProfile {
  id: string
  name: string
  description: string
  industry: string
  website: string
  phone: string
  email: string
  address: string
  timezone: string
  botPersonality: string
  autoRespond: boolean
  fallbackMessage: string
  createdAt: string
  updatedAt: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  businessName: string
  businessType: string
  location: string
  preferences: {
    communicationStyle: string
    timezone: string
    preferredLanguage: string
  }
  createdAt: string
  updatedAt: string
}

export const ProfileManagement: React.FC = () => {
  const { user } = useUser()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const botApiClient = new BotApiClient(user.id)
        
        // Fetch user profile
        const userResponse = await botApiClient.getUserProfile(user.id)
        if (userResponse.success) {
          setUserProfile(userResponse.data)
        }

        // Note: getBusinessProfiles method doesn't exist, so we'll skip this for now
        // const businessResponse = await botApiClient.getBusinessProfiles(user.id)
        // if (businessResponse.success) {
        //   setBusinessProfiles(businessResponse.data || [])
        // }
      } catch (err) {
        setError('Failed to fetch profiles')
        console.error('Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [user?.id])

  const handleUserProfileUpdate = async (updates: Partial<UserProfile>) => {
    if (!user?.id || !userProfile) return

    try {
      setSaving(true)
      setError(null)

      const botApiClient = new BotApiClient(user.id)
      const response = await botApiClient.updateUserProfile(user.id, updates)

      if (response.success) {
        setUserProfile(response.data)
        setSuccess('User profile updated successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.error || 'Failed to update user profile')
      }
    } catch (err) {
      setError('Failed to update user profile')
      console.error('User profile update error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleBusinessProfileUpdate = async (profileId: string, updates: Partial<BusinessProfile>) => {
    if (!user?.id) return

    try {
      setSaving(true)
      setError(null)

      const botApiClient = new BotApiClient(user.id)
      const response = await botApiClient.updateBusinessProfile(user.id, profileId, updates)

      if (response.success) {
        setBusinessProfiles(prev => 
          prev.map(profile => 
            profile.id === profileId ? { ...profile, ...updates } : profile
          )
        )
        setSuccess('Business profile updated successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.error || 'Failed to update business profile')
      }
    } catch (err) {
      setError('Failed to update business profile')
      console.error('Business profile update error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading profiles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Profile Management</h2>
          <p className="text-muted-foreground">
            Manage your personal and business profiles
          </p>
        </div>
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

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Profile
            </CardTitle>
            <CardDescription>
              Your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userProfile ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={userProfile.name}
                    onChange={(e) => handleUserProfileUpdate({ name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => handleUserProfileUpdate({ email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={userProfile.businessName}
                    onChange={(e) => handleUserProfileUpdate({ businessName: e.target.value })}
                    placeholder="Enter your business name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={userProfile.location}
                    onChange={(e) => handleUserProfileUpdate({ location: e.target.value })}
                    placeholder="Enter your location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="communicationStyle">Communication Style</Label>
                  <Select 
                    value={userProfile.preferences.communicationStyle} 
                    onValueChange={(value) => handleUserProfileUpdate({ 
                      preferences: { ...userProfile.preferences, communicationStyle: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select communication style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No user profile found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Profiles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Profiles
            </CardTitle>
            <CardDescription>
              Manage your business information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessProfiles.length > 0 ? (
              businessProfiles.map((profile) => (
                <div key={profile.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{profile.name}</h4>
                    <Badge variant="secondary">{profile.industry}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`name-${profile.id}`}>Business Name</Label>
                    <Input
                      id={`name-${profile.id}`}
                      value={profile.name}
                      onChange={(e) => handleBusinessProfileUpdate(profile.id, { name: e.target.value })}
                      placeholder="Enter business name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`description-${profile.id}`}>Description</Label>
                    <Textarea
                      id={`description-${profile.id}`}
                      value={profile.description}
                      onChange={(e) => handleBusinessProfileUpdate(profile.id, { description: e.target.value })}
                      placeholder="Enter business description"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`personality-${profile.id}`}>Bot Personality</Label>
                    <Select 
                      value={profile.botPersonality} 
                      onValueChange={(value) => handleBusinessProfileUpdate(profile.id, { botPersonality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select personality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="empathetic">Empathetic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-responder</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically respond outside business hours
                      </p>
                    </div>
                    <Switch
                      checked={profile.autoRespond}
                      onCheckedChange={(checked) => handleBusinessProfileUpdate(profile.id, { autoRespond: checked })}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No business profiles found</p>
                <Button variant="outline" className="mt-2">
                  Create Business Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 