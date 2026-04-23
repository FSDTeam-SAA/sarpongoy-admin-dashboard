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
