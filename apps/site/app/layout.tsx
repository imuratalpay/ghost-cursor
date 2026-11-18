import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "./providers";
import "./globals.css";

// rsms' build: subset builds can drop the cv01 and ss03 features.
const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});
const newsreader = localFont({
  src: "./fonts/newsreader-italic-var.woff2",
  variable: "--font-newsreader",
  weight: "200 800",
  style: "italic",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/geist-mono-var.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ghost-cursor", template: "%s · ghost-cursor" },
  description:
    "A React component that replays a recording over your real component, with real DOM events, and steps aside when the reader reaches for it.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} ${geistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
