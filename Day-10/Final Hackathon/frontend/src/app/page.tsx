'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Mic, 
  Globe, 
  Zap, 
  Users, 
  Palette, 
  Code, 
  ArrowRight,
  LogIn,
  UserPlus,
  Play,
  Star,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
}

// Mock useAuth hook - replace with your actual auth context
const useAuth = (): AuthContextType => {
  return {
    isAuthenticated: false,
    user: null
  };
};

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fade in animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Voice Commands",
      description: "Create and edit websites using natural language voice commands",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "AI-Powered",
      description: "Advanced AI agents understand your requirements and build accordingly",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Responsive Design",
      description: "Professional, mobile-friendly websites that work on all devices",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Modern UI",
      description: "Beautiful, contemporary designs with smooth animations",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: "Clean Code",
      description: "Generate high-quality, semantic HTML and CSS code",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "User-Friendly",
      description: "No coding experience required - just speak your ideas",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Small Business Owner",
      quote: "Created my business website in minutes just by talking to the AI. Amazing!",
      avatar: "SC"
    },
    {
      name: "Mike Rodriguez",
      role: "Freelancer",
      quote: "The voice commands make web design so intuitive. Love this platform!",
      avatar: "MR"
    },
    {
      name: "Emily Johnson",
      role: "Marketing Manager",
      quote: "Finally, a website builder that understands what I want without complex menus.",
      avatar: "EJ"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Speak Your Ideas",
      description: "Describe your website using natural language. Tell us what you want to create.",
      icon: <Mic className="w-8 h-8" />
    },
    {
      number: "02",
      title: "AI Builds It",
      description: "Our advanced AI agents understand your requirements and generate the website instantly.",
      icon: <Zap className="w-8 h-8" />
    },
    {
      number: "03",
      title: "Refine with Voice",
      description: "Make changes using voice commands. Edit, update, and perfect your website.",
      icon: <CheckCircle className="w-8 h-8" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 text-gray-900 overflow-x-hidden">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating Orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400 opacity-10 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`,
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-400 opacity-8 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translateY(${scrollY * -0.05}px)`,
            animation: 'float 8s ease-in-out infinite reverse'
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400 opacity-5 rounded-full blur-3xl animate-ping"
        />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 group-hover:rotate-6">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">
                  VoiceWeb
                </h1>
                <p className="text-xs text-gray-600 hidden sm:block">AI-Powered Creation</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <Link 
                href="/auth/login" 
                className="px-6 py-2.5 rounded-xl border border-gray-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-300 flex items-center space-x-2 group"
              >
                <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span>Sign In</span>
              </Link>
              <Link 
                href="/auth/register" 
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <UserPlus className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">Get Started</span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-300 hover:bg-white hover:border-purple-400 transition-all duration-300"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/50 px-4 py-6 space-y-4 shadow-lg">
            <Link 
              href="/auth/login" 
              className="block w-full px-6 py-3 rounded-xl border border-gray-300 bg-white/80 text-center text-gray-700 hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-300"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/register" 
              className="block w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-center transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 lg:pt-20">
        {/* Hero Section */}
        <section className={`relative py-20 lg:py-32 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-6xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-300 text-sm text-purple-600 mb-8 hover:scale-105 transition-transform duration-300 cursor-pointer group shadow-lg">
                <Zap className="w-4 h-4 group-hover:animate-pulse" />
                <span>Powered by Advanced AI Agents</span>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
              </div>
              
              {/* Main Headline */}
              <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-gray-900 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                  Create Websites
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-500 to-gray-900 bg-clip-text text-transparent">
                  with Your Voice
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl lg:text-2xl text-gray-700 max-w-4xl mx-auto mb-12 leading-relaxed">
                Transform your ideas into{' '}
                <span className="text-purple-600 font-semibold">professional websites</span>{' '}
                using natural language voice commands. Our AI agents understand what you want and build it instantly.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
                <Link 
                  href="/auth/register" 
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <UserPlus className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="relative z-10">Start Creating Free</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                
                <Link 
                  href="/create" 
                  className="group px-8 py-4 bg-white/80 backdrop-blur-sm border border-gray-300 text-gray-700 font-semibold text-lg rounded-2xl hover:bg-white hover:border-purple-400 hover:text-purple-600 transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 shadow-lg"
                >
                  <Play className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  <span>Watch Demo</span>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                {[
                  { number: "50K+", label: "Websites Created", icon: Globe },
                  { number: "3 mins", label: "Average Build Time", icon: Zap },
                  { number: "99.8%", label: "Uptime Guarantee", icon: CheckCircle }
                ].map((stat, index) => (
                  <div 
                    key={index} 
                    className="group p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-purple-300 hover:bg-white transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <stat.icon className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <div className="text-3xl font-bold text-purple-600 mb-2">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Everything you need to create professional websites with just your voice
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="group relative p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-purple-300 transition-all duration-500 hover:scale-105 hover:-translate-y-2 shadow-lg"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: isVisible ? 'slideInUp 0.6s ease-out forwards' : 'none'
                  }}
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Icon */}
                  <div className={`relative w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    {feature.icon}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-300`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 text-center text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 lg:py-32 relative">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Three simple steps to your perfect website
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <div key={index} className="relative mb-16 last:mb-0">
                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute left-1/2 top-32 w-px h-24 bg-gradient-to-b from-purple-500 to-transparent opacity-30" />
                  )}
                  
                  <div className={`flex flex-col lg:flex-row items-center gap-8 ${
                    index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}>
                    {/* Content */}
                    <div className="flex-1 text-center lg:text-left">
                      <div className="inline-flex items-center space-x-3 mb-4">
                        <span className="text-6xl font-bold text-purple-500/20">{step.number}</span>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                          {step.icon}
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold mb-4 text-gray-900">{step.title}</h3>
                      <p className="text-xl text-gray-700 leading-relaxed max-w-md mx-auto lg:mx-0">
                        {step.description}
                      </p>
                    </div>

                    {/* Visual */}
                    <div className="flex-1 relative">
                      <div className="w-64 h-64 mx-auto rounded-3xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 flex items-center justify-center group hover:scale-105 transition-all duration-300 shadow-lg">
                        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <div className="text-6xl text-purple-600">{step.icon}</div>
                        </div>
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">
                What Users Say
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Join thousands of satisfied users who've built amazing websites
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index} 
                  className="group relative p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-purple-300 transition-all duration-500 hover:scale-105 hover:-translate-y-2 shadow-lg"
                >
                  {/* Stars */}
                  <div className="flex justify-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="w-5 h-5 text-purple-500 fill-current"
                        style={{
                          animationDelay: `${i * 100}ms`,
                          animation: 'sparkle 2s ease-in-out infinite'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <blockquote className="text-lg text-gray-700 italic mb-6 text-center leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  {/* Author */}
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="relative max-w-4xl mx-auto p-12 lg:p-16 rounded-3xl bg-white/80 backdrop-blur-sm border border-gray-200 text-center overflow-hidden shadow-lg">
              {/* Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl" />
              
              <div className="relative z-10">
                <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">
                  Ready to Start Creating?
                </h2>
                <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-8 leading-relaxed">
                  Join the future of website creation. Build professional websites with just your voice.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Link 
                    href="/auth/register" 
                    className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <UserPlus className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="relative z-10">Create Your Account</span>
                    <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                  
                  <Link 
                    href="/auth/login" 
                    className="group px-8 py-4 bg-white/80 backdrop-blur-sm border border-gray-300 text-gray-700 font-semibold text-lg rounded-2xl hover:bg-white hover:border-purple-400 hover:text-purple-600 transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 shadow-lg"
                  >
                    <LogIn className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    <span>Sign In</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-600">
                &copy; 2024 VoiceWeb. All rights reserved.
              </span>
            </div>
            
            <div className="flex items-center space-x-8 text-sm">
              {['Privacy Policy', 'Terms of Service', 'Support'].map((link, index) => (
                <Link 
                  key={index}
                  href="#" 
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-300 hover:underline"
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}