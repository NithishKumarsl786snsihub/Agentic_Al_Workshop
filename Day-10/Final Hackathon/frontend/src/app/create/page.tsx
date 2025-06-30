"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2, AlertCircle, Mic, X, Send, Zap, Globe, Clock, Wand2 } from "lucide-react"
import { VoiceButton } from "../../components/VoiceButton"
import { apiService } from "../../services/api"
import { useSessionStorage } from "../../hooks/useSessionStorage"
import { useAuth } from "../../contexts/AuthContext"
import { useDebounce } from "../../hooks/useDebounce"

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
  const lastVoiceTextRef = useRef("")
  const isTypingRef = useRef(false)

  // Debounce prompt for smoother voice input
  const debouncedPrompt = useDebounce(prompt, 150)

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
    // Only update if not currently typing and text has changed
    if (!isTypingRef.current && transcript !== lastVoiceTextRef.current) {
      lastVoiceTextRef.current = transcript
      setPrompt(transcript)
      setBasePrompt(transcript)
      setIsVoiceActive(false)
    }
  }

  const handleInterimTranscript = (transcript: string) => {
    // Only show interim if not currently typing
    if (!isTypingRef.current && transcript !== lastVoiceTextRef.current) {
      setPrompt(transcript)
      setIsVoiceActive(true)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    
    // Set typing flag to prevent voice conflicts
    isTypingRef.current = true
    
    setPrompt(newValue)
    setBasePrompt(newValue)
    
    // Clear typing flag after a short delay
    setTimeout(() => {
      isTypingRef.current = false
    }, 500)
    
    // Reset voice active state when user types
    if (isVoiceActive) {
      setIsVoiceActive(false)
    }
  }

  const handleGenerate = async () => {
    const finalPrompt = prompt.trim() || debouncedPrompt.trim()
    if (!finalPrompt) {
      setError("Please enter a prompt or use voice input")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await apiService.generateWebsite({
        prompt: finalPrompt,
      })

      if (response.success) {
        const sessionData = {
          sessionId: response.session_id,
          prompt: finalPrompt,
          htmlContent: response.html_content,
          timestamp: Date.now(),
          history: [
            {
              action: "generate",
              timestamp: Date.now(),
              htmlContent: response.html_content,
              prompt: finalPrompt,
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
            final_prompt: finalPrompt,
            session_id: response.session_id,
            metadata: {
              timestamp: Date.now(),
              action: "generate_website",
              response_filename: response.filename || null,
              user_agent: navigator.userAgent,
              prompt_length: finalPrompt.length,
              word_count: finalPrompt.split(' ').length
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

  // Removed Enter key generation - only generate button should work

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
      description: "Personal portfolio landing page",
      icon: "🎨",
      prompt: "Design a personal portfolio landing page with a hero introduction, short about section, project highlights, and contact info."
    },
    {
      title: "Startup Landing",
      description: "Tech startup landing page",
      icon: "🚀",
      prompt: "Create a clean landing page for a tech startup with a headline, feature highlights, short about section, and a call-to-action button."
    },
    {
      title: "Restaurant Site",
      description: "Restaurant landing page with menu preview",
      icon: "🍽️",
      prompt: "Generate a landing page for a restaurant that includes a welcome section, cuisine highlight, sample menu items, and contact details."
    },
    {
      title: "Blog Homepage",
      description: "Landing page for a modern blog",
      icon: "📝",
      prompt: "Design a blog landing page with a featured articles section, short author intro, and links to categories or recent posts."
    },
    {
      title: "E-commerce Store",
      description: "Product-focused landing page",
      icon: "🛍️",
      prompt: "Create an e-commerce landing page that includes a product showcase, key benefits, pricing overview, and a call-to-action."
    },
    {
      title: "Agency Site",
      description: "Creative agency landing page",
      icon: "💼",
      prompt: "Build a landing page for a creative agency with an intro section, service highlights, client list or logos, and contact info."
    }
  ]
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Modal Overlay - Transparent */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-20">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md mx-4 text-center shadow-2xl border border-gray-200">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Generating Your Website</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Our AI is crafting your website with attention to detail...
            </p>
            <div className="bg-gray-100 rounded-lg p-3 sm:p-4 border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-700 truncate">"{debouncedPrompt || prompt}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Content - Responsive Popup Style */}
      <div className="relative z-10 w-full max-w-7xl h-[95vh] sm:h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-gray-200">
        
        {/* Close Button */}
        <button
          onClick={handleCloseModal}
          className="absolute top-3 right-3 sm:top-6 sm:right-6 z-30 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all duration-300 border border-gray-200"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Left Side - Chat Input */}
        <div className="w-full lg:w-[70%] p-4 sm:p-6 lg:p-8 flex flex-col bg-white overflow-y-auto">
          
                      {/* Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Create Your Website</h1>
                  <p className="text-gray-600 text-xs sm:text-sm truncate">Hey {user?.username || 'there'}! Describe your dream website</p>
                </div>
              </div>
              
              {/* Feature Pills - Responsive */}
              <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-purple-50 rounded-full border border-purple-200">
                  <Zap className="w-3 h-3 text-purple-600" />
                  <span className="text-purple-700 font-medium">AI-Powered</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-purple-50 rounded-full border border-purple-200">
                  <Mic className="w-3 h-3 text-purple-600" />
                  <span className="text-purple-700 font-medium hidden sm:inline">Voice Control</span>
                  <span className="text-purple-700 font-medium sm:hidden">Voice</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-purple-50 rounded-full border border-purple-200">
                  <Globe className="w-3 h-3 text-purple-600" />
                  <span className="text-purple-700 font-medium">Responsive</span>
                </div>
              </div>
            </div>

                      {/* Chat Input Area */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="relative flex-1 mb-3 sm:mb-4 min-h-[200px] sm:min-h-[250px]">
                <textarea
                  value={prompt}
                  onChange={handleTextChange}
                  placeholder="Describe your website in detail... 

Example: 'Create a modern portfolio website with dark theme, smooth animations, hero section with my photo, about me section, skills showcase with progress bars, project gallery, and contact form with social links'

🎙️ Voice Tip: Click the microphone to start speaking. You can pause for up to 10 seconds and resume - your text will be preserved! You can also type while voice is listening for seamless editing!
💡 Generate Tip: Press the Generate button below when you're ready to create your website!"
                  className={`w-full h-full p-4 sm:p-6 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl text-gray-900 placeholder-gray-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 ease-in-out ${
                    isVoiceActive ? 'ring-2 ring-purple-500 border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg' : 'hover:bg-gray-100'
                  }`}
                  disabled={isGenerating}
                  title={isVoiceActive ? "Voice is listening - you can still type to edit!" : "Type your website description or use voice input"}
                />
                
                {/* Voice Button Overlay */}
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
                  <VoiceButton
                    onTranscript={handleVoiceTranscript}
                    onInterimTranscript={handleInterimTranscript}
                    size="sm"
                    disabled={isGenerating}
                    currentText={debouncedPrompt}
                  />
                </div>

                {/* Hybrid Input Indicator - Smooth transition */}
                <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full border border-purple-200 shadow-sm transition-all duration-300 ${
                  isVoiceActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-700 font-medium">Voice Active</span>
                </div>
              </div>

              {/* Generate Button - Positioned right below input */}
              <div className="mb-3 sm:mb-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!prompt.trim() && !debouncedPrompt.trim())}
                  className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Generate Website</span>
                    </>
                  )}
                </button>
                
                {/* Helper text below button */}
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">
                    {(prompt.trim() || debouncedPrompt.trim()) ? (
                      <span className="text-green-600 font-medium">✓ Ready to generate</span>
                    ) : (
                      <span>Enter your website description above to get started</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 text-red-500" />
                    <div>
                      <p className="font-medium text-red-700 text-xs sm:text-sm">Error</p>
                      <p className="text-red-600 text-xs sm:text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* Right Side - Examples - Hidden on mobile, visible on large screens */}
        <div className="hidden lg:flex lg:w-[30%] bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-200 p-4 xl:p-6 flex-col overflow-y-auto">
          
          {/* Examples Header */}
          <div className="mb-4 xl:mb-6">
            <h3 className="text-base xl:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Wand2 className="w-4 h-4 xl:w-5 xl:h-5 text-purple-600" />
              Quick Examples
            </h3>
            <p className="text-gray-600 text-xs xl:text-sm">Click any example to get started instantly</p>
          </div>

          {/* Examples List */}
          <div className="space-y-2 xl:space-y-3 flex-1">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example.prompt)}
                disabled={isGenerating}
                className="w-full text-left p-3 xl:p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg xl:rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-2 xl:gap-3">
                  <span className="text-lg xl:text-2xl">{example.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-xs xl:text-sm mb-1 group-hover:text-purple-600 transition-colors">
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
          <div className="mt-4 xl:mt-8 p-3 xl:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg xl:rounded-xl border border-purple-200">
            <h4 className="font-semibold text-gray-900 text-xs xl:text-sm mb-2 xl:mb-3 flex items-center gap-2">
              <Sparkles className="w-3 h-3 xl:w-4 xl:h-4 text-purple-600" />
              Pro Tips
            </h4>
            <div className="space-y-1 xl:space-y-2 text-xs text-gray-700">
              <div>• Be specific about colors, layout, and features</div>
              <div>• Mention the type of business or purpose</div>
              <div>• Include desired sections and functionality</div>
              <div>• 🎙️ Voice + Type: Mix speech and typing seamlessly!</div>
            </div>
          </div>

          {/* User Info */}
          <div className="mt-4 xl:mt-6 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-xs font-medium truncate">{user?.username || 'User'}</p>
                <p className="text-gray-600 text-xs capitalize">{user?.subscription_tier || 'Free'} Plan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Examples - Show as expandable section on mobile */}
        <div className="lg:hidden border-t border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="p-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-gray-900 text-sm">Quick Examples</span>
                </div>
                <div className="transform group-open:rotate-180 transition-transform duration-200">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              
              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                {examples.slice(0, 4).map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example.prompt)}
                    disabled={isGenerating}
                    className="w-full text-left p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{example.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm mb-1 group-hover:text-purple-600 transition-colors">
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
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}
