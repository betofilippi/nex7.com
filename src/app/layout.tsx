import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { AccessibilityProvider, SkipLink } from '../components/accessibility/AccessibilityProvider'
import { Toaster } from '../components/ui/toaster'
import PerformanceMonitor from '../components/performance/PerformanceMonitor'
import { generateSEOMetadata, generateStructuredData } from '../components/seo/SEOMetadata'

export const metadata: Metadata = generateSEOMetadata({
  title: 'NEX7 - Next.js Performance-Optimized Application',
  description: 'A modern Next.js application built with TypeScript, Tailwind CSS, and advanced performance optimizations including React optimizations, bundle splitting, and Web Vitals monitoring.',
  keywords: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Performance', 'Web Vitals', 'Accessibility', 'SEO'],
})

const structuredData = generateStructuredData({
  title: 'NEX7',
  description: 'A modern Next.js application built with TypeScript, Tailwind CSS, and advanced performance optimizations.',
  url: process.env.NEXT_PUBLIC_BASE_URL || 'https://nex7.com',
  siteName: 'NEX7',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://api.github.com" />
        <link rel="dns-prefetch" href="https://api.vercel.com" />
        
        {/* Structured data */}
        {structuredData.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        
        {/* Performance hints */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SkipLink href="#main-content">
          Skip to main content
        </SkipLink>
        
        <AccessibilityProvider>
          <AuthProvider>
            <main id="main-content" className="relative">
              {children}
            </main>
            <Toaster />
            {process.env.NODE_ENV === 'development' && (
              <PerformanceMonitor showInProduction={false} />
            )}
          </AuthProvider>
        </AccessibilityProvider>
        
        {/* Global CSS custom properties for accessibility */}
        <style jsx global>{`
          :root {
            --base-font-size: 16px;
            --animation-duration: 0.2s;
            --transition-duration: 0.15s;
          }
          
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }
          
          .focus-visible *:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }
          
          .high-contrast {
            filter: contrast(1.5);
          }
          
          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }
          
          @media (prefers-contrast: high) {
            :root {
              --contrast-multiplier: 1.5;
            }
          }
          
          /* Print styles */
          @media print {
            .no-print {
              display: none !important;
            }
            
            body {
              font-size: 12pt;
              line-height: 1.4;
              color: black;
              background: white;
            }
          }
        `}</style>
      </body>
    </html>
  )
}