import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from '@/lib/auth-context'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-poppins',
  display: 'swap',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    'sans-serif',
  ],
})

const siteUrl = 'https://marian.college'
const defaultTitle = 'Marian College of Baliuag Student Portal'
const description =
  'Official Marian College of Baliuag, Inc. portal for enrollment, registrar services, grades, scholarships, and campus communications—built for students, parents, and educators.'
const keywords = [
  'Marian College of Baliuag',
  'Marian College of Baliuag Inc',
  'MCB student portal',
  'Marian College enrollment',
  'Baliuag college registrar',
  'Philippines private school portal',
  'BSIT4 AY2526',
]

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Marian College of Baliuag Digital Campus',
  title: {
    default: defaultTitle,
    template: '%s | Marian College of Baliuag',
  },
  description,
  keywords,
  category: 'education',
  authors: [{ name: 'BSIT4 AY2526' }],
  creator: 'BSIT4 AY2526',
  publisher: 'Marian College of Baliuag, Inc.',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  verification: {
    google: 'rYFwmcYPRs3d6jMPTtL25Si7sYatKKWFx1nwh27vTt0',
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    url: siteUrl,
    siteName: 'Marian College of Baliuag Student Portal',
    title: defaultTitle,
    description,
    images: [
      {
        url: `${siteUrl}/og.jpg`,
        width: 1200,
        height: 630,
        alt: 'Marian College of Baliuag digital campus experience',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description,
    images: [`${siteUrl}/og.jpg`],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/logo.png', sizes: '192x192', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.webmanifest',
  themeColor: '#0f172a',
  appleWebApp: {
    capable: true,
    title: defaultTitle,
    statusBarStyle: 'black-translucent',
  },
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollegeOrUniversity',
  name: 'Marian College of Baliuag, Inc.',
  url: siteUrl,
  logo: `${siteUrl}/og.jpg`,
  sameAs: [
    'https://www.facebook.com/MarianCollegeBaliuag',
    'https://www.linkedin.com/company/marian-college-baliuag',
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: '908 Gil Carlos St. San Jose',
    addressLocality: 'Baliuag',
    addressRegion: 'Bulacan',
    postalCode: '3006',
    addressCountry: 'PH',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Registrar',
    email: 'registrar@marian.college',
    telephone: '+63-44-766-1234',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <Script
          id="org-structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="beforeInteractive"
            />
            <Script id="gtag-init" strategy="beforeInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
              `}
            </Script>
          </>
        ) : null}
      </head>
      <body
        className={`${poppins.variable} font-poppins antialiased bg-white text-black`}
      >
        <AuthProvider>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastClassName="!font-poppins !text-xs !font-medium !shadow-lg !border-4"
            progressClassName="!bg-blue-900"
            className="!font-poppins"
            style={{ fontFamily: 'Poppins', fontSize: '12px' }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
