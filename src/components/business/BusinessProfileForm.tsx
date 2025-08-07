'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Define types for business profile
interface BusinessProfile {
  id?: string;
  name: string;
  description?: string;
  industry: string;
  botPersonality: string;
  businessHours?: {
    monday?: {
      open: string;
      close: string;
      enabled: boolean;
    }
  }
}

const INDUSTRIES = [
  'technology', 'retail', 'healthcare', 'finance', 
  'hospitality', 'education', 'professional_services', 
  'e_commerce', 'other'
];

const BOT_PERSONALITIES = [
  'professional', 'friendly', 'casual', 'technical', 'empathetic'
];

export const BusinessProfileForm = () => {
  const { user } = useUser();
  const [profile, setProfile] = useState<BusinessProfile>({
    name: '',
    description: '',
    industry: 'other',
    botPersonality: 'professional'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [existingProfiles, setExistingProfiles] = useState<BusinessProfile[]>([]);

  // Fetch existing profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/business-profiles');
        const data = await response.json();
        
        if (data.success) {
          setExistingProfiles(data.profiles);
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
        toast.error('Failed to load existing profiles');
      }
    };

    fetchProfiles();
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to create a business profile');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/business-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Business profile created successfully');
        // Reset form and refresh profiles
        setProfile({
          name: '',
          description: '',
          industry: 'other',
          botPersonality: 'professional'
        });
        
        // Refetch profiles
        const profilesResponse = await fetch('/api/business-profiles');
        const profilesData = await profilesResponse.json();
        
        if (profilesData.success) {
          setExistingProfiles(profilesData.profiles);
        }
      } else {
        toast.error(data.error || 'Failed to create business profile');
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      toast.error('An error occurred while creating the profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Business Name</Label>
          <Input 
            value={profile.name}
            onChange={(e) => setProfile({...profile, name: e.target.value})}
            placeholder="Enter your business name"
            required
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea 
            value={profile.description || ''}
            onChange={(e) => setProfile({...profile, description: e.target.value})}
            placeholder="Brief description of your business"
          />
        </div>

        <div>
          <Label>Industry</Label>
          <Select 
            value={profile.industry}
            onValueChange={(value) => setProfile({...profile, industry: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Bot Personality</Label>
          <Select 
            value={profile.botPersonality}
            onValueChange={(value) => setProfile({...profile, botPersonality: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select bot personality" />
            </SelectTrigger>
            <SelectContent>
              {BOT_PERSONALITIES.map((personality) => (
                <SelectItem key={personality} value={personality}>
                  {personality}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Business Profile'}
        </Button>
      </form>

      {existingProfiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Existing Profiles</h3>
          <div className="space-y-2">
            {existingProfiles.map((existingProfile) => (
              <div 
                key={existingProfile.id} 
                className="border p-4 rounded-lg"
              >
                <h4 className="font-medium">{existingProfile.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Industry: {existingProfile.industry}
                </p>
                <p className="text-sm text-muted-foreground">
                  Personality: {existingProfile.botPersonality}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 