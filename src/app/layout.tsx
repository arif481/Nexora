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
  metadataBase: new URL('https://iamarif.me/Nexora'),
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
  manifest: '/Nexora/manifest.json',
  icons: {
    icon: [
      { url: '/Nexora/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/Nexora/apple-touch-icon.svg',
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
  // Script to apply theme before page renders to prevent flash
  const themeScript = `
    (function() {
      try {
        const savedTheme = localStorage.getItem('nexora-theme') || 'dark';
        document.documentElement.classList.remove('light', 'dark');
        if (savedTheme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
        } else {
          document.documentElement.classList.add(savedTheme);
        }
      } catch (e) {
        document.documentElement.classList.add('dark');
      }
    })();
  `;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
