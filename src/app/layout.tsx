import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Nunito_Sans } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

const nunito = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Coolvetica Condensed — display headings (closest free match to Bold Condensed). */
const coolvetica = localFont({
  src: [
    {
      path: "../fonts/coolvetica/CoolveticaRgCond.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/coolvetica/CoolveticaRgCond.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/coolvetica/CoolveticaRgCond.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/coolvetica/CoolveticaRgCond.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/coolvetica/CoolveticaHvComp.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../fonts/coolvetica/CoolveticaHvComp.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-coolvetica",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://localderby.live"),
  title: "LocalDerby — Live Football Fan Meetups",
  description:
    "LocalDerby helps football fans in San Francisco find pubs showing the match, pick a team and player identity for any live soccer game, and join live squad chats with fans around them.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://localderby.live",
    siteName: "LocalDerby",
    title: "LocalDerby — Live Football Fan Meetups",
    description:
      "Find the San Francisco pub showing the match, pick your player, and join your team's live squad chat.",
    images: [
      {
        url: "/assets/landing-hero-pub.png",
        width: 1200,
        height: 630,
        alt: "Fans watching football at a San Francisco sports bar",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LocalDerby",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1033",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <body
        className={`${nunito.variable} ${coolvetica.variable} min-h-full bg-background font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
