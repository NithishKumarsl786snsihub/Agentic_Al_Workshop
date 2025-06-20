"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2, AlertCircle, Mic, Wand2 } from "lucide-react"
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

  const handleExampleClick = (exampleText: string) => {
    setPrompt(exampleText)
    setBasePrompt(exampleText)
  }

  return (
    <div className="main-container">
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <h3 className="text-title mb-4">Generating Your Website</h3>
            <p className="text-body text-[var(--color-text-secondary)] mb-6">
              Our AI is crafting your website with attention to detail...
            </p>
            <div className="p-4 bg-[var(--color-bg-alt)] rounded-lg border border-[var(--color-border)]">
              <p className="text-caption text-[var(--color-text-secondary)] truncate">"{prompt}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-headline">Voice Website Generator</h1>
              <div className="flex items-center gap-4 text-[var(--color-text-secondary)] text-caption mt-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Voice Controlled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Professional Design</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="content-wrapper">
        <div className="content-card">
          {/* Title Section */}
          <div className="text-center mb-8">
            <h2 className="text-title mb-4">Create Your Website</h2>
            <p className="text-body text-[var(--color-text-secondary)]">
              Describe your dream website using voice or text. Our AI will generate a complete, responsive website 
              that you can then edit with voice commands in real-time.
            </p>
          </div>

          {/* Input Section */}
          <div className="input-container">
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={handleTextChange}
              onKeyPress={handleKeyPress}
              placeholder="Describe your website... (e.g., 'Create a modern portfolio website with dark theme and animations')"
              className={`input-field h-32 ${isVoiceActive ? 'voice-active' : ''}`}
              disabled={isGenerating}
              rows={4}
            />
            <div className="voice-button-wrapper">
              <VoiceButton
                onTranscript={handleVoiceTranscript}
                onInterimTranscript={handleInterimTranscript}
                size="md"
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="btn btn-primary w-full mb-8"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Website...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Website
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="error-card">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Examples Section */}
          <div className="text-center">
            <h3 className="text-title mb-6 flex items-center justify-center gap-2">
              <Wand2 className="w-5 h-5 text-[var(--color-accent)]" />
              Try These Examples
            </h3>
            <div className="examples-grid">
              {[
                { text: "Create a modern portfolio website with dark theme", icon: "🎨" },
                { text: "Build a landing page for a tech startup with animations", icon: "🚀" },
                { text: "Make a restaurant website with menu and contact form", icon: "🍽️" },
                { text: "Design a blog homepage with modern layout", icon: "📝" },
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example.text)}
                  disabled={isGenerating}
                  className="example-card"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{example.icon}</span>
                    <span className="text-sm text-left flex-1">{example.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-caption">
            <div className="status-dot"></div>
            <span>Powered by Gemini AI</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-caption">
            <div className="status-dot"></div>
            <span>Voice-controlled editing</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-caption">
            <div className="status-dot"></div>
            <span>Real-time preview</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
