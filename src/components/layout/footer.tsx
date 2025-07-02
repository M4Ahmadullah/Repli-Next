'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Bot, 
  Mail, 
  Phone, 
  MapPin, 
  Twitter, 
  Github, 
  Linkedin,
  ArrowUp,
  Send,
  Heart,
  Sparkles,
  MessageSquare,
  Shield,
  Zap,
  Globe,
  ExternalLink
} from 'lucide-react'

export function Footer() {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      setEmail('')
      setTimeout(() => setIsSubscribed(false), 3000)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const footerSections = [
    {
      title: 'Product',
      icon: Zap,
      links: [
        { name: 'Features', href: '/#features' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'API Docs', href: '/docs', external: true },
        { name: 'Integrations', href: '/integrations' }
      ]
    },
    {
      title: 'Company',
      icon: Globe,
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Careers', href: '/careers' },
        { name: 'Press Kit', href: '/press' },
        { name: 'Contact', href: '/contact' }
      ]
    },
    {
      title: 'Support',
      icon: Shield,
      links: [
        { name: 'Help Center', href: '/help' },
        { name: 'Community', href: '/community' },
        { name: 'Status Page', href: '/status', external: true },
        { name: 'Bug Reports', href: '/bugs' },
        { name: 'Feature Requests', href: '/requests' }
      ]
    },
    {
      title: 'Legal',
      icon: MessageSquare,
      links: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Cookie Policy', href: '/cookies' },
        { name: 'GDPR', href: '/gdpr' },
        { name: 'Security', href: '/security' }
      ]
    }
  ]

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/repli' },
    { name: 'GitHub', icon: Github, href: 'https://github.com/repli' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/repli' }
  ]

  return (
    <footer className="relative bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-mesh opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-green-950/50 to-transparent"></div>
      
      <div className="relative z-10">
        {/* Newsletter Section */}
        <div className="border-b border-green-700/30">
          <div className="container-responsive section-padding">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-2xl shadow-green-500/30 animate-float">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold mb-4 gradient-text-vibrant">
                Stay Updated with AI Innovation
              </h3>
              <p className="text-xl text-green-200 mb-8 max-w-2xl mx-auto">
                Get the latest updates on WhatsApp AI automation, new features, and exclusive insights delivered to your inbox.
              </p>
              
              <form onSubmit={handleNewsletter} className="max-w-lg mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-premium h-14 pl-12 text-lg w-full"
                      required
                    />
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                  </div>
                  <Button 
                    type="submit" 
                    className="btn-primary h-14 px-8 w-full sm:w-auto whitespace-nowrap"
                    disabled={isSubscribed}
                  >
                    {isSubscribed ? (
                      <>
                        <Heart className="w-5 h-5 mr-2 text-red-400" />
                        Subscribed!
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Subscribe
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-green-300 mt-3">
                  Join 10,000+ developers and business owners. No spam, unsubscribe anytime.
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="container-responsive py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 md:gap-12 lg:gap-16">
            {/* Brand Section */}
            <div className="lg:col-span-2 md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-green-500/30">
                  <Bot className="w-8 h-8 text-white animate-float" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold gradient-text-vibrant">Repli</h3>
                  <p className="text-green-300 font-medium">AI WhatsApp Automation</p>
                </div>
              </div>
              
              <p className="text-green-200 text-lg leading-relaxed mb-8">
                Transform your WhatsApp into an intelligent AI assistant. Create, deploy, and manage powerful WhatsApp bots that understand context and respond naturally to your customers.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-green-200">
                  <div className="w-10 h-10 rounded-xl bg-green-800/50 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-400" />
                  </div>
                  <span>support@repli.ai</span>
                </div>
                <div className="flex items-center space-x-3 text-green-200">
                  <div className="w-10 h-10 rounded-xl bg-green-800/50 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-400" />
                  </div>
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3 text-green-200">
                  <div className="w-10 h-10 rounded-xl bg-green-800/50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-400" />
                  </div>
                  <span>San Francisco, CA</span>
                </div>
              </div>
            </div>

            {/* Links Sections */}
            {footerSections.map((section) => (
              <div key={section.title} className="md:col-span-1 lg:col-span-1">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <section.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white">{section.title}</h4>
                </div>
                
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link 
                        href={link.href}
                        className="flex items-center space-x-2 text-green-200 hover:text-white transition-all duration-300 group"
                        {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-300">
                          {link.name}
                        </span>
                        {link.external && (
                          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-green-700/30">
          <div className="container-responsive py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Copyright */}
              <div className="flex items-center space-x-2 text-green-300">
                <span>© 2024 Repli AI. Made with</span>
                <Heart className="w-4 h-4 text-red-400 animate-pulse" />
                <span>for better customer experiences.</span>
              </div>

              {/* Social Links */}
              <div className="flex items-center space-x-4">
                <span className="text-green-300 font-medium">Follow us:</span>
                {socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-green-800/50 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-green-500 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-green-500/30 group"
                  >
                    <social.icon className="w-5 h-5 text-green-300 group-hover:text-white transition-colors duration-300" />
                  </Link>
                ))}
              </div>

              {/* Back to Top */}
              <Button
                onClick={scrollToTop}
                className="w-12 h-12 rounded-xl bg-green-800/50 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-green-500 p-0 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-green-500/30 group"
              >
                <ArrowUp className="w-5 h-5 text-green-300 group-hover:text-white transition-colors duration-300" />
              </Button>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-green-950/50 border-t border-green-700/30">
          <div className="container-responsive py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-green-400">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span>99.9% uptime</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                  <span>50k+ messages processed</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link href="/status" className="hover:text-green-300 transition-colors duration-300">
                  System Status
                </Link>
                <span>•</span>
                <Link href="/changelog" className="hover:text-green-300 transition-colors duration-300">
                  Changelog
                </Link>
                <span>•</span>
                <span>Version 2.1.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 