import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { TelegramProvider } from "@/lib/telegram-provider"
import { Toaster } from "@/components/ui/toaster"
import { FeedbackProvider } from "@/lib/feedback-provider"
import { AppWagmiProvider } from "@/lib/wagmi-provider"
import { GuestModeProvider } from "@/lib/guest-mode"
import { ErrorBoundary } from "@/components/error-boundary"
import { ErrorSuppressionScript } from "@/components/error-suppression-script"

const inter = Inter({ subsets: ["latin"] })

const getSafeMetadataBase = () => {
  try {
    const raw = process.env.NEXT_PUBLIC_PUBLIC_BASE_URL
    if (typeof raw === 'string' && /^https?:\/\//i.test(raw.trim())) {
      return new URL(raw.trim())
    }
  } catch {}
  return new URL('http://localhost:3003')
}

export const metadata = {
  title: "Compound Finance",
  description: "DeFi lending and borrowing on Telegram",
    generator: 'v0.dev',
  // Ensure absolute URLs in metadata (fixes OG/Twitter in tunnels)
  metadataBase: getSafeMetadataBase(),
  icons: {
    icon: "/complogo.png",
    shortcut: "/complogo.png",
    apple: "/complogo.png",
  },
  openGraph: {
    title: "Compound Finance",
    description: "DeFi lending and borrowing on Telegram",
    images: [
      { url: "/complogo.png", width: 512, height: 512, alt: "Compound" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* Telegram Mini Apps WebApp SDK */}
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <ErrorSuppressionScript />
          <AppWagmiProvider>
            <GuestModeProvider>
              <TelegramProvider>
                <FeedbackProvider>
                  {children}
                  <Toaster />
                </FeedbackProvider>
              </TelegramProvider>
            </GuestModeProvider>
          </AppWagmiProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
