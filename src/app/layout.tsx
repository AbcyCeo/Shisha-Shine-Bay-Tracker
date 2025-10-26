import type { Metadata } from "next";
import "./globals.css";
import PekaBubble from "@/components/peka/PekaBubble";

export const metadata: Metadata = {
  title: "NYDF AI WebApp",
  description: "Ask Peka — NYDF Field Guide MVP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
        <PekaBubble />
      </body>
    </html>
  );
}
