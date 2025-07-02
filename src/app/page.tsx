'use client'

import Link from "next/link";
import { useAuth, useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  MessageSquare, 
  Sparkles, 
  Check,
  ArrowRight,
  Shield,
  Users,
  BarChart3,
  Clock,
  Crown
} from 'lucide-react';

// Optimized animated counter hook
const useAnimatedCounter = (end: number, duration: number = 1500) => {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          let start = 0
          const increment = end / (duration / 50) // Reduced frequency from 16ms to 50ms
          const timer = setInterval(() => {
            start += increment
            if (start >= end) {
              setCount(end)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, 50)
          
          // Cleanup timer after animation
          setTimeout(() => clearInterval(timer), duration + 100)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [end, duration, hasAnimated])

  return { count, ref }
}

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950">
      {/* Hero Section with Green Gradient Background */}
      <section className="pt-20 pb-30 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 dark:from-emerald-500/20 dark:via-green-500/10 dark:to-teal-500/20"></div>
        <div className="absolute inset-0 bg-grid opacity-30"></div>
        
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 1 }} // Start visible for SSR
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Badge className="mb-8 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 px-6 py-2 text-base font-semibold shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-5 h-5 mr-2 pulse-green" />
                AI-Powered WhatsApp Revolution
              </Badge>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 1 }} // Start visible for SSR
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8"
            >
              Transform Your{' '}
              <span className="animated-gradient">WhatsApp</span>
              <br />
              Into an{' '}
              <span className="gradient-text-vibrant">AI Powerhouse</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 1 }} // Start visible for SSR
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-xl md:text-2xl text-green-700 dark:text-green-200 mb-10 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              Create intelligent WhatsApp bots that understand context, respond naturally, 
              and scale your customer service with the power of advanced AI technology.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 1 }} // Start visible for SSR
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              {isLoaded && isSignedIn ? (
                <>
                  <Link href="/dashboard">
                    <Button className="btn-primary text-lg px-8 py-4 glow-effect hover:-translate-y-1 transition-transform duration-300">
                      <Bot className="w-6 h-6 mr-3" />
                      Open Dashboard
                    </Button>
                  </Link>
                  <div className="flex items-center gap-4 bg-gradient-to-r from-green-100/80 to-emerald-100/80 dark:from-green-900/30 dark:to-emerald-900/30 px-6 py-3 rounded-2xl border border-green-200 dark:border-green-700 shadow-lg shadow-green-500/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-green-800 dark:text-green-200 font-semibold">Welcome back, {user?.firstName || 'there'}!</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center group">
                  <Link href="/sign-up">
                    <Button className="btn-primary text-lg px-8 py-4 glow-effect group-hover:-translate-y-1 transition-all duration-300">
                      <Sparkles className="w-6 h-6 mr-3" />
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button className="btn-secondary text-lg px-8 py-4 group-hover:-translate-y-1 transition-all duration-300">
                      View Pricing
                      <ArrowRight className="w-5 h-5 ml-3" />
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>

            {(!isLoaded || !isSignedIn) && (
              <motion.div 
                initial={{ opacity: 1 }} // Start visible for SSR
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-green-600 dark:text-green-400"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-sm sm:text-base">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-sm sm:text-base">10 free messages daily</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-sm sm:text-base">Setup in 2 minutes</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-green-100/50 via-emerald-100/30 to-teal-100/50 dark:from-green-900/20 dark:via-emerald-900/10 dark:to-teal-900/20">
        <div className="container mx-auto container-padding">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 1 }} // Start visible for SSR
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Why Choose <span className="gradient-text-vibrant">Repli</span>?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 1 }} // Start visible for SSR
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xl text-green-700 dark:text-green-200 max-w-3xl mx-auto"
            >
              Everything you need to create, deploy, and manage intelligent WhatsApp bots with cutting-edge AI
            </motion.p>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 my-8">
            {[
              {
                icon: Bot,
                title: "AI-Powered Conversations",
                description: "Advanced AI that understands context and responds naturally to your customers",
                features: ["GPT-4 & Claude AI models", "Custom personality settings", "Multi-language support"],
                color: "from-emerald-500 to-green-500"
              },
              {
                icon: MessageSquare,
                title: "WhatsApp Integration",
                description: "Seamless integration with WhatsApp Business API for maximum reach",
                features: ["Rich media messages", "Template message support", "99.9% uptime guarantee"],
                color: "from-green-500 to-teal-500"
              },
              {
                icon: BarChart3,
                title: "Analytics & Insights",
                description: "Track performance and optimize your bot responses with detailed analytics",
                features: ["Real-time message tracking", "Customer satisfaction metrics", "Performance optimization"],
                color: "from-teal-500 to-emerald-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 1 }} // Start visible for SSR
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className="feature-card h-full min-h-[350px] flex flex-col text-center">
                  <CardHeader className="pt-10 flex-grow">
                    <div className={`w-24 h-24 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-105 transition-transform duration-300 shadow-2xl shadow-green-500/30`}>
                      <feature.icon className="w-12 h-12 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-green-800 dark:text-green-100 mb-6 min-h-[72px] flex items-center justify-center">{feature.title}</CardTitle>
                    <CardDescription className="text-green-600 dark:text-green-300 text-lg leading-relaxed max-w-sm mx-auto min-h-[56px] flex items-center justify-center">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pb-10">
                    <ul className="space-y-4">
                      {feature.features.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-green-700 dark:text-green-200 text-left">
                          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          <span className="font-medium text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 relative">
        <div className="container mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Trusted by Businesses <span className="text-emerald-200">Worldwide</span>
            </h2>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
              Join thousands of companies already using Repli to revolutionize their customer service
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: MessageSquare, number: 50000, suffix: "+", text: "Messages Processed", color: "from-emerald-500 to-green-500" },
              { icon: Shield, number: 99.9, suffix: "%", text: "Uptime", color: "from-green-500 to-teal-500" },
              { icon: Clock, number: 2, suffix: "min", text: "Average Setup", color: "from-teal-500 to-emerald-500" },
              { icon: Users, number: 1200, suffix: "+", text: "Happy Customers", color: "from-emerald-600 to-green-600" }
            ].map((stat, index) => {
              const StatCounter = () => {
                const { count, ref } = useAnimatedCounter(stat.number, 1500)
                return (
                  <div ref={ref} className="text-4xl lg:text-5xl font-black text-white mb-4 leading-none">
                    {count}{stat.suffix}
                  </div>
                )
              }
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-colors duration-300 shadow-xl min-h-[240px] flex flex-col justify-center">
                    {/* Icon */}
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Counter */}
                    <StatCounter />
                    <div className="text-emerald-100 font-semibold text-base uppercase tracking-wide">{stat.text}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="pt-40 pb-24 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950">
        <div className="container mx-auto container-padding">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, <span className="gradient-text-vibrant">Transparent</span> Pricing
            </h2>
            <p className="text-xl text-green-700 dark:text-green-200 max-w-2xl mx-auto">
              Start free and scale as you grow with flexible plans designed for every business size
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mt-16">
            {[
              { 
                plan: 'Free', 
                price: '$0', 
                period: '/month',
                description: 'Perfect for trying out Repli',
                features: ['10 messages/day', 'Basic AI responses', 'Email support', 'Community access'],
                popular: false,
                color: 'from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20'
              },
              { 
                plan: 'Starter', 
                price: '$29', 
                period: '/month',
                description: 'Great for small businesses',
                features: ['100 messages/day', 'Advanced AI', 'Priority support', 'Custom personality'],
                popular: true,
                color: 'from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20'
              },
              { 
                plan: 'Growth', 
                price: '$99', 
                period: '/month',
                description: 'Perfect for growing businesses',
                features: ['500 messages/day', 'Team collaboration', 'Advanced analytics', 'API access'],
                popular: false,
                color: 'from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/20'
              }
            ].map((tier, index) => (
              <motion.div
                key={tier.plan}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative ${tier.popular ? 'z-10' : 'z-0'}`}
              >
                {/* Enhanced Popular Card Highlight with Light Effect */}
                {tier.popular && (
                  <>
                    <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-emerald-400/30 via-green-400/40 to-emerald-400/30 blur-2xl animate-pulse"></div>
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/40 to-green-500/40 blur-sm"></div>
                  </>
                )}
                
                <Card className={`relative ${tier.popular ? 'min-h-[580px]' : 'min-h-[560px]'} ${
                  tier.popular 
                    ? 'bg-gradient-to-br from-emerald-900/95 to-green-900/95 border-2 border-emerald-400/60 shadow-2xl shadow-emerald-500/30' 
                    : 'bg-gradient-to-br from-white to-green-50/50 dark:from-green-900/30 dark:to-emerald-900/20 border border-green-200 dark:border-green-700'
                } transition-all duration-300 hover:scale-[1.02] pixel-bg`}>
                  
                  {tier.popular && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-40">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 text-base font-bold shadow-2xl rounded-full whitespace-nowrap border-3 border-emerald-300/60 backdrop-blur-sm">
                        <Crown className="w-5 h-5 mr-2" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className={`text-center ${tier.popular ? 'pt-12 pb-8' : 'pt-10 pb-8'}`}>
                    <CardTitle className={`${tier.popular ? 'text-3xl text-white' : 'text-3xl text-green-800 dark:text-green-100'} font-bold mb-6`}>{tier.plan}</CardTitle>
                    <div className="mb-6">
                      <span className={`${tier.popular ? 'text-6xl text-emerald-300' : 'text-6xl gradient-text'} font-black leading-none`}>{tier.price}</span>
                      <span className={`${tier.popular ? 'text-emerald-200' : 'text-green-600 dark:text-green-400'} text-xl ml-2`}>{tier.period}</span>
                    </div>
                    <CardDescription className={`${tier.popular ? 'text-emerald-100' : 'text-green-600 dark:text-green-300'} text-lg max-w-sm mx-auto`}>{tier.description}</CardDescription>
            </CardHeader>
                  
                  <CardContent className="px-8 pb-10">
                    <div className="space-y-4 mb-10">
                      {tier.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-4 text-left">
                          <Check className={`w-6 h-6 ${tier.popular ? 'text-emerald-300' : 'text-emerald-500'} flex-shrink-0`} />
                          <span className={`${tier.popular ? 'text-emerald-100' : 'text-green-700 dark:text-green-200'} text-base font-medium`}>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Link href="/sign-up">
                      <Button 
                        className={`w-full text-xl py-5 rounded-xl font-bold transition-all duration-300 ${
                          tier.popular 
                            ? 'bg-gradient-to-r from-emerald-400 to-green-400 text-gray-900 shadow-xl hover:shadow-2xl hover:from-emerald-300 hover:to-green-300' 
                            : 'btn-primary py-5'
                        }`}
                      >
                        {tier.popular ? '⚡ Get Started' : 'Get Started'}
                      </Button>
                    </Link>
            </CardContent>
          </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-20"></div>
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-white mb-8"
            >
              Ready to Transform Your <span className="text-emerald-200">WhatsApp</span>?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-emerald-100 mb-10 leading-relaxed"
            >
              Join thousands of businesses using Repli to automate their customer service with the power of AI. 
              Start your free trial today and experience the future of WhatsApp automation.
            </motion.p>
            
            {(!isLoaded || !isSignedIn) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-6 justify-center group"
              >
                <Link href="/sign-up">
                  <Button className="bg-white text-green-600 hover:bg-green-50 font-bold text-xl px-10 py-5 rounded-2xl shadow-2xl hover:shadow-3xl group-hover:-translate-y-1 transition-all duration-500 border-2 border-green-100 hover:border-green-200">
                    <Sparkles className="w-6 h-6 mr-3 animate-pulse" />
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button className="bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 hover:border-white/50 font-bold text-xl px-10 py-5 rounded-2xl backdrop-blur-md shadow-2xl hover:shadow-3xl group-hover:-translate-y-1 transition-all duration-500">
                    View All Plans
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
