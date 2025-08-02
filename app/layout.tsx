import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Ember - Your AI Companion for Mental Wellness",
  description:
    "Get personalized mental health support with Ember, your AI companion. Available 24/7 for emotional support, insights, and guidance.",
  keywords: ["AI mental health", "emotional support", "AI companion", "wellness", "therapy", "mental health app"],
  authors: [{ name: "Ember Team" }],
  openGraph: {
    title: "Ember - Your AI Companion for Mental Wellness",
    description:
      "Get personalized mental health support with Ember, your AI companion. Available 24/7 for emotional support, insights, and guidance.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ember - AI Mental Health Companion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ember - Your AI Companion for Mental Wellness",
    description:
      "Get personalized mental health support with Ember, your AI companion. Available 24/7 for emotional support, insights, and guidance.",
    images: ["/og-image.png"],
  },
  generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8b5cf6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
