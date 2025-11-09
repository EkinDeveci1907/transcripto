import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Transcripto',
  description: 'Record, transcribe, summarize'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-4">
        {children}
      </body>
    </html>
  );
}
