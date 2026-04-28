import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import AppProvider from "@/provider/AppProvider";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sarpongoy Admin Dashboard",
  description: "Authentication and dashboard management for Sarpongoy.",
  icons: {
    icon: "/images/android-chrome-512x512.png",
    shortcut: "/images/android-chrome-512x512.png",
    apple: "/images/apple-touch-icon.png",
  },
  manifest: "/images/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} antialiased`}
      >
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
