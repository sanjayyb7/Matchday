import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import { color } from "@/lib/theme/tokens";
import "./globals.css";

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display-face",
});

const utility = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-utility-face",
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
  interactiveWidget: "resizes-content",
  themeColor: color.paper,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${utility.variable} h-full light`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-paper font-utility text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
