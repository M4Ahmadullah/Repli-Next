import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building, Clock, Globe, MapPin } from 'lucide-react'

const businessProfileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessDescription: z.string().min(10, 'Description must be at least 10 characters'),
  industry: z.string().min(1, 'Please select an industry'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  businessHours: z.object({
    enabled: z.boolean(),
    timezone: z.string(),
    monday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    tuesday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    wednesday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    thursday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    friday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    saturday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    sunday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() })
  })
})

type BusinessProfileData = z.infer<typeof businessProfileSchema>

interface BusinessProfileSetupProps {
  onComplete: (data: BusinessProfileData) => void
  onSkip?: () => void
}

const industries = [
  'E-commerce & Retail',
  'Healthcare & Medical',
  'Real Estate',
  'Financial Services',
  'Education & Training',
  'Food & Beverage',
  'Technology & Software',
  'Professional Services',
  'Travel & Hospitality',
  'Automotive',
  'Beauty & Wellness',
  'Other'
]

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
]

export function BusinessProfileSetup({ onComplete, onSkip }: BusinessProfileSetupProps) {
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BusinessProfileData>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      businessName: '',
      businessDescription: '',
      industry: '',
      website: '',
      location: '',
      businessHours: {
        enabled: true,
        timezone: 'America/New_York',
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '09:00', end: '17:00' },
        sunday: { enabled: false, start: '09:00', end: '17:00' }
      }
    }
  })

  const handleSubmit = async (data: BusinessProfileData) => {
    setIsSubmitting(true)
    try {
      // Update user settings with business profile
      await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            businessName: data.businessName,
            businessDescription: data.businessDescription,
            businessIndustry: data.industry,
            businessWebsite: data.website,
            businessHours: data.businessHours
          }
        })
      })

      // Sync with bot system
      await fetch('/api/bot/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfile: {
            name: data.businessName,
            description: data.businessDescription,
            industry: data.industry,
            website: data.website
          }
        })
      })

      onComplete(data)
    } catch (error) {
      console.error('Failed to save business profile:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="elegant-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
            <Building className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl gradient-text-vibrant">Set Up Your Business Profile</CardTitle>
          <CardDescription className="text-lg text-green-600 dark:text-green-300">
            Help your AI understand your business to provide better customer service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-100 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Business Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {industries.map((industry) => (
                              <SelectItem key={industry} value={industry}>
                                {industry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="businessDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what your business does, your products/services, and what makes you unique..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        This helps your AI understand your business context and provide relevant responses
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourwebsite.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Business Hours */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-100 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Business Hours
                </h3>
                
                <FormField
                  control={form.control}
                  name="businessHours.timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                    Your AI will automatically handle after-hours messages and let customers know when you&apos;ll be back.
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    You can customize these settings later in your dashboard.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                {onSkip && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onSkip}
                    className="order-2 sm:order-1"
                  >
                    Skip for Now
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary order-1 sm:order-2"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Continue'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 