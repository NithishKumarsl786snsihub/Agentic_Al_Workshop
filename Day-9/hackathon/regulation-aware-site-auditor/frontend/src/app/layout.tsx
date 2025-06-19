import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Compliance Auditor | Professional Website Analysis",
  description: "Advanced AI-powered website compliance analysis for GDPR, WCAG, ADA, SEO, and Security standards. Professional-grade insights for modern businesses.",
  keywords: ["ai compliance", "GDPR audit", "accessibility analysis", "WCAG audit", "ADA compliance", "SEO audit", "security analysis", "ai agent"],
  authors: [{ name: "AI Compliance Auditor Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#6366f1",
  openGraph: {
    title: "AI Compliance Auditor | Professional Website Analysis",
    description: "Advanced AI-powered compliance analysis for modern businesses",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AI Compliance Auditor - Professional Website Analysis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Compliance Auditor",
    description: "Advanced AI-powered compliance analysis",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-x-hidden`}
      >
        <div className="relative min-h-screen">
          {/* Professional Grid Background */}
          <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                linear-gradient(rgba(251, 146, 60, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(251, 146, 60, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '100px 100px, 100px 100px, 50px 50px, 50px 50px',
              backgroundPosition: '0 0, 0 0, 25px 25px, 25px 25px'
            }} />
          </div>
          
          {/* Animated Background Orbs */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
            <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
          </div>
          
          {/* Subtle Floating Elements */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute w-1 h-1 bg-purple-400 rounded-full animate-float opacity-40" style={{ top: '15%', left: '10%', animationDelay: '0s' }} />
            <div className="absolute w-1 h-1 bg-orange-400 rounded-full animate-float opacity-40" style={{ top: '25%', left: '85%', animationDelay: '2s' }} />
            <div className="absolute w-1 h-1 bg-indigo-400 rounded-full animate-float opacity-40" style={{ top: '65%', left: '20%', animationDelay: '4s' }} />
            <div className="absolute w-1 h-1 bg-orange-300 rounded-full animate-float opacity-40" style={{ top: '85%', left: '75%', animationDelay: '1s' }} />
            <div className="absolute w-1 h-1 bg-purple-300 rounded-full animate-float opacity-40" style={{ top: '45%', left: '90%', animationDelay: '3s' }} />
          </div>
          
          {/* Content Container with Proper Spacing */}
          <div className="relative z-10 min-h-screen">
            {children}
          </div>
        </div>
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#f1f5f9',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '16px',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(99, 102, 241, 0.1)',
              fontSize: '14px',
              fontWeight: '500',
              padding: '16px 20px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              },
            },
            loading: {
              iconTheme: {
                primary: '#6366f1',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(67, 56, 202, 0.95))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
