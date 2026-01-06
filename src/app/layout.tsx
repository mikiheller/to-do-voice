import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Todo",
  description: "A Workflowy-inspired todo app with voice input",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

