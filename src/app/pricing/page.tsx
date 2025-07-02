'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  MessageSquare,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Crown,
  Users,
  Shield,
  Clock
} from 'lucide-react'

export default function PricingPage() {
  const { isSignedIn } = useAuth()
  const [isYearly, setIsYearly] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const plans = [
    {
      name: 'Free',
      description: 'Perfect for trying out Repli',
      price: { monthly: 0, yearly: 0 },
      badge: null,
      color: 'from-gray-500 to-slate-500',
      features: [
        { name: '10 messages per day', included: true },
        { name: 'Basic AI responses', included: true },
        { name: 'Email support', included: true },
        { name: 'Community access', included: true },
        { name: '1 WhatsApp number', included: true },
        { name: 'Basic analytics', included: true },
        { name: 'Priority support', included: false },
        { name: 'Custom AI training', included: false },
        { name: 'Team collaboration', included: false },
        { name: 'Advanced integrations', included: false }
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Starter',
      description: 'Great for small businesses',
      price: { monthly: 29, yearly: 24 },
      badge: 'Most Popular',
      color: 'from-emerald-500 to-green-500',
      features: [
        { name: '100 messages per day', included: true },
        { name: 'Advanced AI with GPT-4', included: true },
        { name: 'Priority email support', included: true },
        { name: 'Custom bot personality', included: true },
        { name: '3 WhatsApp numbers', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Business hours settings', included: true },
        { name: 'Basic integrations', included: true },
        { name: 'Team collaboration', included: false },
        { name: 'White-label solution', included: false }
      ],
      cta: 'Start 14-Day Trial',
      popular: true
    },
    {
      name: 'Growth',
      description: 'Perfect for growing businesses',
      price: { monthly: 99, yearly: 82 },
      badge: 'Best Value',
      color: 'from-green-500 to-teal-500',
      features: [
        { name: '500 messages per day', included: true },
        { name: 'Premium AI with Claude & GPT-4', included: true },
        { name: '24/7 priority support', included: true },
        { name: 'Advanced AI training', included: true },
        { name: '10 WhatsApp numbers', included: true },
        { name: 'Real-time analytics', included: true },
        { name: 'Team collaboration (5 users)', included: true },
        { name: 'Advanced integrations', included: true },
        { name: 'Custom workflows', included: true },
        { name: 'API access', included: true }
      ],
      cta: 'Start 14-Day Trial',
      popular: false
    },
    {
      name: 'Enterprise',
      description: 'For large organizations',
      price: { monthly: 299, yearly: 249 },
      badge: 'Enterprise',
      color: 'from-teal-500 to-emerald-500',
      features: [
        { name: 'Unlimited messages', included: true },
        { name: 'All AI models + Custom models', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Custom AI training & fine-tuning', included: true },
        { name: 'Unlimited WhatsApp numbers', included: true },
        { name: 'Enterprise analytics & reporting', included: true },
        { name: 'Unlimited team members', included: true },
        { name: 'All integrations + Custom APIs', included: true },
        { name: 'White-label solution', included: true },
        { name: 'SLA & uptime guarantee', included: true }
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ]

  const faqs = [
    {
      question: 'How does the free trial work?',
      answer: 'Start with our free plan that includes 10 messages per day. No credit card required. You can upgrade anytime to unlock more features and higher message limits.'
    },
    {
      question: 'Can I change plans anytime?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing differences.'
    },
    {
      question: 'What AI models do you support?',
      answer: 'We support OpenAI GPT-4, Anthropic Claude, and other leading AI models. Higher-tier plans include access to more advanced models and custom training capabilities.'
    },
    {
      question: 'How secure is my data?',
      answer: 'We take security seriously. All data is encrypted in transit and at rest. We\'re SOC 2 compliant and follow industry best practices for data protection.'
    },
    {
      question: 'Do you offer custom enterprise solutions?',
      answer: 'Yes! Our Enterprise plan includes custom integrations, dedicated support, and can be tailored to your specific needs. Contact our sales team for a custom quote.'
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'Free users get community support, Starter users get priority email support, Growth users get 24/7 support, and Enterprise users get a dedicated account manager.'
    }
  ]

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const getPlanPrice = (plan: typeof plans[0]) => {
    return isYearly ? plan.price.yearly : plan.price.monthly
  }

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.price.yearly === 0) return 0
    return Math.round(((plan.price.monthly * 12 - plan.price.yearly * 12) / (plan.price.yearly * 12)) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950">
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 dark:from-emerald-500/20 dark:via-green-500/10 dark:to-teal-500/20"></div>
        <div className="absolute inset-0 bg-grid opacity-20"></div>
        
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-8 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 px-6 py-3 text-base font-semibold shadow-xl shadow-emerald-500/20">
                <Crown className="w-5 h-5 mr-2 pulse-green" />
                Simple, Transparent Pricing
              </Badge>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8"
            >
              Choose Your{' '}
              <span className="gradient-text-vibrant">AI Journey</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-green-700 dark:text-green-200 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              Start free and scale as you grow. Every plan includes our core AI features 
              with no hidden fees or surprise charges.
            </motion.p>

            {/* Billing Toggle */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center justify-center mb-16"
            >
              <div className="bg-white/80 dark:bg-green-900/50 backdrop-blur-md rounded-2xl p-2 border border-green-200 dark:border-green-700 shadow-xl shadow-green-500/10">
                <div className="flex items-center">
                  <button
                    onClick={() => setIsYearly(false)}
                    className={`px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 ${
                      !isYearly 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30' 
                        : 'text-green-700 dark:text-green-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setIsYearly(true)}
                    className={`px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 relative ${
                      isYearly 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30' 
                        : 'text-green-700 dark:text-green-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                    }`}
                  >
                    Yearly
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Save 20%
                    </Badge>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Cards - Horizontal Scroll */}
      <section className="pb-20">
        <div className="container mx-auto container-padding">
          <div className="relative">
            {/* Scroll Container */}
            <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex-none w-80 snap-center"
                >
                  <div className={`relative ${plan.popular ? 'z-10' : 'z-0'}`}>
                    {/* Enhanced Popular Card Highlight */}
                    {plan.popular && (
                      <>
                        <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-emerald-400/30 via-green-400/40 to-emerald-400/30 blur-2xl animate-pulse"></div>
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/40 to-green-500/40 blur-sm"></div>
                      </>
                    )}
                    
                    <Card className={`relative h-[700px] ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-emerald-900/95 to-green-900/95 border-2 border-emerald-400/60 shadow-2xl shadow-emerald-500/30' 
                        : 'bg-gradient-to-br from-white to-green-50/50 dark:from-green-900/30 dark:to-emerald-900/20 border border-green-200 dark:border-green-700'
                    } transition-all duration-300 hover:scale-[1.02] pixel-bg overflow-visible`}>
                      
                      {plan.badge && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-40">
                          <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 text-base font-bold shadow-2xl rounded-full whitespace-nowrap border-3 border-emerald-300/60 backdrop-blur-sm">
                            <Crown className="w-5 h-5 mr-2" />
                            {plan.badge}
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className={`text-center ${plan.popular ? 'pt-12 pb-8' : 'pt-10 pb-8'}`}>
                        <CardTitle className={`${plan.popular ? 'text-3xl text-white' : 'text-3xl text-green-800 dark:text-green-100'} font-bold mb-6`}>
                          {plan.name}
                        </CardTitle>
                        <div className="mb-6">
                          <div className="flex items-baseline justify-center">
                            <span className={`${plan.popular ? 'text-6xl text-emerald-300' : 'text-6xl gradient-text'} font-black leading-none`}>
                              ${getPlanPrice(plan)}
                            </span>
                            <span className={`${plan.popular ? 'text-emerald-200' : 'text-green-600 dark:text-green-400'} text-xl ml-2`}>
                              /{isYearly ? 'year' : 'month'}
                            </span>
                          </div>
                          {isYearly && getSavings(plan) > 0 && (
                            <div className="mt-2">
                              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm px-3 py-1 rounded-full">
                                Save {getSavings(plan)}%
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardDescription className={`${plan.popular ? 'text-emerald-100' : 'text-green-600 dark:text-green-300'} text-lg max-w-sm mx-auto`}>
                          {plan.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="px-8 pb-10 flex flex-col h-full">
                        <div className="space-y-4 mb-10 flex-grow">
                          {plan.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-4 text-left">
                              {feature.included ? (
                                <Check className={`w-6 h-6 ${plan.popular ? 'text-emerald-300' : 'text-emerald-500'} flex-shrink-0`} />
                              ) : (
                                <X className={`w-6 h-6 ${plan.popular ? 'text-red-300' : 'text-gray-400'} flex-shrink-0`} />
                              )}
                              <span className={`${
                                feature.included 
                                  ? plan.popular ? 'text-emerald-100' : 'text-green-700 dark:text-green-200'
                                  : plan.popular ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
                              } text-base font-medium`}>
                                {feature.name}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-auto">
                          <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                            <Button 
                              className={`w-full text-xl py-6 rounded-xl font-bold transition-all duration-300 ${
                                plan.popular 
                                  ? 'bg-gradient-to-r from-emerald-400 to-green-400 text-gray-900 shadow-xl hover:shadow-2xl hover:from-emerald-300 hover:to-green-300' 
                                  : 'btn-primary py-6'
                              }`}
                            >
                              {plan.popular ? (
                                <>
                                  <Zap className="w-6 h-6 mr-2" />
                                  {plan.cta}
                                </>
                              ) : (
                                plan.cta
                              )}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Scroll Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {plans.map((_, index) => (
                <div key={index} className="w-2 h-2 rounded-full bg-green-300 dark:bg-green-600 opacity-50"></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 relative">
        <div className="container mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Trusted by <span className="text-emerald-200">10,000+</span> Businesses
            </h2>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
              Join companies worldwide using Repli to automate their customer service
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: MessageSquare, number: '50K+', text: 'Messages Processed', color: 'from-emerald-500 to-green-500' },
              { icon: Shield, number: '99.9%', text: 'Uptime', color: 'from-green-500 to-teal-500' },
              { icon: Clock, number: '2min', text: 'Average Setup', color: 'from-teal-500 to-emerald-500' },
              { icon: Users, number: '10K+', text: 'Happy Customers', color: 'from-emerald-600 to-green-600' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-colors duration-300 shadow-xl">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl lg:text-5xl font-black text-white mb-4 leading-none">
                    {stat.number}
                  </div>
                  <div className="text-emerald-100 font-semibold text-base uppercase tracking-wide">{stat.text}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto container-padding">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Frequently Asked <span className="gradient-text-vibrant">Questions</span>
              </h2>
              <p className="text-xl text-green-700 dark:text-green-200">
                Everything you need to know about Repli pricing and features
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="elegant-card">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full text-left p-6 flex items-center justify-between hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-300 rounded-xl"
                    >
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-100 pr-4">
                        {faq.question}
                      </h3>
                      {openFaq === index ? (
                        <ChevronUp className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                      )}
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-6">
                        <p className="text-green-600 dark:text-green-300 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-20"></div>
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-white mb-8"
            >
              Ready to Transform Your <span className="text-emerald-200">Customer Service</span>?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-emerald-100 mb-10 leading-relaxed"
            >
              Start your free trial today. No credit card required. Setup takes less than 2 minutes.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <Link href="/sign-up">
                <Button className="bg-white text-green-600 hover:bg-green-50 font-bold text-xl px-10 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 border-2 border-green-100 hover:border-green-200">
                  <Sparkles className="w-6 h-6 mr-3 animate-pulse" />
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 hover:border-white/50 font-bold text-xl px-10 py-6 rounded-2xl backdrop-blur-md shadow-2xl hover:shadow-3xl transition-all duration-500">
                  View Demo
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
} 