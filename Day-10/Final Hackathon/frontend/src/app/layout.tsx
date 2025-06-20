import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Voice Website Generator - AI-Powered Web Development",
  description:
    "Generate and edit websites using voice commands powered by AI. Create professional, responsive websites with modern design and real-time editing capabilities.",
  keywords: "AI website generator, voice commands, web development, responsive design, modern UI",
  authors: [{ name: "Voice Website Generator" }],
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00d885",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head></head>
      <body
        className="font-axiforma-regular bg-[var(--color-bg)] text-[var(--color-text)] antialiased"
        suppressHydrationWarning={true}
      >
        <div className="min-h-screen relative overflow-hidden">
          {/* Global background effects */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--color-voice)] to-transparent opacity-50"></div>
          </div>
          {children}
        </div>
      </body>
    </html>
  )
}
