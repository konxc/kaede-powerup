'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Server, QrCode, Terminal, RotateCw, Square, CheckCircle2, Cpu, HardDrive } from 'lucide-react';

interface ContainerProps {
  container: {
    id: string;
    dockerContainerId?: string | null;
    dockerHostServer?: string | null;
    assignedPort?: number | null;
    status: string;
    agentType: string;
    whatsappConnected?: boolean | null;
    allocatedCpu?: string | null;
    allocatedRam?: string | null;
    createdAt: Date | number;
  };
}

export function ContainerCard({ container }: ContainerProps) {
  const [qrOpen, setQrOpen] = React.useState(false);
  const [logsOpen, setLogsOpen] = React.useState(false);
  const isHermes = container.agentType === 'hermes-whatsapp';

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            {isHermes ? <Bot className="size-5" /> : <Server className="size-5 text-sky-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">
                {container.dockerContainerId || container.id.slice(0, 16)}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {container.status} (24/7)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Host: <code className="text-slate-300">{container.dockerHostServer}:{container.assignedPort}</code> · Dedicated Docker Instance
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isHermes && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQrOpen(!qrOpen)}
              className="text-xs h-8 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            >
              <QrCode className="mr-1.5 size-3.5" />
              {qrOpen ? 'Tutup QR' : 'Scan WhatsApp QR'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLogsOpen(!logsOpen)}
            className="text-xs h-8 border-white/10 text-slate-300 hover:text-white"
          >
            <Terminal className="mr-1.5 size-3.5" /> Live Logs
          </Button>
          <Button size="sm" variant="ghost" title="Restart Container" className="text-xs h-8 text-amber-400 hover:text-amber-300 hover:bg-white/5">
            <RotateCw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* WhatsApp QR Dropdown */}
      {qrOpen && isHermes && (
        <div className="p-6 rounded-xl bg-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-center gap-6">
          <div className="size-44 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <div className="size-full border-4 border-slate-950 flex flex-col items-center justify-center text-slate-950 p-2 text-center">
              <QrCode className="size-24 text-slate-950" />
              <span className="text-[9px] font-mono font-bold mt-1">HERMES-WHATSAPP-AUTH</span>
            </div>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
              Scan QR Code WhatsApp Anda
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Buka aplikasi WhatsApp di HP Anda → Menu Titik Tiga / Pengaturan → Perangkat Tertaut → Tautkan Perangkat, lalu arahkan kamera ke QR Code ini.
            </p>
            <div className="pt-2 flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircle2 className="size-4" />
              <span>Sesi WhatsApp akan di-cache secara otomatis di cloud hosting</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Logs Terminal Dropdown */}
      {logsOpen && (
        <div className="rounded-xl bg-black border border-white/10 p-4 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
          <p className="text-slate-500">── Live Docker Logs for {container.dockerContainerId} ──</p>
          <p className="text-emerald-400">[info] Agent container booted successfully on port {container.assignedPort}</p>
          <p className="text-slate-300">[info] Docker runtime health checks passed (100% healthy)</p>
          <p className="text-sky-400">[webhook] Listening for incoming events from srv1.konxc.space</p>
          <p className="text-slate-500">── End of recent logs ──</p>
        </div>
      )}

      {/* Metrics & Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <span className="text-[10px] text-slate-400 block mb-1">CPU Allocation</span>
          <span className="font-bold text-white flex items-center gap-1.5">
            <Cpu className="size-3.5 text-purple-400" /> {container.allocatedCpu || '1.0'} vCPU
          </span>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <span className="text-[10px] text-slate-400 block mb-1">Memory RAM</span>
          <span className="font-bold text-white flex items-center gap-1.5">
            <HardDrive className="size-3.5 text-sky-400" /> {container.allocatedRam || '1GB'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <span className="text-[10px] text-slate-400 block mb-1">WhatsApp Status</span>
          <span className={`font-bold flex items-center gap-1.5 ${container.whatsappConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
            <CheckCircle2 className="size-3.5" /> {container.whatsappConnected ? 'Connected' : 'Offline / Standby'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <span className="text-[10px] text-slate-400 block mb-1">Assigned Port</span>
          <span className="font-bold text-white font-mono">:{container.assignedPort}</span>
        </div>
      </div>
    </div>
  );
}
