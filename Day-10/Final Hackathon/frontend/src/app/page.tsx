"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2, AlertCircle, Zap, Wand2, Palette } from "lucide-react"
import { VoiceButton } from "../components/VoiceButton"
import { apiService } from "../services/api"
import { useSessionStorage } from "../hooks/useSessionStorage"

export default function HomePage() {
  const router = useRouter()
  const { saveSession } = useSessionStorage()

  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [basePrompt, setBasePrompt] = useState("")
  const promptRef = React.useRef<HTMLTextAreaElement>(null)

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

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[var(--color-voice)]/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[var(--color-accent-hover)]/5 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Loading Overlay with Enhanced Animation */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center">
          <div className="bg-[var(--color-surface)] p-10 rounded-3xl border border-[var(--color-border)] max-w-md w-full mx-4 shadow-2xl backdrop-filter backdrop-blur-2xl">
            <div className="text-center">
              <div className="flex justify-center mb-6 relative">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-voice)] rounded-full blur-lg opacity-50 animate-pulse"></div>
                  <Loader2 className="w-16 h-16 text-[var(--color-accent)] animate-spin relative z-10" />
                  <Sparkles className="w-8 h-8 text-[var(--color-voice)] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
              </div>
              <h3 className="font-semibold text-2xl text-[var(--color-text)] mb-3 animate-pulse">
                Generating Your Website
              </h3>
              <p className="font-medium text-[var(--color-muted)] mb-6 leading-relaxed">
                Our AI is crafting your website with attention to detail...
              </p>
              <div className="bg-[var(--color-bg-alt)] rounded-xl p-4 border border-[var(--color-border)] backdrop-filter backdrop-blur-lg">
                <p className="font-medium text-sm text-[var(--color-text)] truncate">"{prompt}"</p>
              </div>
              {/* Progress Animation */}
              <div className="mt-6 w-full bg-[var(--color-bg-alt)] rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-voice)] rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with Enhanced Glassmorphism */}
      <header className="relative p-8 border-b border-[var(--color-border)] bg-[var(--color-surface)] backdrop-filter backdrop-blur-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/5 to-[var(--color-voice)]/5"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-6 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-voice)] to-[var(--color-accent-hover)] rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-br from-[var(--color-voice)] to-[var(--color-accent-hover)] p-4 rounded-2xl">
                <Sparkles className="w-8 h-8 text-[var(--color-bg)] animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="font-semibold text-4xl lg:text-5xl text-[var(--color-text)] mb-2 bg-gradient-to-r from-[var(--color-text)] to-[var(--color-accent-hover)] bg-clip-text">
                Voice Website Generator
              </h1>
              <div className="flex items-center gap-3 text-[var(--color-muted)]">
                <Zap className="w-5 h-5 text-[var(--color-voice)]" />
                <span className="font-medium">AI-Powered</span>
                <div className="w-1 h-1 bg-[var(--color-muted)] rounded-full"></div>
                <Wand2 className="w-5 h-5 text-[var(--color-accent)]" />
                <span className="font-medium">Voice Controlled</span>
                <div className="w-1 h-1 bg-[var(--color-muted)] rounded-full"></div>
                <Palette className="w-5 h-5 text-[var(--color-accent-hover)]" />
                <span className="font-medium">Professional Design</span>
              </div>
            </div>
          </div>
          <p className="font-medium text-[var(--color-muted)] text-lg leading-relaxed">
            Generate complete websites using AI and voice commands with professional design
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-4xl">
          {/* Main Creation Card */}
          <div className="relative mb-8 group">
            {/* Card Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-voice)] to-[var(--color-accent-hover)] rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>

            <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-10 backdrop-filter backdrop-blur-2xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/5 via-transparent to-[var(--color-voice)]/5 rounded-3xl"></div>

              <div className="relative z-10">
                <h2 className="font-semibold text-3xl text-[var(--color-text)] mb-6 text-center">
                  Create Your Website
                </h2>
                <p className="font-medium text-[var(--color-muted)] mb-8 leading-relaxed text-lg text-center max-w-2xl mx-auto">
                  Describe your dream website using voice or text. Our AI will generate a complete, responsive website
                  that you can then edit with voice commands in real-time.
                </p>

                {/* Input Section */}
                <div className="space-y-6">
                  <div className="relative group">
                    <div
                      className={`absolute -inset-1 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-voice)] rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${isVoiceActive ? "opacity-50 animate-pulse" : ""}`}
                    ></div>

                    <textarea
                      value={prompt}
                      onChange={handleTextChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Describe your website... (e.g., 'Create a modern portfolio website with dark theme and animations')"
                      className={`relative w-full h-40 resize-none font-medium text-base leading-relaxed bg-[var(--color-bg-alt)] border border-[var(--color-border)] rounded-2xl p-6 text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all duration-300 backdrop-filter backdrop-blur-lg ${
                        isVoiceActive
                          ? "border-[var(--color-voice)] bg-gradient-to-br from-[var(--color-voice)]/10 to-transparent shadow-lg shadow-[var(--color-voice)]/20"
                          : ""
                      }`}
                      disabled={isGenerating}
                      ref={promptRef}
                    />

                    {/* Voice Button with Enhanced Design */}
                    <div className="absolute bottom-6 right-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-voice)] to-[var(--color-accent-hover)] rounded-full blur-lg opacity-50"></div>
                        <VoiceButton
                          onTranscript={handleVoiceTranscript}
                          onInterimTranscript={handleInterimTranscript}
                          size="md"
                          disabled={isGenerating}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Generate Button with Enhanced Animation */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-voice)] to-[var(--color-accent-hover)] rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>

                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="relative w-full py-6 font-semibold text-lg flex items-center justify-center gap-4 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] text-[var(--color-text)] rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-[var(--color-accent)]/25 hover:scale-[1.02] active:scale-[0.98] backdrop-filter backdrop-blur-lg"
                    >
                      {isGenerating ? (
                        <>
                          <div className="relative">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <div className="absolute inset-0 bg-[var(--color-voice)] rounded-full blur-sm opacity-50 animate-pulse"></div>
                          </div>
                          Generating Website...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6 animate-pulse" />
                          Generate Website
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message with Enhanced Design */}
                {error && (
                  <div className="mt-6 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl blur opacity-20"></div>
                    <div className="relative p-6 bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl flex items-start gap-4 backdrop-filter backdrop-blur-lg">
                      <div className="relative">
                        <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="absolute inset-0 bg-red-400 rounded-full blur-sm opacity-30 animate-pulse"></div>
                      </div>
                      <div>
                        <p className="font-semibold text-red-400 text-lg">Error</p>
                        <p className="font-medium text-red-300 text-sm mt-2">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Examples Section with Enhanced Cards */}
          <div className="text-center">
            <h3 className="font-semibold text-2xl text-[var(--color-text)] mb-8 flex items-center justify-center gap-3">
              <Wand2 className="w-6 h-6 text-[var(--color-accent-hover)]" />
              Try These Examples
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { text: "Create a modern portfolio website with dark theme", icon: "🎨" },
                { text: "Build a landing page for a tech startup with animations", icon: "🚀" },
                { text: "Make a restaurant website with menu and contact form", icon: "🍽️" },
                { text: "Design a blog homepage with modern layout", icon: "📝" },
              ].map((example, index) => (
                <div key={index} className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-accent)]/30 to-[var(--color-voice)]/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <button
                    onClick={() => setPrompt(example.text)}
                    disabled={isGenerating}
                    className="relative w-full p-6 bg-[var(--color-surface)] hover:bg-[var(--color-glass)] border border-[var(--color-border)] rounded-2xl text-left font-medium text-sm text-[var(--color-text)] hover:text-[var(--color-accent-hover)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-filter backdrop-blur-lg hover:scale-[1.02] hover:shadow-xl group"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">{example.icon}</span>
                      <span className="flex-1">{example.text}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer with Enhanced Design */}
      <footer className="relative p-8 border-t border-[var(--color-border)] bg-[var(--color-surface)] backdrop-filter backdrop-blur-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/5 to-[var(--color-voice)]/5"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-6 text-[var(--color-muted)] text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[var(--color-voice)] rounded-full animate-pulse"></div>
              <span className="font-medium">Powered by Gemini AI</span>
            </div>
            <div className="w-1 h-1 bg-[var(--color-muted)] rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse"></div>
              <span className="font-medium">Voice-controlled editing</span>
            </div>
            <div className="w-1 h-1 bg-[var(--color-muted)] rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[var(--color-accent-hover)] rounded-full animate-pulse"></div>
              <span className="font-medium">Real-time preview</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
