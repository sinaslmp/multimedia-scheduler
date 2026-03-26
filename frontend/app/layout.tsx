import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multimedia Traffic Scheduler Simulator",
  description:
    "Interactive discrete-event simulator for FIFO, Priority, and Round Robin queue scheduling — built for Internet & Multimedia coursework.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
