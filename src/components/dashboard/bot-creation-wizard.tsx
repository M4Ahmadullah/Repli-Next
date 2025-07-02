'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  Bot, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  QrCode,
  Sparkles,
  X,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreateBotData, TrainingWizardData, Bot as BotType } from '@/lib/types/user'
import Image from 'next/image'

interface BotCreationWizardProps {
  isOpen: boolean
  onClose: () => void
  onBotCreated: (bot: BotType) => void
}

interface WizardStep {
  id: number
  title: string
  description: string
  completed: boolean
}

export function BotCreationWizard({ isOpen, onClose, onBotCreated }: BotCreationWizardProps) {
  useUser() // For potential future use
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [createdBot, setCreatedBot] = useState<BotType | null>(null)

  // Form Data
  const [basicInfo, setBasicInfo] = useState<CreateBotData>({
    name: '',
    description: '',
    personality: 'professional'
  })

  const [trainingData, setTrainingData] = useState<TrainingWizardData>({
    businessInfo: {
      name: '',
      description: '',
      industry: '',
      website: ''
    },
    qnaPairs: [{ question: '', answer: '' }],
    documents: [],
    personality: 'professional',
    autoRespond: true,
    fallbackMessage: "I'm sorry, I don't have information about that. Please contact our support team for assistance."
  })

  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'connected' | 'failed'>('waiting')

  const steps: WizardStep[] = [
    { id: 1, title: 'Basic Info', description: 'Bot name and description', completed: false },
    { id: 2, title: 'WhatsApp Connect', description: 'QR code connection', completed: false },
    { id: 3, title: 'Business Info', description: 'Your business details', completed: false },
    { id: 4, title: 'Q&A Training', description: 'Train with questions & answers', completed: false },
    { id: 5, title: 'Review & Launch', description: 'Final review and activation', completed: false }
  ]

  const resetWizard = () => {
    setCurrentStep(1)
    setCreatedBot(null)
    setQrCode(null)
    setConnectionStatus('waiting')
    setBasicInfo({ name: '', description: '', personality: 'professional' })
    setTrainingData({
      businessInfo: { name: '', description: '', industry: '', website: '' },
      qnaPairs: [{ question: '', answer: '' }],
      documents: [],
      personality: 'professional',
      autoRespond: true,
      fallbackMessage: "I'm sorry, I don't have information about that. Please contact our support team for assistance."
    })
  }

  const handleClose = () => {
    resetWizard()
    onClose()
  }

  // Step 1: Create Bot
  const handleCreateBot = async () => {
    if (!basicInfo.name.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basicInfo)
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedBot(data.bot)
        setTrainingData(prev => ({
          ...prev,
          businessInfo: {
            ...prev.businessInfo,
            name: basicInfo.name,
            description: basicInfo.description || ''
          }
        }))
        setCurrentStep(2)
      }
    } catch (error) {
      console.error('Error creating bot:', error)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Generate QR Code
  const handleGenerateQR = async () => {
    if (!createdBot) return

    setLoading(true)
    try {
      const response = await fetch(`/api/bots/${createdBot.id}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-qr' })
      })

      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
        // Start checking connection status
        checkConnectionStatus()
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check WhatsApp connection status
  const checkConnectionStatus = async () => {
    if (!createdBot) return

    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/bots/${createdBot.id}/whatsapp`)
        if (response.ok) {
          const data = await response.json()
          if (data.connected) {
            setConnectionStatus('connected')
            clearInterval(checkInterval)
            setTimeout(() => setCurrentStep(3), 1500)
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error)
      }
    }, 3000)

    // Stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval)
      if (connectionStatus === 'waiting') {
        setConnectionStatus('failed')
      }
    }, 300000)
  }

  // Step 3-4: Training Data
  const addQnaPair = () => {
    setTrainingData(prev => ({
      ...prev,
      qnaPairs: [...prev.qnaPairs, { question: '', answer: '' }]
    }))
  }

  const removeQnaPair = (index: number) => {
    setTrainingData(prev => ({
      ...prev,
      qnaPairs: prev.qnaPairs.filter((_, i) => i !== index)
    }))
  }

  const updateQnaPair = (index: number, field: 'question' | 'answer', value: string) => {
    setTrainingData(prev => ({
      ...prev,
      qnaPairs: prev.qnaPairs.map((pair, i) => 
        i === index ? { ...pair, [field]: value } : pair
      )
    }))
  }

  // Step 5: Finalize Training
  const handleFinishTraining = async () => {
    if (!createdBot) return

    setLoading(true)
    try {
      const response = await fetch(`/api/bots/${createdBot.id}/training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainingData)
      })

      if (response.ok) {
        const data = await response.json()
        onBotCreated(data.bot)
        handleClose()
      }
    } catch (error) {
      console.error('Error finalizing training:', error)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return basicInfo.name.trim().length >= 2
      case 2: return connectionStatus === 'connected'
      case 3: return trainingData.businessInfo.name.trim() && trainingData.businessInfo.description.trim()
      case 4: return trainingData.qnaPairs.some(pair => pair.question.trim() && pair.answer.trim())
      case 5: return true
      default: return false
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl text-green-800 dark:text-green-100">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            Create New Bot
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep > step.id 
                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                  : currentStep === step.id
                  ? 'border-emerald-500 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-300 text-gray-400'
              }`}>
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card className="elegant-card">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-100">Bot Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="botName">Bot Name *</Label>
                  <Input
                    id="botName"
                    placeholder="e.g., Customer Support Bot"
                    value={basicInfo.name}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="botDescription">Description</Label>
                  <Textarea
                    id="botDescription"
                    placeholder="Brief description of what this bot will do..."
                    value={basicInfo.description}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="personality">Bot Personality</Label>
                  <Select
                    value={basicInfo.personality}
                    onValueChange={(value) => setBasicInfo(prev => ({ ...prev, personality: value as 'professional' | 'friendly' | 'casual' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: QR Code Connection */}
          {currentStep === 2 && (
            <Card className="elegant-card">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-100">Connect WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                {!qrCode && (
                  <div>
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-green-600 dark:text-green-300 mb-6">
                      Generate a QR code to connect your WhatsApp Business account
                    </p>
                    <Button onClick={handleGenerateQR} disabled={loading} className="btn-primary">
                      {loading ? 'Generating...' : 'Generate QR Code'}
                    </Button>
                  </div>
                )}

                {qrCode && connectionStatus === 'waiting' && (
                  <div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg inline-block mb-6">
                      <Image 
                        src={qrCode} 
                        alt="WhatsApp QR Code" 
                        width={256} 
                        height={256} 
                        className="w-64 h-64"
                      />
                    </div>
                    <p className="text-green-600 dark:text-green-300">
                      Scan this QR code with your WhatsApp Business app
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <div className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-green-600 dark:text-green-400">Waiting for connection...</span>
                    </div>
                  </div>
                )}

                {connectionStatus === 'connected' && (
                  <div>
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-emerald-600 font-semibold text-lg">WhatsApp Connected Successfully!</p>
                    <p className="text-green-600 dark:text-green-300 mt-2">Proceeding to training setup...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Business Info */}
          {currentStep === 3 && (
            <Card className="elegant-card">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-100">Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Your business name"
                    value={trainingData.businessInfo.name}
                    onChange={(e) => setTrainingData(prev => ({
                      ...prev,
                      businessInfo: { ...prev.businessInfo, name: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="businessDescription">Business Description *</Label>
                  <Textarea
                    id="businessDescription"
                    placeholder="What does your business do? What services do you offer?"
                    value={trainingData.businessInfo.description}
                    onChange={(e) => setTrainingData(prev => ({
                      ...prev,
                      businessInfo: { ...prev.businessInfo, description: e.target.value }
                    }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., E-commerce, Healthcare"
                      value={trainingData.businessInfo.industry}
                      onChange={(e) => setTrainingData(prev => ({
                        ...prev,
                        businessInfo: { ...prev.businessInfo, industry: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://yourwebsite.com"
                      value={trainingData.businessInfo.website}
                      onChange={(e) => setTrainingData(prev => ({
                        ...prev,
                        businessInfo: { ...prev.businessInfo, website: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Q&A Training */}
          {currentStep === 4 && (
            <Card className="elegant-card">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-100">Q&A Training</CardTitle>
                <p className="text-green-600 dark:text-green-300">
                  Train your bot with common questions and answers
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {trainingData.qnaPairs.map((pair, index) => (
                  <div key={index} className="border border-green-200 dark:border-green-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                        Q&A Pair {index + 1}
                      </span>
                      {trainingData.qnaPairs.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeQnaPair(index)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Question</Label>
                        <Input
                          placeholder="What question might customers ask?"
                          value={pair.question}
                          onChange={(e) => updateQnaPair(index, 'question', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Answer</Label>
                        <Textarea
                          placeholder="How should the bot respond?"
                          value={pair.answer}
                          onChange={(e) => updateQnaPair(index, 'answer', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={addQnaPair}
                  className="w-full border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Q&A Pair
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review & Launch */}
          {currentStep === 5 && (
            <Card className="elegant-card">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-100">Review & Launch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-100 mb-2">Bot Information</h4>
                    <p><strong>Name:</strong> {basicInfo.name}</p>
                    <p><strong>Personality:</strong> {basicInfo.personality}</p>
                    <p><strong>WhatsApp:</strong> Connected ✅</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-100 mb-2">Business Information</h4>
                    <p><strong>Business:</strong> {trainingData.businessInfo.name}</p>
                    <p><strong>Industry:</strong> {trainingData.businessInfo.industry || 'Not specified'}</p>
                    <p><strong>Q&A Pairs:</strong> {trainingData.qnaPairs.filter(p => p.question && p.answer).length}</p>
                  </div>
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 text-center">
                  <Sparkles className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-800 dark:text-green-100 mb-2">
                    Ready to Launch!
                  </h3>
                  <p className="text-green-600 dark:text-green-300">
                    Your bot is configured and ready to start helping your customers on WhatsApp.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-green-200 dark:border-green-700">
          <Button
            variant="outline"
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : handleClose()}
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-green-600 dark:text-green-400">
              Step {currentStep} of {steps.length}
            </span>
          </div>

          <Button
            onClick={() => {
              if (currentStep === 1) handleCreateBot()
              else if (currentStep === 5) handleFinishTraining()
              else setCurrentStep(currentStep + 1)
            }}
            disabled={!canProceed() || loading}
            className="btn-primary"
          >
            {loading ? 'Processing...' : currentStep === 5 ? 'Launch Bot' : 'Next'}
            {!loading && currentStep < 5 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 