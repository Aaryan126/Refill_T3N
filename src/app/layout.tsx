import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RefillGuard",
  description: "Safe autonomous refills with Terminal 3 authorization"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
