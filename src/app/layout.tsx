import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import { color } from "@/lib/theme/tokens";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
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
  themeColor: color.paper,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full light" suppressHydrationWarning>
      <body
        className={`${anton.variable} ${archivo.variable} min-h-full bg-paper font-utility text-ink antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
