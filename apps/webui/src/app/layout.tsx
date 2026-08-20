import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KAEDE Dashboard',
  description: 'Team & Role Management — OpenKB/Playbook steering',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
