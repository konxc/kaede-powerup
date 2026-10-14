import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Workflow, Github, Trello, MessageSquare, Globe, CheckCircle2, Plus, ExternalLink } from 'lucide-react';

const INTEGRATIONS = [
  {
    name: 'GitHub App',
    category: 'Source Code & Living KB',
    status: 'Connected',
    desc: 'Pemindaian otomatis hierarki .github, playbook, dan folder .openkb di repositori privat.',
    icon: Github,
    color: 'text-white',
  },
  {
    name: 'Trello Power-Up & MCP',
    category: 'Kanban & State Machine',
    status: 'Connected',
    desc: '47 tools manajemen kartu, perpindahan kolom, dan audit trail komentar otomatis.',
    icon: Trello,
    color: 'text-sky-400',
  },
  {
    name: 'WhatsApp Business Gateway',
    category: 'Hermes Agent 24/7',
    status: 'Connected',
    desc: 'Menghubungkan agen Hermes langsung ke nomor WhatsApp bisnis untuk menerima chat klien.',
    icon: MessageSquare,
    color: 'text-emerald-400',
  },
  {
    name: 'WordPress Remote MCP',
    category: 'Content Publishing',
    status: 'Connected',
    desc: 'Menerbitkan draft artikel blog SEO dari Trello langsung ke situs konxc.space.',
    icon: Globe,
    color: 'text-purple-400',
  },
  {
    name: 'Notion Database Sync',
    category: 'Knowledge Base',
    status: 'Available',
    desc: 'Membaca database SOP Notion tim sebagai sumber konteks sekunder bagi agen.',
    icon: Workflow,
    color: 'text-amber-400',
  },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Ecosystem Integrations</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Katalog konektor resmi yang menghubungkan KAEDE dengan platform kerja harian tim Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INTEGRATIONS.map((item) => {
          const Icon = item.icon;
          const isConnected = item.status === 'Connected';
          return (
            <div
              key={item.name}
              className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon className={`size-5 ${item.color}`} />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {isConnected ? '● Connected' : 'Available'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base">{item.name}</h3>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{item.category}</span>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <Button
                  size="sm"
                  variant={isConnected ? 'outline' : 'default'}
                  className={`w-full text-xs h-8 ${
                    isConnected
                      ? 'border-white/10 text-slate-300 hover:text-white'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                  }`}
                >
                  {isConnected ? 'Konfigurasi' : 'Hubungkan'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
