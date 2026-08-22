import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SurgiGuard AI | Surgical Reconciliation & RFO Prevention Platform',
  description: 'AI-Assisted Intra-Operative Surgical Reconciliation Platform featuring Gemini 2.5 Flash and Deterministic Closure Gates.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-obsidian-950 text-slate-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
