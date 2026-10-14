import './globals.css';
import type { Metadata } from 'next';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  metadataBase: new URL('https://agentdesktop.vercel.app'),
  title: {
    default: 'KAEDE — Universal Context Engine & Agentic Operating System',
    template: '%s | KAEDE Ecosystem',
  },
  description:
    'Turn GitHub Knowledge (.github, playbook, .openkb) and Trello Boards into an Autonomous Workforce. Bridge coding agents (Antigravity, OpenCode, Claude Code) and headless bots (Hermes WhatsApp) with zero prompt hallucination.',
  keywords: [
    'KAEDE',
    'AI Agents',
    'Trello MCP',
    'OpenKB',
    'Context Engine',
    'Antigravity CLI',
    'OpenCode',
    'Hermes WhatsApp Agent',
    'PT Koneksi Jaringan Indonesia',
    'Agentic Workflow',
  ],
  authors: [{ name: 'Sandiko', url: 'https://github.com/sandikodev' }],
  creator: 'PT Koneksi Jaringan Indonesia',
  publisher: 'PT Koneksi Jaringan Indonesia',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://agentdesktop.vercel.app',
    title: 'KAEDE — Turn GitHub Knowledge & Trello into an Autonomous Workforce',
    description:
      'Universal Context Resolution Engine for AI Agents. Connect .github playbooks, repository .openkb rules, and native Trello kanban workflows.',
    siteName: 'KAEDE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KAEDE — Context Engine & Agentic OS',
    description:
      'Turn GitHub Knowledge and Trello Boards into an Autonomous Workforce for AI coding agents and 24/7 bots.',
    creator: '@sandikodev',
  },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans antialiased">
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
