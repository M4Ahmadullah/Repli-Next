'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  Sparkles,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download
} from 'lucide-react'

interface BillingData {
  subscription: {
    plan: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    nextBillingDate: string
    amount: number
    currency: string
  }
  usage: {
    messagesUsed: number
    messagesLimit: number
    botsUsed: number
    botsLimit: number
  }
  invoices: Array<{
    id: string
    date: string
    amount: number
    status: 'paid' | 'pending' | 'failed'
    description: string
  }>
}

export default function BillingPage() {
  const { user, isLoaded } = useUser()
  const [billingData, setBillingData] = useState<BillingData>({
    subscription: {
      plan: 'free',
      status: 'active',
      currentPeriodStart: '',
      currentPeriodEnd: '',
      nextBillingDate: '',
      amount: 0,
      currency: 'USD'
    },
    usage: {
      messagesUsed: 0,
      messagesLimit: 10,
      botsUsed: 0,
      botsLimit: 1
    },
    invoices: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBillingData = useCallback(async () => {
    try {
      if (!user?.id) {
        setError('User ID not available')
        setLoading(false)
        return
      }

      // Fetch billing data for the user
      const [subscriptionResponse, usageResponse, invoicesResponse] = await Promise.allSettled([
        fetch(`/api/subscriptions/${user.id}`),
        fetch(`/api/usage/${user.id}`),
        fetch(`/api/users/${user.id}/invoices`)
      ])

      let subscription = {
        plan: 'free',
        status: 'active',
        currentPeriodStart: '',
        currentPeriodEnd: '',
        nextBillingDate: '',
        amount: 0,
        currency: 'USD'
      }
      let usage = {
        messagesUsed: 0,
        messagesLimit: 10,
        botsUsed: 0,
        botsLimit: 1
      }
      let invoices: Array<{
        id: string
        date: string
        amount: number
        status: 'paid' | 'pending' | 'failed'
        description: string
      }> = []

      // Handle subscription response
      if (subscriptionResponse.status === 'fulfilled' && subscriptionResponse.value.ok) {
        const data = await subscriptionResponse.value.json()
        if (data.success) {
          subscription = data.subscription || subscription
        }
      }

      // Handle usage response
      if (usageResponse.status === 'fulfilled' && usageResponse.value.ok) {
        const data = await usageResponse.value.json()
        if (data.success) {
          usage = data.usage || usage
        }
      }

      // Handle invoices response
      if (invoicesResponse.status === 'fulfilled' && invoicesResponse.value.ok) {
        const data = await invoicesResponse.value.json()
        if (data.success) {
          invoices = data.invoices || invoices
        }
      }

      setBillingData({
        subscription,
        usage,
        invoices
      })
      setError(null)
    } catch (error) {
      console.error('Error fetching billing data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch billing data')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoaded && user) {
      fetchBillingData()
    }
  }, [isLoaded, user, fetchBillingData])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500 text-white">Active</Badge>
      case 'past_due':
        return <Badge className="bg-orange-500 text-white">Past Due</Badge>
      case 'canceled':
        return <Badge className="bg-red-500 text-white">Canceled</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>
    }
  }

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-500 text-white">Paid</Badge>
      case 'pending':
        return <Badge className="bg-orange-500 text-white">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-500 text-white">Failed</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>
    }
  }

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading billing information...</p>
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
              <CardTitle className="text-2xl">Error Loading Billing</CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => fetchBillingData()} className="btn-primary">
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
            Billing & Subscription
          </h1>
          <p className="text-emerald-600 dark:text-emerald-400">
            Manage your subscription and billing information
          </p>
        </div>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <CreditCard className="w-5 h-5 mr-2" />
            Upgrade Plan
          </Button>
        </div>

        {/* Current Plan */}
        <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-emerald-900 dark:text-emerald-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              Current Plan
            </CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-400">
              Your current subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                  {billingData.subscription.plan ? billingData.subscription.plan.charAt(0).toUpperCase() + billingData.subscription.plan.slice(1) : 'Unknown'}
                </h3>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm">Plan</p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                  {billingData.subscription.amount > 0 ? `$${billingData.subscription.amount}` : 'Free'}
                </h3>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm">Monthly</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  {getStatusBadge(billingData.subscription.status)}
                </div>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm">Status</p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                  {billingData.subscription.nextBillingDate ? 
                    new Date(billingData.subscription.nextBillingDate).toLocaleDateString() : 
                    'N/A'
                  }
                </h3>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm">Next Billing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg text-emerald-900 dark:text-emerald-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                Message Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400">Used:</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                    {billingData.usage.messagesUsed.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400">Limit:</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                    {billingData.usage.messagesLimit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-emerald-100 dark:bg-emerald-800 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min((billingData.usage.messagesUsed / billingData.usage.messagesLimit) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-center">
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">
                    {Math.round((billingData.usage.messagesUsed / billingData.usage.messagesLimit) * 100)}% used
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg text-emerald-900 dark:text-emerald-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                Bot Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400">Used:</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                    {billingData.usage.botsUsed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400">Limit:</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                    {billingData.usage.botsLimit}
                  </span>
                </div>
                <div className="w-full bg-emerald-100 dark:bg-emerald-800 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min((billingData.usage.botsUsed / billingData.usage.botsLimit) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-center">
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">
                    {Math.round((billingData.usage.botsUsed / billingData.usage.botsLimit) * 100)}% used
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices */}
        <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
          <CardHeader>
            <CardTitle className="text-emerald-900 dark:text-emerald-100">Billing History</CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-400">
              Your recent invoices and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {billingData.invoices.length > 0 ? (
              <div className="space-y-4">
                {billingData.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Download className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-emerald-900 dark:text-emerald-100">{invoice.description}</h3>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                        ${invoice.amount}
                      </span>
                      {getInvoiceStatusBadge(invoice.status)}
                      <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No Invoices Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Your billing history will appear here once you have active subscriptions
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Comparison */}
        <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
          <CardHeader>
            <CardTitle className="text-emerald-900 dark:text-emerald-100">Available Plans</CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-400">
              Choose the plan that fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Free</h3>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-4">$0/month</p>
                <ul className="text-sm text-emerald-600 dark:text-emerald-400 space-y-2 mb-4">
                  <li>✓ 1 Bot</li>
                  <li>✓ 10 messages/day</li>
                  <li>✓ Basic support</li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full border-emerald-200 text-emerald-700"
                  disabled={billingData.subscription.plan === 'free'}
                >
                  {billingData.subscription.plan === 'free' ? 'Current Plan' : 'Select Plan'}
                </Button>
              </div>
              <div className="text-center p-6 bg-emerald-100 dark:bg-emerald-700 rounded-lg border-2 border-emerald-500">
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Pro</h3>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-4">$29/month</p>
                <ul className="text-sm text-emerald-600 dark:text-emerald-400 space-y-2 mb-4">
                  <li>✓ 5 Bots</li>
                  <li>✓ 1000 messages/day</li>
                  <li>✓ Priority support</li>
                  <li>✓ Advanced analytics</li>
                </ul>
                <Button 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={billingData.subscription.plan === 'pro'}
                >
                  {billingData.subscription.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                </Button>
              </div>
              <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Enterprise</h3>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-4">$99/month</p>
                <ul className="text-sm text-emerald-600 dark:text-emerald-400 space-y-2 mb-4">
                  <li>✓ Unlimited Bots</li>
                  <li>✓ Unlimited messages</li>
                  <li>✓ 24/7 support</li>
                  <li>✓ Custom integrations</li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full border-emerald-200 text-emerald-700"
                  disabled={billingData.subscription.plan === 'enterprise'}
                >
                  {billingData.subscription.plan === 'enterprise' ? 'Current Plan' : 'Contact Sales'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 