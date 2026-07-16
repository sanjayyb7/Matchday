import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

const nunito = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fredoka = Fredoka({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://localderby.live"),
  title: "LocalDerby — Live Football Fan Meetups",
  description:
    "LocalDerby helps football fans in San Francisco find pubs showing the match, pick a team and player identity for the World Cup, and join live squad chats with fans around them.",
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
        className={`${nunito.variable} ${fredoka.variable} min-h-full bg-background font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
