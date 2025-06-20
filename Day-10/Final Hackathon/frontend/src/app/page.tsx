'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { VoiceButton } from '../components/VoiceButton';
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
      <header className="p-6 border-b border-[var(--color-forest)]">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-axiforma-semibold text-3xl lg:text-4xl text-[var(--color-text)] flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-[var(--color-voice)]" />
            Voice Website Generator
          </h1>
          <p className="font-axiforma-regular text-[var(--color-muted)] mt-2 text-lg">
            Generate complete websites using AI and voice commands
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Introduction Card */}
          <div className="card mb-8">
            <h2 className="font-axiforma-semibold text-2xl text-[var(--color-text)] mb-4">
              🎤 Create Your Website
            </h2>
            <p className="font-axiforma-regular text-[var(--color-muted)] mb-6 leading-relaxed">
              Describe your dream website using voice or text. Our AI will generate a complete, 
              responsive website that you can then edit with voice commands in real-time.
            </p>

            {/* Input Section */}
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={handleTextChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your website... (e.g., 'Create a modern portfolio website with dark theme and animations')"
                  className={`input-field w-full h-32 resize-none font-axiforma-medium ${
                    isVoiceActive ? 'ring-2 ring-[var(--color-voice)]/50 bg-[var(--color-voice)]/5' : ''
                  }`}
                  disabled={isGenerating}
                  ref={promptRef}
                />
                
                {/* Voice Button */}
                <div className="absolute bottom-4 right-4">
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
                className="btn-primary w-full py-4 font-axiforma-medium text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-axiforma-medium text-red-400">Error</p>
                  <p className="font-axiforma-regular text-red-300 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Examples */}
          <div className="text-center">
            <h3 className="font-axiforma-semibold text-lg text-[var(--color-text)] mb-4">
              ✨ Try These Examples
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  className="p-3 bg-[var(--color-bg-alt)] hover:bg-[var(--color-pine)] border border-[var(--color-forest)] rounded-lg text-left font-axiforma-regular text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-[var(--color-forest)]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-axiforma-regular text-[var(--color-muted)] text-sm">
            Powered by Gemini AI • Voice-controlled editing • Real-time preview
          </p>
        </div>
      </footer>
    </div>
  );
}
