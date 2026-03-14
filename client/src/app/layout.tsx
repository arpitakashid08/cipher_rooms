import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CipherRooms - Secure Collaboration',
  description: 'Cybersecurity-themed secure collaboration platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cyber-bg text-gray-200 min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
