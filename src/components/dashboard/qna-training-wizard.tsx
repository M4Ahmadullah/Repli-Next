'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Upload, 
  FileText, 
  Brain, 
  Plus, 
  Trash2, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Rocket 
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TrainingStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

interface TrainingQuestion {
  id: string
  question: string
  answer: string
}

interface CustomPair {
  id: string
  question: string
  answer: string
}

const TRAINING_SUB_STEPS: TrainingStep[] = [
  {
    id: 1,
    title: 'Document Upload',
    description: 'Upload your business document',
    icon: <FileText className="w-10 h-10" />
  },
  {
    id: 2,
    title: 'AI Questions',
    description: 'Answer AI-generated questions',
    icon: <Brain className="w-10 h-10" />
  },
  {
    id: 3,
    title: 'Custom Q&A',
    description: 'Add custom question-answer pairs',
    icon: <Plus className="w-10 h-10" />
  }
]

export const QnaTrainingWizard = ({ 
  botId, 
  onComplete, 
  onSubStepChange,
  currentStep: parentStep 
}: { 
  botId: string; 
  onComplete: () => void; 
  onSubStepChange?: (step: number) => void;
  currentStep?: number;
}) => {
  const [currentStep, setCurrentStep] = useState(parentStep || 0) // Use parent step if provided, otherwise start at 0 (no step)
  const [currentSubStep, setCurrentSubStep] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [trainingQuestions, setTrainingQuestions] = useState<TrainingQuestion[]>([])
  const [customPairs, setCustomPairs] = useState<CustomPair[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [isCustomQAComplete, setIsCustomQAComplete] = useState(false)

  // Backend completion tracking
  const [documentUploadCompleted, setDocumentUploadCompleted] = useState(false)
  const [questionsCompleted, setQuestionsCompleted] = useState(false)
  const [customQACompleted, setCustomQACompleted] = useState(false)

  // State to track explicit Custom Q&A completion
  const [isCustomQAExplicitlyCompleted, setIsCustomQAExplicitlyCompleted] = useState(false)

  // Update internal step when parent step changes
  useEffect(() => {
    if (parentStep !== undefined) {
      setCurrentStep(parentStep)
    }
  }, [parentStep])

  // Update internal sub-step when parent step changes (but only if parent is on step 3)
  useEffect(() => {
    if (parentStep === 3) {
      // Only update if we're on the AI Training step
      setCurrentSubStep(1) // Reset to first sub-step when entering AI Training
    }
  }, [parentStep])

  // Notify parent of sub-step changes
  useEffect(() => {
    if (onSubStepChange) {
      onSubStepChange(currentStep)
    }
  }, [currentStep, onSubStepChange])

  const TOTAL_STEPS = 5 // 0 (Overview) + 1-3 (AI Training) + 4 (Final Review)
  const AI_TRAINING_STEPS = 3 // Number of AI Training subsections

  const generateQuestions = useCallback(async () => {
    setIsGeneratingQuestions(true)
    try {
      const response = await fetch('/api/bot-training/questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('firebase_token')}`
        },
        body: JSON.stringify({ botId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate questions')
      }

      const data = await response.json()
      if (data.success && data.questions) {
        setTrainingQuestions(data.questions)
        setQuestionsCompleted(true) // Mark as completed on backend success
        toast.success('AI questions generated successfully!')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate questions'
      toast.error(`${errorMessage}. Please try again.`)
    } finally {
      setIsGeneratingQuestions(false)
    }
  }, [botId])

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true)
    setUploadedFile(file)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('botId', botId)

      const response = await fetch('/api/bot-training/document/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('firebase_token')}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload document')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Document uploaded successfully! AI will now analyze your document and generate questions.')
        setDocumentUploadCompleted(true) // Mark as completed on backend success
        generateQuestions()
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document'
      toast.error(`${errorMessage}. Please try again.`)
      setUploadedFile(null)
    } finally {
      setIsUploading(false)
    }
  }, [botId, generateQuestions])

  const handleQuestionAnswer = useCallback((questionId: string, answer: string) => {
    setTrainingQuestions(prev => 
      prev.map(q => q.id === questionId ? { ...q, answer } : q)
    )
  }, [])

  const addCustomPair = useCallback(() => {
    const newPair: CustomPair = {
      id: `custom_${Date.now()}`,
      question: '',
      answer: ''
    }
    setCustomPairs(prev => [...prev, newPair])
  }, [])

  const updateCustomPair = useCallback((id: string, field: 'question' | 'answer', value: string) => {
    setCustomPairs(prev => 
      prev.map(pair => pair.id === id ? { ...pair, [field]: value } : pair)
    )
    
    // Check if all custom pairs are valid
    const allPairsValid = customPairs.every(pair => 
      pair.question.trim() !== '' && pair.answer.trim() !== ''
    )
    setIsCustomQAComplete(allPairsValid)
  }, [customPairs])

  const removeCustomPair = useCallback((id: string) => {
    const updatedPairs = customPairs.filter(pair => pair.id !== id)
    setCustomPairs(updatedPairs)
    
    // Check if all remaining custom pairs are valid
    const allPairsValid = updatedPairs.every(pair => 
      pair.question.trim() !== '' && pair.answer.trim() !== ''
    )
    setIsCustomQAComplete(allPairsValid)
  }, [customPairs])

  const handleTraining = useCallback(async () => {
    setIsTraining(true)

    try {
      // Process answers
      const answersResponse = await fetch('/api/bot-training/answers/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('firebase_token')}`
        },
        body: JSON.stringify({
          botId,
          answers: trainingQuestions.reduce((acc, q) => {
            acc[q.id] = q.answer
            return acc
          }, {} as Record<string, string>)
        })
      })

      if (!answersResponse.ok) {
        const errorData = await answersResponse.json()
        throw new Error(errorData.error || 'Failed to process answers')
      }

      // Store custom pairs if any
      if (customPairs.length > 0) {
        const pairsResponse = await fetch('/api/bot-training/custom-qa/store', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('firebase_token')}`
          },
          body: JSON.stringify({
            botId,
            customPairs: customPairs.filter(p => p.question.trim() && p.answer.trim())
          })
        })

        if (!pairsResponse.ok) {
          const errorData = await pairsResponse.json()
          throw new Error(errorData.error || 'Failed to store custom pairs')
        }
      }

      // Final training and activation
      const trainingResponse = await fetch('/api/bot-training/train/final', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('firebase_token')}`
        },
        body: JSON.stringify({ 
          botId,
          botName: 'AI Assistant'
        })
      })

      if (!trainingResponse.ok) {
        const errorData = await trainingResponse.json()
        throw new Error(errorData.error || 'Failed to train AI')
      }

      const trainingResult = await trainingResponse.json()
      
      if (trainingResult.success && trainingResult.data?.botActivated) {
        toast.success('Training completed! Your AI bot is now ready to use.')
        onComplete()
      } else {
        throw new Error('Bot activation failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Training failed'
      toast.error(`${errorMessage}. Please try again or contact support.`)
    } finally {
      setIsTraining(false)
    }
  }, [botId, trainingQuestions, customPairs, onComplete])

  // Modify canProceedToNext to validate each sub-step
  const canProceedToNext = () => {
    switch (currentSubStep) {
      case 1: // Document Upload
        return !!uploadedFile
      case 2: // AI Questions
        return trainingQuestions.length > 0 && trainingQuestions.every(q => q.answer.trim())
      case 3: // Custom Q&A
        return true // Optional step
      default: 
        return false
    }
  }

  // Modify handleNext to handle explicit Custom Q&A completion
  const handleNext = () => {
    if (currentSubStep < 3) {
      // Move to next sub-step
      setCurrentSubStep((prevStep: number) => prevStep + 1)
    } else if (currentSubStep === 3) {
      // Custom Q&A step
      if (customPairs.length > 0) {
        // Mark as explicitly completed if at least one custom pair exists
        setIsCustomQAExplicitlyCompleted(true)
      }
      
      // Proceed to training
      handleTraining()
    }
  }

  // Modify handlePrevious to allow navigation between sub-steps and main steps
  const handlePrevious = () => {
    if (currentSubStep > 1) {
      // Move to previous sub-step
      setCurrentSubStep((prevStep: number) => prevStep - 1)
    } else {
      // At first sub-step, allow navigation back to previous main step
      // This will be handled by the parent component
      const qnaNav = (window as any).qnaTrainingNavigation
      if (qnaNav && qnaNav.setCurrentStep) {
        qnaNav.setCurrentStep(1) // Reset to first sub-step
      }
    }
  }

  // Determine the highest completed sub-step
  const getHighestCompletedSubStep = () => {
    if (uploadedFile) return 1
    if (trainingQuestions.length > 0 && 
        trainingQuestions.every(q => q.answer.trim())) return 2
    if (customPairs.length > 0 || isCustomQAExplicitlyCompleted) return 3
    return 0
  }

  // Check if a sub-step can be navigated to via sidebar
  const canNavigateToSubStep = (targetSubStep: number) => {
    const highestCompletedSubStep = getHighestCompletedSubStep()
    return targetSubStep <= highestCompletedSubStep + 1
  }

  // Expose more robust navigation methods for parent component
  useEffect(() => {
    // Make navigation methods available to parent
    if (typeof window !== 'undefined') {
      (window as any).qnaTrainingNavigation = {
        handleNext,
        handlePrevious,
        canProceedToNext,
        canNavigateToSubStep, // Add this method
        currentStep: currentSubStep,
        setCurrentStep: (step: number) => {
          // Ensure step is within valid range and can be navigated to
          if (step >= 1 && step <= 3 && canNavigateToSubStep(step)) {
            setCurrentSubStep(step)
          } else {
            // Show error if trying to navigate to a locked sub-step
            toast.error('Complete the current step before accessing the next section.')
          }
        },
        isTraining,
        isUploading,
        isGeneratingQuestions,
        documentUploadCompleted: !!uploadedFile,
        questionsCompleted: trainingQuestions.length > 0 && 
          trainingQuestions.every(q => q.answer.trim()),
        customQACompleted: isCustomQAExplicitlyCompleted || customPairs.length > 0,
        trainingQuestions
      }
    }
  }, [
    handleNext, 
    handlePrevious, 
    canProceedToNext, 
    canNavigateToSubStep,
    currentSubStep, 
    isTraining, 
    isUploading, 
    isGeneratingQuestions, 
    uploadedFile,
    trainingQuestions,
    isCustomQAExplicitlyCompleted,
    customPairs
  ])

  // Render sub-steps with navigation restrictions
  const renderSubStepNavigation = () => {
    return TRAINING_SUB_STEPS.map((step) => {
      const isCurrentStep = currentSubStep === step.id
      const isCompleted = canNavigateToSubStep(step.id)
      const isDisabled = !canNavigateToSubStep(step.id)

      return (
        <div 
          key={step.id}
          className={`
            flex items-center cursor-pointer p-2 rounded-lg transition-all duration-300
            ${isCurrentStep ? 'bg-emerald-100 dark:bg-emerald-900' : 'hover:bg-emerald-50 dark:hover:bg-emerald-800'}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => {
            if (!isDisabled) {
              setCurrentSubStep(step.id)
            }
          }}
        >
          <div className="mr-3">
            {step.icon}
          </div>
          <div>
            <h3 className={`
              text-sm font-medium
              ${isCurrentStep ? 'text-emerald-700 dark:text-emerald-200' : 'text-gray-600 dark:text-gray-300'}
              ${isDisabled ? 'text-gray-400 dark:text-gray-600' : ''}
            `}>
              {step.title}
            </h3>
            <p className={`
              text-xs
              ${isCurrentStep ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}
              ${isDisabled ? 'text-gray-300 dark:text-gray-500' : ''}
            `}>
              {step.description}
            </p>
          </div>
          {isCompleted && (
            <CheckCircle className="ml-auto w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          )}
        </div>
      )
    })
  }

  const renderStepContent = () => {
    switch (currentSubStep) {
      case 0: // Overview
        return (
          <div className="flex flex-col h-full">
            <div className="flex-grow flex items-center justify-center p-6">
              <div className="w-full max-w-3xl text-center">
                <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-200 mb-6">
                  AI Training Overview
                </h2>
                <p className="text-xl text-emerald-600 dark:text-emerald-300 mb-8">
                  Train your AI bot to provide accurate and helpful responses
                </p>
                
                <div className="grid grid-cols-3 gap-6 mb-10">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-700">
                    <FileText className="w-16 h-16 text-emerald-500 dark:text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-200 mb-2">
                      Document Upload
                    </h3>
                    <p className="text-emerald-600 dark:text-emerald-300">
                      Upload a business document for AI analysis
                    </p>
                  </div>
                  
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-700">
                    <Brain className="w-16 h-16 text-emerald-500 dark:text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-200 mb-2">
                      AI Questions
                    </h3>
                    <p className="text-emerald-600 dark:text-emerald-300">
                      Answer AI-generated personalized questions
                    </p>
                  </div>
                  
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-700">
                    <Plus className="w-16 h-16 text-emerald-500 dark:text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-200 mb-2">
                      Custom Q&A
                    </h3>
                    <p className="text-emerald-600 dark:text-emerald-300">
                      Add your own custom question-answer pairs
                    </p>
                  </div>
                </div>
                
                <p className="text-base text-emerald-600 dark:text-emerald-300">
                  By completing these steps, you'll help your AI bot understand 
                  your business and provide more accurate responses.
                </p>
              </div>
            </div>
          </div>
        )

      case 1: // Document Upload
        return (
          <div className="flex flex-col h-full">
            <div className="flex-grow flex items-center justify-center p-6">
              <div className="w-full max-w-3xl relative">
                {/* Badge moved to top right */}
                <div className="absolute top-0 right-0 mb-4">
                  <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium border border-red-200 dark:border-red-700">
                    Required
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-200 mb-6 text-center">
                  Upload Your Business Document
                </h2>
                <p className="text-base text-emerald-600 dark:text-emerald-300 text-center mb-8">
                  Upload a document to help AI understand your business better. 
                  We'll analyze it and generate personalized questions.
                </p>

                {/* Existing document upload content */}
                <div className="w-full">
                  {!uploadedFile ? (
                    <div 
                      className={cn(
                        "border-4 border-dashed rounded-2xl p-10 text-center transition-all duration-300",
                        "bg-emerald-50 dark:bg-emerald-900/20",
                        "border-emerald-300 dark:border-emerald-700",
                        "hover:border-emerald-200 dark:hover:border-emerald-400"
                      )}
                    >
                      {/* Existing upload button and input */}
                      <Upload className="w-16 h-16 text-emerald-500 dark:text-emerald-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-200 mb-3">
                        Upload Your Business Document
                      </h3>
                      <p className="text-base text-emerald-600 dark:text-emerald-300 mb-6">
                        Drag and drop your file here, or click to browse. 
                        We support PDF, DOC, DOCX, and TXT files up to 10MB.
                      </p>
                      <Button 
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="bg-emerald-500 text-white dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500"
                      >
                        <Upload className="mr-2" /> Choose File
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file)
                        }}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border-2 border-emerald-300 dark:border-emerald-700">
                      {/* Existing uploaded file display */}
                      <div className="flex items-center gap-4">
                        <FileText className="w-12 h-12 text-emerald-500 dark:text-emerald-400" />
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-emerald-700 dark:text-emerald-200 mb-1">
                            {uploadedFile.name}
                          </h4>
                          <p className="text-sm text-emerald-600 dark:text-emerald-300">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Uploaded successfully
                          </p>
                        </div>
                        <CheckCircle className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 2: // AI Questions
        return (
          <div className="flex flex-col h-full">
            <div className="flex-grow flex items-center justify-center p-6">
              <div className="w-full max-w-3xl relative">
                {/* Badge moved to top right */}
                <div className="absolute top-0 right-0 mb-4">
                  <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium border border-red-200 dark:border-red-700">
                    Required
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-200 mb-4 text-center">
                  Answer AI-Generated Questions
                </h2>
                <p className="text-base text-emerald-600 dark:text-emerald-300 text-center mb-6">
                  Based on your uploaded document, AI has generated personalized questions. 
                  Please answer them to train your bot.
                </p>

                {/* Existing AI questions content */}
                <div className="space-y-4">
                  {trainingQuestions.map((question, index) => (
                    <div 
                      key={question.id} 
                      className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border-2 border-emerald-300 dark:border-emerald-700"
                    >
                      {/* Existing question and answer input */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 bg-emerald-500 dark:bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-emerald-700 dark:text-emerald-200 mb-3">
                            {question.question}
                          </h4>
                          <Textarea
                            placeholder="Type your detailed answer here..."
                            value={question.answer}
                            onChange={(e) => handleQuestionAnswer(question.id, e.target.value)}
                            className="min-h-[100px] border-2 border-emerald-300 dark:border-emerald-700 rounded-xl text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 3: // Custom Q&A
        return (
          <div className="flex flex-col h-full">
            <div className="flex-grow flex items-center justify-center p-6">
              <div className="w-full max-w-3xl relative">
                {/* Badge moved to top right */}
                <div className="absolute top-0 right-0 mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-700">
                    Optional
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-200 mb-4 text-center">
                  Add Custom Q&A Pairs
                </h2>
                <p className="text-base text-emerald-600 dark:text-emerald-300 text-center mb-6">
                  Add specific questions and answers that your customers commonly ask. 
                  This will make your bot more accurate and helpful.
                </p>

                {/* Existing custom Q&A content */}
                <div className="space-y-4">
                  {customPairs.map((pair, index) => (
                    <div 
                      key={pair.id} 
                      className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 border-2 border-purple-300 dark:border-purple-700"
                    >
                      {/* Existing custom pair input */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 bg-purple-500 dark:bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <Label className="text-sm font-semibold text-purple-600 dark:text-purple-300 mb-2">
                              Question
                            </Label>
                            <Input
                              placeholder="Enter the question your customers ask..."
                              value={pair.question}
                              onChange={(e) => updateCustomPair(pair.id, 'question', e.target.value)}
                              className="border-2 border-purple-300 dark:border-purple-700 rounded-xl text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-semibold text-purple-600 dark:text-purple-300 mb-2">
                              Answer
                            </Label>
                            <Textarea
                              placeholder="Enter the detailed answer..."
                              value={pair.answer}
                              onChange={(e) => updateCustomPair(pair.id, 'answer', e.target.value)}
                              className="min-h-[100px] border-2 border-purple-300 dark:border-purple-700 rounded-xl text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCustomPair(pair.id)}
                          className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 self-start"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add custom pair button */}
                <Button
                  onClick={addCustomPair}
                  variant="outline"
                  className="w-full mt-4 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm"
                >
                  <Plus className="mr-2 w-4 h-4" /> Add Custom Q&A Pair
                </Button>

                {/* Explicit completion button */}
                {customPairs.length > 0 && (
                  <Button
                    onClick={() => {
                      setIsCustomQAExplicitlyCompleted(true)
                      handleNext() // Proceed to training
                    }}
                    className="w-full mt-4 bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    Complete Custom Q&A
                  </Button>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Don't render anything if parent is not on step 3 (AI Training)
  if (!parentStep || parentStep === 0 || parentStep !== 3) {
    return null
  }

  // Reset to first sub-step when entering AI Training
  useEffect(() => {
    if (parentStep === 3) {
      setCurrentSubStep(1) // Start at first sub-step
    }
  }, [parentStep])

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 p-10">
      
      <div className="flex-1 overflow-y-auto">
        {renderStepContent()}
      </div>

      {/* No local navigation - let parent handle all navigation */}
    </div>
  )
} 