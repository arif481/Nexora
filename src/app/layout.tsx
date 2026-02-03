import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'Nexora - AI Life Operating System',
    template: '%s | Nexora',
  },
  description:
    'Nexora is your intelligent AI-powered personal assistant that helps you manage tasks, calendar, notes, habits, wellness, and more. Replace scattered apps with one unified life operating system.',
  keywords: [
    'AI assistant',
    'productivity',
    'task management',
    'calendar',
    'notes',
    'habits',
    'wellness',
    'personal assistant',
    'life management',
  ],
  authors: [{ name: 'Nexora Team' }],
  creator: 'Nexora',
  publisher: 'Nexora',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nexora.app',
    siteName: 'Nexora',
    title: 'Nexora - AI Life Operating System',
    description:
      'Your intelligent AI-powered personal assistant for managing every aspect of your life.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nexora - AI Life Operating System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexora - AI Life Operating System',
    description:
      'Your intelligent AI-powered personal assistant for managing every aspect of your life.',
    images: ['/og-image.png'],
    creator: '@nexora_app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
