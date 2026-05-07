import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudySnap — Flashcards com IA",
  description: "Transforme qualquer texto em flashcards de estudo automaticamente com inteligência artificial. Cole um texto e gere cartões de pergunta e resposta em segundos.",
  keywords: ["flashcards", "estudo", "IA", "inteligência artificial", "revisão", "aprendizado"],
  authors: [{ name: "StudySnap" }],
  creator: "StudySnap",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://study-snap-weid.vercel.app",
    siteName: "StudySnap",
    title: "StudySnap — Flashcards com IA",
    description: "Transforme qualquer texto em flashcards de estudo automaticamente com IA.",
    images: [
      {
        url: "https://study-snap-weid.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "StudySnap — Flashcards com IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudySnap — Flashcards com IA",
    description: "Transforme qualquer texto em flashcards de estudo automaticamente com IA.",
    images: ["https://study-snap-weid.vercel.app/og-image.png"],
  },
  manifest: "/manifest.json",
  themeColor: "#8b5cf6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StudySnap",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ backgroundColor: "#020617", colorScheme: "dark" }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="StudySnap" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
