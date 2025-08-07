'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Crown, 
  AlertCircle, 
  Sparkles,
  Mail,
  Phone,
  Settings
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'invited' | 'inactive'
  avatar?: string
  joinedAt: string
  lastActive: string
}

export default function TeamPage() {
  const { user, isLoaded } = useUser()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeamMembers = useCallback(async () => {
    try {
      if (!user?.id) {
        setError('User ID not available')
        setLoading(false)
        return
      }

      // Fetch team members for the user
      const response = await fetch(`/api/users/${user.id}/team`)
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }

      const data = await response.json()
      if (data.success) {
        setTeamMembers(data.teamMembers || [])
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to fetch team members')
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch team members')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoaded && user) {
      fetchTeamMembers()
    }
  }, [isLoaded, user, fetchTeamMembers])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-yellow-500 text-white">Owner</Badge>
      case 'admin':
        return <Badge className="bg-blue-500 text-white">Admin</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">Member</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500 text-white">Active</Badge>
      case 'invited':
        return <Badge className="bg-orange-500 text-white">Invited</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">Inactive</Badge>
    }
  }

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading team...</p>
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
              <CardTitle className="text-2xl">Error Loading Team</CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => fetchTeamMembers()} className="btn-primary">
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
            Team Management
          </h1>
          <p className="text-emerald-600 dark:text-emerald-400">
            Manage team members and permissions
          </p>
        </div>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <UserPlus className="w-5 h-5 mr-2" />
            Invite Member
          </Button>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Total Members</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{teamMembers.length}</p>
                </div>
                <Users className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Active Members</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {teamMembers.filter(member => member.status === 'active').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Pending Invites</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {teamMembers.filter(member => member.status === 'invited').length}
                  </p>
                </div>
                <Mail className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
          <CardHeader>
            <CardTitle className="text-emerald-900 dark:text-emerald-100">Team Members</CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-400">
              Manage your team members and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers.length > 0 ? (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-emerald-500 text-white">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-emerald-900 dark:text-emerald-100">{member.name}</h3>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">{member.email}</p>
                        <p className="text-xs text-emerald-500 dark:text-emerald-400">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getRoleBadge(member.role)}
                      {getStatusBadge(member.status)}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No Team Members Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-4">
                  Invite team members to collaborate on your bots
                </p>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Invite First Member
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions Overview */}
        <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
          <CardHeader>
            <CardTitle className="text-emerald-900 dark:text-emerald-100">Role Permissions</CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-400">
              Overview of what each role can do
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Owner</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Full access to all features, billing, and team management
                </p>
              </div>
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Admin</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Manage bots, conversations, and team members
                </p>
              </div>
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Member</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  View and respond to conversations, limited bot management
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 