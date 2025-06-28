"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2, AlertCircle, Mic, X, Send, Zap, Globe, Clock, Wand2 } from "lucide-react"
import { VoiceButton } from "../../components/VoiceButton"
import { apiService } from "../../services/api"
import { useSessionStorage } from "../../hooks/useSessionStorage"
import { useAuth } from "../../contexts/AuthContext"

interface CreatePageProps {
  onClose?: () => void;
}

export default function CreatePage({ onClose }: CreatePageProps = {}) {
  const router = useRouter()
  const { saveSession } = useSessionStorage()
  const { user } = useAuth()

  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [basePrompt, setBasePrompt] = useState("")

  // Prevent background scrolling when modal is open
  useEffect(() => {
    // Add overflow hidden to body when modal opens
    document.body.style.overflow = 'hidden'
    
    // Cleanup function to restore scrolling when modal closes
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    // Redirect if no user
    if (!user) {
      router.push('/auth/login')
      return
    }
  }, [user, router])

  const handleVoiceTranscript = (transcript: string) => {
    const finalText = basePrompt + transcript
    setPrompt(finalText)
    setBasePrompt(finalText)
    setIsVoiceActive(false)
  }

  const handleInterimTranscript = (transcript: string) => {
    setPrompt(basePrompt + transcript)
    setIsVoiceActive(true)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setPrompt(newValue)
    if (!isVoiceActive) {
      setBasePrompt(newValue)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt or use voice input")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await apiService.generateWebsite({
        prompt: prompt.trim(),
      })

      if (response.success) {
        const sessionData = {
          sessionId: response.session_id,
          prompt: prompt.trim(),
          htmlContent: response.html_content,
          timestamp: Date.now(),
          history: [
            {
              action: "generate",
              timestamp: Date.now(),
              htmlContent: response.html_content,
              prompt: prompt.trim(),
            },
          ],
        }

        saveSession(sessionData)

        // Save conversation to database (vivvie_conversations)
        try {
          const token = localStorage.getItem('access_token');
          console.log('🔐 Token available for conversation save:', !!token);
          console.log('👤 Current user:', user?.id, user?.email);
          
          const conversationResult = await apiService.saveConversation({
            final_prompt: prompt.trim(),
            session_id: response.session_id,
            metadata: {
              timestamp: Date.now(),
              action: "generate_website",
              response_filename: response.filename || null,
              user_agent: navigator.userAgent,
              prompt_length: prompt.trim().length,
              word_count: prompt.trim().split(' ').length
            }
          })
          console.log("✅ Conversation saved to database:", conversationResult)
        } catch (convError: any) {
          console.error("❌ Failed to save conversation:", convError)
          console.error("Error details:", {
            message: convError.message,
            status: convError.status,
            token_available: !!localStorage.getItem('access_token'),
            user_authenticated: !!user
          })
          // Don't block the user flow if conversation saving fails
        }

        setTimeout(() => {
          router.push("/editor")
        }, 100)
      } else {
        setError(response.message || "Failed to generate website")
      }
    } catch (err: any) {
      console.error("Generation error:", err)
      setError(err.message || "Failed to generate website. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  const handleExampleClick = (exampleText: string) => {
    setPrompt(exampleText)
    setBasePrompt(exampleText)
  }

  const handleCloseModal = () => {
    if (onClose) {
      onClose()
    } else {
      router.push("/dashboard")
    }
  }

  // Handle click outside modal to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal()
    }
  }

  const examples = [
    {
      title: "Portfolio Website",
      description: "Modern portfolio with dark theme and animations",
      icon: "🎨",
      prompt: "Create a modern portfolio website with dark theme, smooth animations, hero section, about me, skills showcase, and contact form"
    },
    {
      title: "Startup Landing",
      description: "Tech startup landing page with features",
      icon: "🚀",
      prompt: "Build a landing page for a tech startup with hero section, features grid, testimonials, pricing table, and call-to-action buttons"
    },
    {
      title: "Restaurant Site",
      description: "Restaurant website with menu and booking",
      icon: "🍽️",
      prompt: "Make a restaurant website with elegant design, menu showcase, photo gallery, reservation form, and contact information"
    },
    {
      title: "Blog Homepage",
      description: "Modern blog layout with article cards",
      icon: "📝",
      prompt: "Design a blog homepage with modern layout, featured articles, categories sidebar, author bio, and newsletter signup"
    },
    {
      title: "E-commerce Store",
      description: "Online store with product catalog",
      icon: "🛍️",
      prompt: "Create an e-commerce website with product grid, shopping cart, product details page, and checkout process"
    },
    {
      title: "Agency Site",
      description: "Creative agency with services showcase",
      icon: "💼",
      prompt: "Build a creative agency website with portfolio gallery, services section, team members, and project case studies"
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modal Overlay - Transparent */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-20">
          <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl border border-gray-200">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Generating Your Website</h3>
            <p className="text-gray-600 mb-6">
              Our AI is crafting your website with attention to detail...
            </p>
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700 truncate">"{prompt}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Content - Popup Style */}
      <div className="relative z-10 w-full max-w-6xl max-h-[85vh] bg-white rounded-3xl shadow-2xl flex overflow-hidden border border-gray-200">
        
        {/* Close Button */}
        <button
          onClick={handleCloseModal}
          className="absolute top-6 right-6 z-30 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all duration-300 border border-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side - Chat Input (70%) */}
        <div className="w-[70%] p-8 flex flex-col bg-white">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Your Website</h1>
                <p className="text-gray-600 text-sm">Hey {user?.username || 'there'}! Describe your dream website</p>
              </div>
            </div>
            
            {/* Feature Pills */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-200">
                <Zap className="w-3 h-3 text-purple-600" />
                <span className="text-purple-700 font-medium">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-200">
                <Mic className="w-3 h-3 text-purple-600" />
                <span className="text-purple-700 font-medium">Voice Control</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-200">
                <Globe className="w-3 h-3 text-purple-600" />
                <span className="text-purple-700 font-medium">Responsive</span>
              </div>
            </div>
          </div>

          {/* Chat Input Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="relative flex-1 mb-6">
              <textarea
                value={prompt}
                onChange={handleTextChange}
                onKeyPress={handleKeyPress}
                placeholder="Describe your website in detail... 

Example: 'Create a modern portfolio website with dark theme, smooth animations, hero section with my photo, about me section, skills showcase with progress bars, project gallery, and contact form with social links'"
                className={`w-full h-full p-6 bg-gray-50 border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ${
                  isVoiceActive ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-50' : ''
                }`}
                disabled={isGenerating}
                rows={12}
              />
              
              {/* Voice Button Overlay */}
              <div className="absolute bottom-4 right-4">
                <VoiceButton
                  onTranscript={handleVoiceTranscript}
                  onInterimTranscript={handleInterimTranscript}
                  size="md"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-700 text-sm">Error</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Website...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Generate Website
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side - Examples (30%) */}
        <div className="w-[30%] bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-200 p-6 overflow-y-auto">
          
          {/* Examples Header */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              Quick Examples
            </h3>
            <p className="text-gray-600 text-sm">Click any example to get started instantly</p>
          </div>

          {/* Examples List */}
          <div className="space-y-3">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example.prompt)}
                disabled={isGenerating}
                className="w-full text-left p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{example.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-purple-600 transition-colors">
                      {example.title}
                    </h4>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      {example.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Pro Tips */}
          <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Pro Tips
            </h4>
            <div className="space-y-2 text-xs text-gray-700">
              <div>• Be specific about colors, layout, and features</div>
              <div>• Mention the type of business or purpose</div>
              <div>• Include desired sections and functionality</div>
              <div>• Use voice for natural descriptions</div>
            </div>
          </div>

          {/* User Info */}
          <div className="mt-6 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-xs font-medium truncate">{user?.username || 'User'}</p>
                <p className="text-gray-600 text-xs capitalize">{user?.subscription_tier || 'Free'} Plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
