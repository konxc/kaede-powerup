'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Server,
  Bot,
  QrCode,
  CheckCircle2,
  Play,
  Square,
  RotateCw,
  Terminal,
  Cpu,
  HardDrive,
  Sparkles,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Plus,
} from 'lucide-react';

export default function HostingPage() {
  const [selectedContainer, setSelectedContainer] = React.useState('hermes-01');
  const [qrCodeOpen, setQrCodeOpen] = React.useState(false);
  const [logsOpen, setLogsOpen] = React.useState(false);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] font-semibold text-purple-400 mb-2">
            <Server className="size-3" />
            <span>Shared Docker Container Fleet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Cloud Hosting untuk Headless Agents
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Jalankan agen 24/7 (Hermes WhatsApp & OpenClaw) di kontainer Docker terisolasi tanpa Anda harus mengelola VPS sendiri.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20KAEDE,%20saya%20butuh%20bantuan%20aktivasi%20container%20Hermes"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="text-xs h-9 border-white/10 text-slate-200">
              <MessageSquare className="mr-1.5 size-3.5 text-emerald-400" /> Bantuan CS Manual
            </Button>
          </a>
          <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9">
            <Plus className="mr-1.5 size-3.5" /> Order Container Baru
          </Button>
        </div>
      </div>

      {/* Active Containers Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Bot className="size-4 text-emerald-400" />
          Kontainer Aktif Anda
        </h2>

        {/* Container Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Bot className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">hermes-whatsapp-koneksi</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Running (24/7)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Host: <code className="text-slate-300">srv1.konxc.space:3044</code> · Dedicated Docker Instance
                </p>
              </div>
            </div>

            {/* Container Action Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQrCodeOpen(!qrCodeOpen)}
                className="text-xs h-8 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
              >
                <QrCode className="mr-1.5 size-3.5" />
                {qrCodeOpen ? 'Tutup QR' : 'Scan WhatsApp QR'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLogsOpen(!logsOpen)}
                className="text-xs h-8 border-white/10 text-slate-300"
              >
                <Terminal className="mr-1.5 size-3.5" /> Live Logs
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-8 text-amber-400 hover:text-amber-300">
                <RotateCw className="size-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-8 text-rose-400 hover:text-rose-300">
                <Square className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* WhatsApp QR Code Live Scanner Dropdown */}
          {qrCodeOpen && (
            <div className="p-6 rounded-xl bg-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-center gap-6">
              <div className="size-44 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                {/* Simulated live QR code */}
                <div className="size-full border-4 border-slate-950 flex flex-col items-center justify-center text-slate-950 p-2 text-center">
                  <QrCode className="size-24 text-slate-950" />
                  <span className="text-[9px] font-mono font-bold mt-1">HERMES-WHATSAPP-AUTH</span>
                </div>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Hubungkan Nomor WhatsApp Bisnis Anda
                </h4>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-xs">
                  <li>Buka WhatsApp di ponsel pintar Anda.</li>
                  <li>Buka <strong>Menu (⋮)</strong> atau <strong>Settings</strong> ➔ <strong>Perangkat Tertaut (Linked Devices)</strong>.</li>
                  <li>Arahkan kamera ponsel Anda ke kode QR di samping untuk autentikasi.</li>
                </ol>
                <p className="text-[11px] text-emerald-400 pt-1">
                  ✓ Sesi WhatsApp otomatis tersimpan di volume Docker terenkripsi.
                </p>
              </div>
            </div>
          )}

          {/* Live Logs Dropdown */}
          {logsOpen && (
            <div className="p-4 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs text-slate-300 space-y-1.5 max-h-60 overflow-y-auto">
              <p className="text-slate-500">[2026-10-14 20:15:01] Container hermes-whatsapp initialized on srv1.konxc.space</p>
              <p className="text-emerald-400">[2026-10-14 20:15:02] WhatsApp gateway connected. Listening on port 3044</p>
              <p className="text-sky-400">[2026-10-14 20:21:14] Incoming webhook from Trello board "Kaede Development"</p>
              <p className="text-slate-300">[2026-10-14 20:21:15] Context bundled via KAEDE MCP from SMA-UII/.github</p>
              <p className="text-emerald-400">[2026-10-14 20:21:18] Notification dispatched to WhatsApp operator group</p>
            </div>
          )}

          {/* Resource Usage Meters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Alokasi CPU</span>
                <Cpu className="size-3.5 text-sky-400" />
              </div>
              <p className="text-base font-bold text-white">0.2 / 1.0 vCPU</p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-sky-400 h-1.5 rounded-full" style={{ width: '20%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Memori RAM</span>
                <HardDrive className="size-3.5 text-purple-400" />
              </div>
              <p className="text-base font-bold text-white">312 MB / 1024 MB</p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-400 h-1.5 rounded-full" style={{ width: '30%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Uptime Operasional</span>
                <Sparkles className="size-3.5 text-emerald-400" />
              </div>
              <p className="text-base font-bold text-white">99.98% (14 Hari)</p>
              <p className="text-[10px] text-emerald-400">0 crash terdeteksi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing / Packages to Add More Containers */}
      <div className="space-y-4 pt-4">
        <h2 className="text-base font-bold text-white">Pilih Paket Docker Hosting Tambahan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hermes Package */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Hermes Micro (WhatsApp 24/7)</h3>
                <span className="text-xs font-bold text-emerald-400">Rp 149.000 / bln</span>
              </div>
              <p className="text-xs text-slate-400">
                Cocok untuk bot customer service, penerima brief klien WhatsApp, dan pembuat kartu Trello otomatis.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-2">
                <li>• 1 vCPU Dedicated Docker Container</li>
                <li>• 1 GB RAM & Enkripsi Volume Sesi WhatsApp</li>
                <li>• Webhook Trello & Notion Realtime</li>
              </ul>
            </div>
            <Link href="/app/billing">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-9">
                Sewa Kontainer Hermes
              </Button>
            </Link>
          </div>

          {/* OpenClaw Package */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">OpenClaw Drone (Server Ops)</h3>
                <span className="text-xs font-bold text-purple-400">Rp 249.000 / bln</span>
              </div>
              <p className="text-xs text-slate-400">
                Cocok untuk pemantauan server otomatis, rotasi backup database, dan eksekusi cron job berulang.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-2">
                <li>• 2 vCPU Dedicated Container</li>
                <li>• 2 GB RAM & SSH Tunneling Access</li>
                <li>• Codebase Memory MCP Integration</li>
              </ul>
            </div>
            <Link href="/app/billing">
              <Button variant="outline" className="w-full border-purple-500/40 text-purple-300 hover:bg-purple-500/10 text-xs h-9 font-bold">
                Sewa Kontainer OpenClaw
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
