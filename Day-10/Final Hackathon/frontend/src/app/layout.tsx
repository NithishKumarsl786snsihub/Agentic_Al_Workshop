import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Website Generator",
  description: "Generate and edit websites using voice commands powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className="font-axiforma-regular bg-[var(--color-bg)] text-[var(--color-text)] antialiased"
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
