'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { VoiceButton } from '../components/VoiceButton';
import { ClientOnly } from '../components/ClientOnly';
import { apiService } from '../services/api';
import { useSessionStorage } from '../hooks/useSessionStorage';

export default function HomePage() {
  const router = useRouter();
  const { saveSession } = useSessionStorage();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [basePrompt, setBasePrompt] = useState('');
  const promptRef = React.useRef<HTMLTextAreaElement>(null);

  const handleVoiceTranscript = (transcript: string) => {
    // Final transcript - replace the interim part with final
    const finalText = basePrompt + transcript;
    setPrompt(finalText);
    setBasePrompt(finalText);
    setIsVoiceActive(false);
  };

  const handleInterimTranscript = (transcript: string) => {
    // Interim transcript - show real-time updates
    setPrompt(basePrompt + transcript);
    setIsVoiceActive(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setPrompt(newValue);
    if (!isVoiceActive) {
      setBasePrompt(newValue);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt or use voice input');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await apiService.generateWebsite({
        prompt: prompt.trim()
      });

      if (response.success) {
        // Save session data
        const sessionData = {
          sessionId: response.session_id,
          prompt: prompt.trim(),
          htmlContent: response.html_content,
          timestamp: Date.now(),
          history: [{
            action: 'generate',
            timestamp: Date.now(),
            htmlContent: response.html_content,
            prompt: prompt.trim()
          }]
        };

        saveSession(sessionData);

        // Small delay to ensure session is saved before navigation
        setTimeout(() => {
          // Navigate to editor page
          router.push('/editor');
        }, 100);
      } else {
        setError(response.message || 'Failed to generate website');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate website. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[var(--color-bg-alt)] p-8 rounded-2xl border border-[var(--color-forest)] max-w-md w-full mx-4">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-[var(--color-accent)] animate-spin" />
                  <Sparkles className="w-6 h-6 text-[var(--color-voice)] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              <h3 className="font-axiforma-semibold text-xl text-[var(--color-text)] mb-2">
                Generating Your Website
              </h3>
              <p className="font-axiforma-regular text-[var(--color-muted)] mb-4">
                Our AI is crafting your website with attention to detail...
              </p>
              <div className="bg-[var(--color-bg)] rounded-lg p-3">
                <p className="font-axiforma-medium text-sm text-[var(--color-text)] truncate">
                  "{prompt}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="p-8 border-b border-[var(--color-border)] bg-[var(--color-surface)] backdrop-filter backdrop-blur-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-semibold text-4xl lg:text-5xl text-[var(--color-text)] flex items-center gap-4 mb-3">
            <Sparkles className="w-10 h-10 text-[var(--color-voice)] animate-pulse" />
            Voice Website Generator
          </h1>
          <p className="font-medium text-[var(--color-muted)] text-lg leading-relaxed">
            Generate complete websites using AI and voice commands with professional design
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-3xl">
          {/* Introduction Card */}
          <div className="card mb-8">
            <h2 className="font-semibold text-3xl text-[var(--color-text)] mb-6">
              Create Your Website
            </h2>
            <p className="font-medium text-[var(--color-muted)] mb-8 leading-relaxed text-lg">
              Describe your dream website using voice or text. Our AI will generate a complete, 
              responsive website that you can then edit with voice commands in real-time.
            </p>

            {/* Input Section */}
            <div className="space-y-6">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={handleTextChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your website... (e.g., 'Create a modern portfolio website with dark theme and animations')"
                  className={`input-field w-full h-40 resize-none font-medium text-base leading-relaxed ${
                    isVoiceActive ? 'voice-input-active' : ''
                  }`}
                  disabled={isGenerating}
                  ref={promptRef}
                />
                
                {/* Voice Button */}
                <div className="absolute bottom-5 right-5">
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
                className="btn-primary w-full py-5 font-semibold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating Website...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Generate Website
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-5 bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-400 text-lg">Error</p>
                  <p className="font-medium text-red-300 text-sm mt-2">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Examples */}
          <div className="text-center">
            <h3 className="font-semibold text-xl text-[var(--color-text)] mb-6">
              Try These Examples
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Create a modern portfolio website with dark theme",
                "Build a landing page for a tech startup with animations",
                "Make a restaurant website with menu and contact form",
                "Design a blog homepage with modern layout"
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  disabled={isGenerating}
                  className="p-5 bg-[var(--color-surface)] hover:bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl text-left font-medium text-sm text-[var(--color-text)] hover:text-[var(--color-accent-hover)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-filter backdrop-blur-lg hover:scale-[1.02] hover:shadow-lg"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-[var(--color-border)] bg-[var(--color-surface)] backdrop-filter backdrop-blur-lg">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-medium text-[var(--color-muted)] text-sm">
            Powered by Gemini AI • Voice-controlled editing • Real-time preview
          </p>
        </div>
      </footer>
    </div>
  );
}
