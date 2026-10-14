#!/usr/bin/env bun
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { createInterface } from 'readline';
import {
  loadEnv,
  buildAuthorizeUrl,
  maskToken,
  trelloValidateToken,
  revokeToken,
  writeGlobalSecrets,
  globalSecretsPath,
  promptTokenViaLocalServer,
  profilesDir,
  activeProfilePath,
  getActiveProfile,
  profileSecretsPath,
  saveProfile,
  loadProfile,
  listProfiles,
  switchProfile,
  deleteProfile,
  type Secrets,
} from './kaede-auth';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KAEDE_DIR = process.env.KAEDE_DIR ? resolve(process.env.KAEDE_DIR) : resolve(__dirname, '..');
const KAEDE_GLOBAL_DIR = resolve(homedir(), '.kaede');
const KAEDE_SRC = resolve(KAEDE_DIR, 'packages', 'kaede', 'src');

type EnvVars = Secrets;

function getRequestedProfile(): string | null {
  const profileArgIdx = process.argv.indexOf('--profile');
  if (profileArgIdx !== -1 && process.argv[profileArgIdx + 1] && !process.argv[profileArgIdx + 1].startsWith('-')) {
    return process.argv[profileArgIdx + 1];
  }
  return process.env.KAEDE_PROFILE || getActiveProfile(homedir()) || null;
}

function getSecrets(profileOverride?: string): EnvVars {
  const profile = profileOverride || getRequestedProfile();
  const searchPaths: string[] = [];

  // 1. Explicit or active profile secrets
  if (profile) {
    searchPaths.push(profileSecretsPath(homedir(), profile));
  }

  // 2. Custom secrets path if env var set
  if (process.env.KAEDE_SECRETS_PATH) {
    searchPaths.push(resolve(process.env.KAEDE_SECRETS_PATH));
  }

  // 3. Local project secrets (.kaede.env, .kaede/secrets.env, secrets.env)
  searchPaths.push(
    resolve(process.cwd(), '.kaede.env'),
    resolve(process.cwd(), '.kaede', 'secrets.env'),
    resolve(process.cwd(), 'secrets.env'),
  );

  // 4. Dev repo secrets
  searchPaths.push(resolve(KAEDE_DIR, 'secrets.env'));

  // 5. Global secrets (~/.config/kaede/secrets.env)
  searchPaths.push(globalSecretsPath(homedir()));

  let merged: EnvVars = {};
  for (let i = searchPaths.length - 1; i >= 0; i--) {
    const p = searchPaths[i];
    merged = { ...merged, ...loadEnv(p) };
  }
  return merged;
}

let readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(query: string): Promise<string> {
  return new Promise((resolveFn) => readline.question(query, resolveFn));
}

// ─── Commands ───

// ─── Auth (login/status/logout/token/switch/list/save/delete) ───

async function authLogin(opts: { manual?: boolean; profile?: string }): Promise<void> {
  const secrets = getSecrets(opts.profile);
  let key = secrets.TRELLO_API_KEY || '';

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║        KAEDE — Auth Login            ║\x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  if (opts.profile) {
    console.log(`  \x1b[36mTarget Profile: ${opts.profile}\x1b[0m`);
  }
  console.log('');

  if (!key) {
    console.log('  \x1b[90m  Ambil API Key dari:\x1b[0m');
    console.log('  \x1b[90m    https://trello.com/power-ups/admin  (Power-Up KAEDE)\x1b[0m');
    console.log('  \x1b[90m    atau https://trello.com/app-key     (quick)\x1b[0m');
    key = (await ask('  \x1b[36m  Trello API Key: \x1b[0m')).trim();
    if (!key) {
      console.log('  \x1b[31m  ✗ API Key required.\x1b[0m');
      return;
    }
  }

  let token = '';
  if (opts.manual) {
    const url = buildAuthorizeUrl(key);
    console.log('  \x1b[90m  Buka URL berikut, klik Allow, lalu salin token-nya:\x1b[0m');
    console.log('');
    console.log('  \x1b[36m  ' + url + '\x1b[0m');
    console.log('');
    token = (await ask('  \x1b[36m  Paste Trello Token: \x1b[0m')).trim();
  } else {
    try {
      token = await promptTokenViaLocalServer(key, 120000);
      console.log('  \x1b[32m  ✓ Token diterima dari browser.\x1b[0m');
    } catch (err) {
      console.log('  \x1b[33m  ⚠  ' + (err as Error).message + '\x1b[0m');
      const url = buildAuthorizeUrl(key);
      console.log('  \x1b[90m  Fallback manual — buka URL lalu paste token:\x1b[0m');
      console.log('');
      console.log('  \x1b[36m  ' + url + '\x1b[0m');
      console.log('');
      token = (await ask('  \x1b[36m  Paste Trello Token: \x1b[0m')).trim();
    }
  }

  if (!token) {
    console.log('  \x1b[31m  ✗ Token required.\x1b[0m');
    return;
  }

  let info;
  try {
    info = await trelloValidateToken(key, token);
  } catch (err) {
    console.log('  \x1b[31m  ✗ ' + (err as Error).message + '\x1b[0m');
    return;
  }

  const path = writeGlobalSecrets(homedir(), { TRELLO_API_KEY: key, TRELLO_TOKEN: token }, opts.profile);
  console.log(`  \x1b[32m  ✓ Saved to ${path}\x1b[0m`);
  const who = info.member ? `${info.member.fullName} (@${info.member.username})` : info.id;
  console.log('');
  console.log(`  \x1b[32m  ✅  Logged in as ${who}\x1b[0m`);
  if (opts.profile) {
    console.log(`  \x1b[36m     Profile: ${opts.profile} (active)\x1b[0m`);
  }
  if (info.expires && info.expires !== 'never') {
    console.log(`  \x1b[90m     Expires: ${info.expires}\x1b[0m`);
  }
  console.log('');
}

async function authStatus(): Promise<void> {
  const profile = getRequestedProfile();
  const secrets = getSecrets(profile || undefined);
  const activeProf = getActiveProfile(homedir());

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║        KAEDE — Auth Status           ║\x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');
  console.log(`  Profile     \x1b[36m${activeProf ? `${activeProf} (active)` : '(default)'}\x1b[0m`);

  if (!secrets.TRELLO_API_KEY || !secrets.TRELLO_TOKEN) {
    console.log('  \x1b[33m  Not logged in.\x1b[0m');
    console.log('  \x1b[90m  Run `kaede auth login` untuk masuk.\x1b[0m');
    console.log('');
    return;
  }

  try {
    const info = await trelloValidateToken(secrets.TRELLO_API_KEY, secrets.TRELLO_TOKEN);
    const who = info.member ? `${info.member.fullName} (@${info.member.username})` : info.id;
    console.log(`  Account     \x1b[32m${who}\x1b[0m`);
    console.log(`  Member ID   \x1b[90m${info.member ? info.member.id : '-'}\x1b[0m`);
    console.log(`  Token       \x1b[90m${maskToken(secrets.TRELLO_TOKEN)}\x1b[0m`);
    console.log(`  Expires     \x1b[90m${info.expires}\x1b[0m`);
    console.log(`  Scope       \x1b[90mread, write, account\x1b[0m`);
    console.log(`  Source      \x1b[90m${activeProf ? profileSecretsPath(homedir(), activeProf) : globalSecretsPath(homedir())}\x1b[0m`);
  } catch (err) {
    console.log('  \x1b[31m  Token invalid atau expired:\x1b[0m');
    console.log('  \x1b[90m  ' + (err as Error).message + '\x1b[0m');
    console.log('  \x1b[90m  Run `kaede auth login` untuk memperbarui.\x1b[0m');
  }
  console.log('');
}

async function authSwitch(profileName: string): Promise<void> {
  if (!profileName) {
    console.log('  \x1b[31m  ✗ Harap sebutkan nama profil: `kaede auth switch <name>`\x1b[0m');
    return;
  }
  const res = switchProfile(homedir(), profileName);
  if (res.success) {
    console.log(`  \x1b[32m  ✓ Berhasil beralih ke profil "${profileName}".\x1b[0m`);
    console.log(`  \x1b[90m    Kredensial disinkronkan ke ${res.path}\x1b[0m`);
  } else {
    console.log(`  \x1b[31m  ✗ ${res.error}\x1b[0m`);
    console.log('  \x1b[90m    Gunakan `kaede auth list` untuk melihat profil yang tersedia,\x1b[0m');
    console.log(`  \x1b[90m    atau \`kaede auth save ${profileName}\` untuk menyimpan kredensial saat ini.\x1b[0m`);
  }
}

async function authList(): Promise<void> {
  const profiles = listProfiles(homedir());
  const active = getActiveProfile(homedir());

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║        KAEDE — Auth Profiles         ║\x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');

  if (profiles.length === 0) {
    console.log('  \x1b[90m  Belum ada profil tersimpan di ~/.config/kaede/profiles/.\x1b[0m');
    console.log('  \x1b[90m  Gunakan `kaede auth save <name>` untuk menyimpan konfigurasi saat ini sebagai profil.\x1b[0m');
    console.log('');
    return;
  }

  for (const p of profiles) {
    const prefix = p.active ? '\x1b[32m  * \x1b[1m' : '    ';
    const suffix = p.active ? ' (active)\x1b[0m' : '\x1b[0m';
    console.log(`${prefix}${p.name}${suffix}`);
  }
  console.log('');
  console.log('  \x1b[90m  Beralih profil: `kaede auth switch <name>`\x1b[0m');
  console.log('');
}

async function authSave(profileName: string): Promise<void> {
  if (!profileName) {
    console.log('  \x1b[31m  ✗ Harap sebutkan nama profil: `kaede auth save <name>`\x1b[0m');
    return;
  }
  const secrets = getSecrets();
  if (!secrets.TRELLO_API_KEY && !secrets.TRELLO_TOKEN) {
    console.log('  \x1b[31m  ✗ Tidak ada kredensial aktif untuk disimpan.\x1b[0m');
    return;
  }
  const path = saveProfile(homedir(), profileName, secrets);
  console.log(`  \x1b[32m  ✓ Kredensial disimpan ke profil "${profileName}" (${path}).\x1b[0m`);
}

async function authDelete(profileName: string): Promise<void> {
  if (!profileName) {
    console.log('  \x1b[31m  ✗ Harap sebutkan nama profil: `kaede auth delete <name>`\x1b[0m');
    return;
  }
  const ok = deleteProfile(homedir(), profileName);
  if (ok) {
    console.log(`  \x1b[32m  ✓ Profil "${profileName}" berhasil dihapus.\x1b[0m`);
  } else {
    console.log(`  \x1b[33m  ⚠ Profil "${profileName}" tidak ditemukan.\x1b[0m`);
  }
}

async function authLogout(): Promise<void> {
  const secrets = getSecrets();
  if (!secrets.TRELLO_API_KEY || !secrets.TRELLO_TOKEN) {
    console.log('  \x1b[33m  Not logged in.\x1b[0m');
    return;
  }

  const wants = await ask('  \x1b[36m  Revoke token di Trello juga? (y/N): \x1b[0m');
  if (wants.toLowerCase() === 'y') {
    try {
      await revokeToken(secrets.TRELLO_API_KEY, secrets.TRELLO_TOKEN);
      console.log('  \x1b[32m  ✓ Token direvoke di Trello.\x1b[0m');
    } catch (err) {
      console.log('  \x1b[33m  ⚠  Gagal revoke: ' + (err as Error).message + '\x1b[0m');
    }
  }

  const path = writeGlobalSecrets(homedir(), { TRELLO_TOKEN: undefined });
  console.log(`  \x1b[32m  ✓ Kredensial dihapus dari ${path}\x1b[0m`);
  console.log('  \x1b[90m  Logout selesai.\x1b[0m');
}

async function authToken(opts: { raw?: boolean }): Promise<void> {
  const secrets = getSecrets();
  if (!secrets.TRELLO_TOKEN) {
    console.error('  \x1b[31m  \u2717 Not logged in. Run `kaede auth login`.\x1b[0m');
    return;
  }
  if (opts.raw) {
    console.log(secrets.TRELLO_TOKEN);
  } else {
    console.log('  Token    ' + maskToken(secrets.TRELLO_TOKEN));
    console.log('  API Key  ' + (secrets.TRELLO_API_KEY || '').slice(0, 8) + '…');
    console.log('  \x1b[90m  Gunakan `kaede auth token --raw` untuk scripting / set env server.\x1b[0m');
  }
}

async function cmdAuth(): Promise<void> {
  const args = process.argv.slice(3);
  const sub = args[0] || 'login';
  const manual = args.includes('--manual');
  const raw = args.includes('--raw');
  const profileIdx = args.indexOf('--profile');
  const profile = profileIdx !== -1 && args[profileIdx + 1] && !args[profileIdx + 1].startsWith('-')
    ? args[profileIdx + 1]
    : undefined;

  switch (sub) {
    case 'login':
      await authLogin({ manual, profile });
      break;
    case 'status':
      await authStatus();
      break;
    case 'logout':
      await authLogout();
      break;
    case 'token':
      await authToken({ raw });
      break;
    case 'switch':
      await authSwitch(args[1]);
      break;
    case 'list':
      await authList();
      break;
    case 'save':
      await authSave(args[1]);
      break;
    case 'delete':
      await authDelete(args[1]);
      break;
    default:
      console.log('  Usage: kaede auth <login|status|logout|token|switch|list|save|delete> [--manual] [--raw] [--profile <name>]');
  }
}

// ─── Setup (onboarding) ───

async function ensureMcpConfig(opts: { repair?: boolean; force?: boolean }): Promise<void> {
  const { execSync } = await import('child_process');
  const globalDir = KAEDE_GLOBAL_DIR;
  const opencodeConfigDir = resolve(homedir(), '.config', 'opencode');
  const opencodeConfigPath = resolve(opencodeConfigDir, 'opencode.json');
  const trelloDist = resolve(globalDir, 'dist', 'mcp-server.js');
  const kaedeDist = resolve(globalDir, 'dist', 'kaede-mcp-server.js');

  if (opts.force || !existsSync(trelloDist) || !existsSync(kaedeDist)) {
    console.log('  \x1b[36m  Building & menyalin MCP servers...\x1b[0m');
    for (const [label, src, out] of [
      ['Trello MCP', 'packages/kaede-trello/src/mcp-server.ts', 'dist/mcp-server.js'],
      ['KAEDE Orchestrator MCP', 'packages/kaede/src/kaede-mcp-server.ts', 'dist/kaede-mcp-server.js'],
    ] as Array<[string, string, string]>) {
      try {
        if (!existsSync(resolve(KAEDE_DIR, src))) {
          throw new Error(`source not found: ${src}`);
        }
        execSync(`bun build --target bun ${src} --outfile ${out}`, {
          cwd: KAEDE_DIR,
          stdio: 'inherit',
        });
        mkdirSync(resolve(globalDir, 'dist'), { recursive: true });
        writeFileSync(resolve(globalDir, out), readFileSync(resolve(KAEDE_DIR, out), 'utf-8'), 'utf-8');
        console.log(`  \x1b[32m  \u2713 ${label} ready\x1b[0m`);
      } catch (err) {
        console.log(`  \x1b[31m  \u2717 ${label} build failed: ${(err as Error).message}\x1b[0m`);
        throw err;
      }
    }
  }

  mkdirSync(opencodeConfigDir, { recursive: true });
  let cfg: Record<string, unknown> = {};
  if (existsSync(opencodeConfigPath)) {
    try {
      cfg = JSON.parse(readFileSync(opencodeConfigPath, 'utf-8')) as Record<string, unknown>;
    } catch {}
  }

  const trelloPath = trelloDist.replace(/\\/g, '/');
  const kaedePath = kaedeDist.replace(/\\/g, '/');
  const mcp = (cfg.mcp as Record<string, unknown>) || {};
  const entries: Array<[string, string, number]> = [
    ['trello', trelloPath, 30000],
    ['kaede', kaedePath, 60000],
  ];

  let changed = false;
  for (const [name, binPath, timeout] of entries) {
    const existing = mcp[name] as Record<string, unknown> | undefined;
    const command = ['bun', binPath];
    const needs = !existing || (!!opts.repair && JSON.stringify(existing.command) !== JSON.stringify(command));
    if (needs) {
      mcp[name] = { type: 'local', command, enabled: true, timeout };
      changed = true;
    }
  }
  if (changed) {
    cfg.mcp = mcp;
    writeFileSync(opencodeConfigPath, JSON.stringify(cfg, null, 2) + '\n', 'utf-8');
  }
  console.log(`  \x1b[32m  \u2713 mcp.trello & mcp.kaede terdaftar di ${opencodeConfigPath}\x1b[0m`);
}

async function cmdSetup(): Promise<void> {
  const args = process.argv.slice(3);
  const yes = args.includes('--yes') || args.includes('-y');
  const noMcp = args.includes('--no-mcp');
  const noInit = args.includes('--no-init');

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║       KAEDE — Onboarding (setup)     ║\x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');

  const secrets = getSecrets();
  const hasCreds = !!(secrets.TRELLO_API_KEY && secrets.TRELLO_TOKEN);
  const installed =
    existsSync(resolve(KAEDE_GLOBAL_DIR, 'dist', 'mcp-server.js')) &&
    existsSync(resolve(KAEDE_GLOBAL_DIR, 'dist', 'kaede-mcp-server.js'));

  // 1. Environment
  console.log('  \x1b[36m  Step 1/4 — Environment\x1b[0m');
  if (!installed) {
    console.log('  \x1b[33m  ⚠  KAEDE belum ter-install global (dist server MCP belum ada).\x1b[0m');
    if (yes) {
      console.log('  \x1b[90m     Menjalankan kaede install...\x1b[0m');
      await cmdInstall();
    } else {
      const wants = await ask('  \x1b[36m  Install global dulu? (y/N): \x1b[0m');
      if (wants.toLowerCase() === 'y') await cmdInstall();
      else console.log('  \x1b[33m  Skip install — lanjut dengan kredensial & konfigurasi.\x1b[0m');
    }
  } else {
    console.log('  \x1b[32m  ✓ Instalasi global terdeteksi.\x1b[0m');
  }

  // 2. Credentials
  console.log('');
  console.log('  \x1b[36m  Step 2/4 — Trello credentials (OAuth per-user)\x1b[0m');
  if (hasCreds) {
    console.log(`  \x1b[32m  ✓ Kredensial sudah dikonfigurasi (API Key ${secrets.TRELLO_API_KEY!.slice(0, 8)}...).\x1b[0m`);
    if (!yes) {
      const wants = await ask('  \x1b[36m  Re-login / ganti akun? (y/N): \x1b[0m');
      if (wants.toLowerCase() === 'y') await authLogin({ manual: false });
    }
  } else {
    console.log('  \x1b[90m     Belum ada kredensial — membuka alur login.\x1b[0m');
    await authLogin({ manual: false });
  }

  // 3. MCP config
  console.log('');
  console.log('  \x1b[36m  Step 3/4 — OpenCode MCP config\x1b[0m');
  if (noMcp) {
    console.log('  \x1b[90m     Skipped (--no-mcp)\x1b[0m');
  } else {
    await ensureMcpConfig({ repair: true });
  }

  // 4. Project init (opsional)
  console.log('');
  console.log('  \x1b[36m  Step 4/4 — Project init (opsional)\x1b[0m');
  if (noInit) {
    console.log('  \x1b[90m     Skipped (--no-init)\x1b[0m');
  } else if (yes) {
    console.log('  \x1b[90m     Skipped (non-interaktif --yes). Jalankan `kaede init` nanti.\x1b[0m');
  } else {
    const wants = await ask('  \x1b[36m  Init project dengan scaffold KAEDE (playbook/OpenKB)? (y/N): \x1b[0m');
    if (wants.toLowerCase() === 'y') await cmdInit();
  }

  // Verifikasi
  console.log('');
  console.log('  \x1b[36m  Verifikasi konfigurasi...\x1b[0m');
  await cmdStatus();

  console.log('');
  console.log('  \x1b[32m  ✅  Onboarding selesai!\x1b[0m');
  console.log('  \x1b[90m     Next steps:\x1b[0m');
  console.log('  \x1b[90m       kaede today          — lihat task Trello hari ini\x1b[0m');
  console.log('  \x1b[90m       kaede auth status    — cek akun aktif\x1b[0m');
  console.log('  \x1b[90m       kaede run "Mulai Sprint Alpha"  — eksekusi intent\x1b[0m');
  console.log('');
}

async function cmdToday(): Promise<void> {
  const secrets = getSecrets();
  if (!secrets.TRELLO_API_KEY || !secrets.TRELLO_TOKEN) {
    console.error('  \x1b[31m  \u2717 Trello credentials not found.\x1b[0m');
    console.error('  \x1b[33m  Run `bun scripts/kaede.ts setup` first.\x1b[0m');
    return;
  }

  const apiBase = 'https://api.trello.com/1';
  const auth = `key=${secrets.TRELLO_API_KEY}&token=${secrets.TRELLO_TOKEN}`;

  try {
    const meRes = await fetch(`${apiBase}/members/me?${auth}`);
    const me = await meRes.json() as { id: string; fullName?: string; username?: string };

    const boardsRes = await fetch(`${apiBase}/members/${me.id}/boards?${auth}&fields=name,id,url,closed&filter=open`);
    const boards = await boardsRes.json() as Array<Record<string, unknown>>;

    console.log('');
    console.log(`  \x1b[35m╔══════════════════════════════════════╗\x1b[0m`);
    console.log(`  \x1b[35m║      KAEDE — Today's Tasks           ║\x1b[0m`);
    console.log(`  \x1b[35m╚══════════════════════════════════════╝\x1b[0m`);
    console.log(
      `  \x1b[90m  ${me.fullName || me.username} · ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\x1b[0m`,
    );
    console.log('');

    let hasTasks = false;

    for (const board of boards) {
      const listsRes = await fetch(`${apiBase}/boards/${board.id}/lists?${auth}&fields=name,id`);
      const lists = await listsRes.json() as Array<Record<string, unknown>>;

      for (const list of lists) {
        const cardsRes = await fetch(
          `${apiBase}/lists/${list.id}/cards?${auth}&fields=name,id,due,dueComplete,idMembers,url,desc,dateLastActivity&members=true`,
        );
        const cards = await cardsRes.json() as Array<{ idMembers?: string[]; name: string; due?: string; dueComplete?: boolean; desc?: string }>;

        const myCards = cards.filter((c) => c.idMembers && c.idMembers.includes(me.id));

        if (myCards.length === 0) continue;
        hasTasks = true;

        console.log(`  \x1b[36m  ${board.name as string}\x1b[0m \x1b[90m→\x1b[0m \x1b[33m${list.name as string}\x1b[0m`);
        console.log(`  \x1b[90m  ${'─'.repeat(Math.max((board.name as string).length + (list.name as string).length + 4, 20))}\x1b[0m`);

        for (const card of myCards) {
          const due = card.due
            ? new Date(card.due).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              })
            : '';
          const isOverdue = card.due && new Date(card.due) < new Date() && !card.dueComplete;
          const dueStr = due
            ? ` \x1b[90m[\x1b[0m${isOverdue ? '\x1b[31m⚠ ' : '\x1b[32m'}` +
              `${due}\x1b[0m${card.dueComplete ? ' ✓' : ''}\x1b[90m]\x1b[0m`
            : '';

          console.log(`    \x1b[37m• ${card.name}\x1b[0m${dueStr}`);
          if (card.desc) {
            const firstLine = card.desc.split('\n')[0].slice(0, 80);
            console.log(`     \x1b[90m${firstLine}\x1b[0m`);
          }
        }
        console.log('');
      }
    }

    if (!hasTasks) {
      console.log('  \x1b[90m  No tasks assigned to you. Enjoy your day! 🎉\x1b[0m');
      console.log('');
    }
  } catch (err) {
    console.error('  \x1b[31m  ✗ Failed to fetch Trello data:\x1b[0m', (err as Error).message);
  }
}

async function cmdInit(): Promise<void> {
  // Parse args: [dir] [--name X] [--tech X] [--db X]
  const args = process.argv.slice(3);
  const targetDir = resolve(args.find((_, i, a) => !a[i].startsWith('-')) || process.cwd());
  const getOpt = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };
  const isInteractive = args.length === 0 || args[0] === '.' || !args[0].startsWith('-');
  const projectName = getOpt('--name') || '';
  const techStack = getOpt('--tech') || '';
  const dbType = getOpt('--db') || '';
  const playbookRef = getOpt('--playbook') || '';

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║        KAEDE — Init Project          ║\x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');

  // 1. Check credentials
  const secrets = getSecrets();
  const hasCreds = !!(secrets.TRELLO_API_KEY && secrets.TRELLO_TOKEN);
  if (!hasCreds && isInteractive) {
    console.log('  \x1b[33m  ⚠  Trello credentials not configured.\x1b[0m');
    console.log('  \x1b[33m     Run `kaede setup` later.\x1b[0m');
    console.log('');
  }

  // 2. Create .opencode directory
  const opencodeDir = resolve(targetDir, '.opencode');
  const sharedDir = resolve(opencodeDir, 'SHARED');
  mkdirSync(sharedDir, { recursive: true });

  // 3. Resolve the MCP dist dir. Prefer the global install (~/.kaede/dist) so the
  // generated project keeps working even if the source checkout moves or is deleted.
  const distDir = existsSync(resolve(KAEDE_GLOBAL_DIR, 'dist', 'mcp-server.js'))
    ? resolve(KAEDE_GLOBAL_DIR, 'dist')
    : resolve(KAEDE_DIR, 'dist');

  // 4. Write opencode.json
  const config = {
    mcp: {
      trello: {
        type: 'local',
        command: ['bun', resolve(distDir, 'mcp-server.js')],
        enabled: true,
        timeout: 30000,
      },
      kaede: {
        type: 'local',
        command: ['bun', resolve(distDir, 'kaede-mcp-server.js')],
        enabled: true,
        timeout: 60000,
      },
    },
  };
  writeFileSync(resolve(opencodeDir, 'opencode.json'), JSON.stringify(config, null, 2) + '\n', 'utf-8');
  console.log(`  \x1b[32m  ✓ Created \x1b[0m${resolve(opencodeDir, 'opencode.json')}`);

  // 4. Write project-context.md
  const contextContent = [
    `# ${projectName || 'Project'} — KAEDE Environment`,
    '',
    techStack ? `- **Tech Stack:** ${techStack}` : null,
    dbType ? `- **Database:** ${dbType}` : null,
    playbookRef ? `- **Playbook:** \`${playbookRef}\`` : null,
    '',
    '## MCP Servers',
    '',
    'This project uses two MCP servers managed by KAEDE:',
    '',
    '| Server | Description |',
    '|--------|-------------|',
    '| `mcp.trello` | 44 Trello API tools (cards, boards, lists, labels, checklists, search, etc.)',
    '| `mcp.kaede` | 18 orchestration tools (playbook, context, plan, templates, report, undo, batch)',
    '',
    '## Workflow',
    '',
    '```',
    '1. Write intent in natural language',
    '2. mcp.kaede.generate_plan() → action steps',
    '3. mcp.trello.<tool>() → execute each step',
    '```',
    '',
  ]
    .filter(Boolean)
    .join('\n');
  writeFileSync(resolve(sharedDir, 'project-context.md'), contextContent, 'utf-8');
  console.log(`  \x1b[32m  ✓ Created \x1b[0m${resolve(sharedDir, 'project-context.md')}`);

  // 5. Write basic agent-rules.md
  const rulesContent = [
    '## Agent Rules',
    '',
    '### Communication',
    '- Default bahasa Indonesia untuk komunikasi internal tim',
    '- Gunakan English untuk dokumentasi teknis dan kode',
    '',
    '### Workflow',
    '- Selalu gunakan `mcp.kaede.generate_plan()` dulu untuk task besar',
    '- Eksekusi step-by-step via `mcp.trello` tools',
    '- Untuk task sederhana, langsung gunakan `mcp.trello` tools',
    '',
  ].join('\n');
  writeFileSync(resolve(sharedDir, 'agent-rules.md'), rulesContent, 'utf-8');
  console.log(`  \x1b[32m  ✓ Created \x1b[0m${resolve(sharedDir, 'agent-rules.md')}`);

  console.log('');
  console.log('  \x1b[32m  ✅  Project initialized with KAEDE.\x1b[0m');
  console.log('');
  console.log('  \x1b[90m     Next steps:\x1b[0m');
  console.log('  \x1b[90m       1. \x1b[36mkaede setup\x1b[0m    — configure Trello API credentials');
  console.log('  \x1b[90m       2. \x1b[36mkaede status\x1b[0m   — verify configuration');
  console.log('  \x1b[90m       3. \x1b[36mkaede today\x1b[0m    — view your tasks');
  console.log('');
}

// ── Push ──

interface TaskCard {
  title: string;
  desc?: string;
  labels?: string[];
  member?: string;
}

async function cmdPush(): Promise<void> {
  const args = process.argv.slice(3);
  const filePath = args.find((a) => !a.startsWith('-'));
  let boardName = '';
  let listName = '';
  let defaultLabels: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--board') boardName = args[i + 1] || '';
    if (args[i] === '--list') listName = args[i + 1] || '';
    if (args[i] === '--labels') defaultLabels = (args[i + 1] || '').split(',').map((s: string) => s.trim());
  }

  if (!filePath) {
    console.error('  \x1b[31m  ✗ Usage: kaede push <file.md> [--board "Board Name"] [--list "List Name"]\x1b[0m');
    return;
  }

  const secrets = getSecrets();
  if (!secrets.TRELLO_API_KEY || !secrets.TRELLO_TOKEN) {
    console.error('  \x1b[31m  \u2717 Trello credentials not found. Run `kaede setup` first.\x1b[0m');
    return;
  }

  const auth = `key=${secrets.TRELLO_API_KEY}&token=${secrets.TRELLO_TOKEN}`;
  const api = 'https://api.trello.com/1';

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║        KAEDE — Push Cards            ║\x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');

  // Parse markdown → task cards
  const content = readFileSync(filePath, 'utf-8');
  const cards: TaskCard[] = [];
  let currentCard: TaskCard | null = null;

  for (const line of content.split('\n')) {
    const taskMatch = line.match(/^##\s+(.+)/);
    const descMatch = line.match(/^[-*]\s+(.+)/);
    const labelMatch = line.match(/^labels?:\s*(.+)/i);

    if (taskMatch) {
      if (currentCard) cards.push(currentCard);
      currentCard = { title: taskMatch[1].trim() };
    } else if (currentCard && descMatch) {
      currentCard.desc = (currentCard.desc ? currentCard.desc + '\n' : '') + descMatch[1].trim();
    } else if (currentCard && labelMatch) {
      const labels = labelMatch[1].split(',').map((s: string) => s.trim());
      currentCard.labels = [...(currentCard.labels || []), ...labels];
    }
  }
  if (currentCard) cards.push(currentCard);

  if (cards.length === 0) {
    console.error('  \x1b[31m  ✗ No tasks found in file. Use ## headings for task titles.\x1b[0m');
    return;
  }

  console.log(`  \x1b[36m  Found ${cards.length} tasks in "${filePath}"\x1b[0m`);
  console.log('');

  // Resolve board
  const boardsRes = await fetch(`${api}/members/me/boards?${auth}&fields=name,id`);
  const boards = await boardsRes.json() as Array<{ name: string; id: string }>;
  const board = boardName
    ? boards.find((b) => b.name.toLowerCase() === boardName.toLowerCase())
    : boards[0];

  if (!board) {
    console.error(`  \x1b[31m  ✗ Board "${boardName || '(first available)'}" not found.\x1b[0m`);
    return;
  }
  console.log(`  \x1b[90m  Board: ${board.name}\x1b[0m`);

  // Resolve list
  let targetList: { id: string; name: string } | undefined;
  if (listName) {
    const listsRes = await fetch(`${api}/boards/${board.id}/lists?${auth}&fields=name,id`);
    const lists = await listsRes.json() as Array<{ name: string; id: string }>;
    targetList = lists.find((l) => l.name.toLowerCase() === listName.toLowerCase());
    if (!targetList) {
      console.error(`  \x1b[31m  ✗ List "${listName}" not found in board "${board.name}".\x1b[0m`);
      return;
    }
  }

  // Create cards
  let created = 0;
  let failed = 0;

  for (const card of cards) {
    console.log(`  \x1b[36m  Creating: ${card.title}\x1b[0m`);

    const body = new URLSearchParams({
      name: card.title,
      desc: card.desc || '',
      idList: targetList?.id || '',
      key: secrets.TRELLO_API_KEY,
      token: secrets.TRELLO_TOKEN,
    });

    try {
      const res = await fetch(`${api}/cards?${auth}`, {
        method: 'POST',
        body,
      });
      if (res.ok) {
        created++;
        console.log(`  \x1b[32m  ✓ Created\x1b[0m`);
      } else {
        failed++;
        const errText = await res.text();
        console.log(`  \x1b[31m  ✗ Failed: ${errText.slice(0, 100)}\x1b[0m`);
      }
    } catch (err) {
      failed++;
      console.log(`  \x1b[31m  ✗ Error: ${(err as Error).message}\x1b[0m`);
    }
  }

  console.log('');
  console.log(`  \x1b[32m  ✅  Done: ${created} created, ${failed} failed\x1b[0m`);
  console.log('');
}

// ── Env ──

async function cmdEnv(): Promise<void> {
  const secrets = getSecrets();
  if (!secrets.TRELLO_API_KEY || !secrets.TRELLO_TOKEN) {
    console.error('  \x1b[31m  \u2717 Trello credentials not found.\x1b[0m');
    return;
  }

  const args = process.argv.slice(3);
  const shell = args.includes('--bash')
    ? 'bash'
    : args.includes('--ps')
    ? 'ps'
    : args.includes('--cmd')
    ? 'cmd'
    : 'auto';

  const pairs: Array<[string, string]> = [
    ['TRELLO_API_KEY', secrets.TRELLO_API_KEY],
    ['TRELLO_TOKEN', secrets.TRELLO_TOKEN],
  ];

  if (shell === 'bash') {
    for (const [k, v] of pairs) console.log(`export ${k}=${v}`);
  } else if (shell === 'cmd') {
    for (const [k, v] of pairs) console.log(`set ${k}=${v}`);
  } else {
    for (const [k, v] of pairs) console.log(`$env:${k}="${v}"`);
  }
}

// ── Build ──

async function cmdBuild(): Promise<void> {
  const args = process.argv.slice(3);
  const isMcp = args.includes('--mcp') || args.includes('-m') || args.length === 0;

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║         KAEDE — Build                ║\x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');

  if (isMcp) {
    const buildScript = resolve(KAEDE_DIR, 'scripts', 'build-mcp.ts');
    if (!existsSync(buildScript)) {
      console.error('  \x1b[31m  \u2717 scripts/build-mcp.ts not found\x1b[0m');
      return;
    }
    const { execSync } = await import('child_process');
    try {
      execSync(`bun ${buildScript}`, { cwd: KAEDE_DIR, stdio: 'inherit' });
    } catch (err) {
      console.error('  \x1b[31m  \u2717 Build failed:\x1b[0m', (err as Error).message);
    }
  }
}

// ── Status ──

async function cmdStatus(): Promise<void> {
  const secrets = getSecrets();
  const args = process.argv.slice(3);
  const checkMcp = args.includes('--mcp') || args.includes('-m');

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║         KAEDE — Status               \x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');

  const apiKeyOk = !!secrets.TRELLO_API_KEY;
  const tokenOk = !!secrets.TRELLO_TOKEN;

  console.log(`  Trello API Key  ${apiKeyOk ? '\x1b[32m\u2713 configured\x1b[0m' : '\x1b[31m\u2717 missing\x1b[0m'}`);
  console.log(`  Trello Token    ${tokenOk ? '\x1b[32m\u2713 configured\x1b[0m' : '\x1b[31m\u2717 missing\x1b[0m'}`);

  const globalPath = resolve(homedir(), '.config', 'kaede', 'secrets.env');
  console.log(
    `  Global secrets  ${existsSync(globalPath) ? '\x1b[32m\u2713\x1b[0m' : '\x1b[33mnot set\x1b[0m'}  \x1b[90m${globalPath}\x1b[0m`,
  );

  const devPath = resolve(KAEDE_DIR, 'secrets.env');
  if (existsSync(devPath)) {
    console.log(`  Dev secrets     \x1b[33m\u26a0\x1b[0m  \x1b[90m${devPath} (for dev/testing only)\x1b[0m`);
  }

  const globalOc = resolve(homedir(), '.config', 'opencode', 'opencode.json');
  const projectOc = resolve(process.cwd(), '.opencode', 'opencode.json');
  const hasGlobalMcp = existsSync(globalOc) && readFileSync(globalOc, 'utf-8').includes('"mcp"');
  const hasProjectMcp = existsSync(projectOc) && readFileSync(projectOc, 'utf-8').includes('"mcp"');

  let globalMcpNames: string[] = [];
  if (hasGlobalMcp) {
    try {
      const cfg = JSON.parse(readFileSync(globalOc, 'utf-8')) as { mcp?: Record<string, unknown> };
      globalMcpNames = Object.keys(cfg.mcp || {});
    } catch {}
    console.log(`  MCP configured  \x1b[32m\u2713\x1b[0m  \x1b[90m${globalOc} (global)\x1b[0m`);
    if (globalMcpNames.length > 0) {
      console.log(`  MCP servers     \x1b[90m${globalMcpNames.join(', ')}\x1b[0m`);
    }
  } else if (hasProjectMcp) {
    console.log(`  MCP configured  \x1b[32m\u2713\x1b[0m  \x1b[90m${projectOc}\x1b[0m`);
  } else {
    console.log(`  MCP configured  \x1b[33mnot configured\x1b[0m`);
  }

  if (checkMcp && apiKeyOk && tokenOk) {
    console.log('');
    console.log('  \x1b[36m  Testing MCP connection...\x1b[0m');
    try {
      const { TrelloMCPClient } = await import(resolve(KAEDE_SRC, 'trello-client'));
      const client = new TrelloMCPClient();
      await client.connect();
      const boards = await client.listBoards();
      console.log(`  MCP server      \x1b[32m\u2713 responding\x1b[0m \x1b[90m(${boards.length} boards)\x1b[0m`);
      client.close();
    } catch (err) {
      console.log(`  MCP server      \x1b[31m\u2717 ${(err as Error).message.slice(0, 60)}\x1b[0m`);
    }
  }

  console.log('');
  if (!apiKeyOk || !tokenOk) {
    console.log('  \x1b[33m  Run `bun scripts/kaede.ts setup` to configure.\x1b[0m');
    console.log('');
  }
}

// ── Playbook ──

async function cmdPlaybook(): Promise<void> {
  const args = process.argv.slice(3);
  const subcmd = args[0];
  if (!subcmd) {
    console.error('  \x1b[31m  \u2717 Subcommand required.\x1b[0m');
    console.log(
      '  \x1b[37m  Usage:\x1b[0m bun scripts/kaede.ts playbook \x1b[36m<parse|show>\x1b[0m \x1b[90m<path>\x1b[0m',
    );
    return;
  }

  const path = args[1];
  if (!path) {
    console.error('  \x1b[31m  \u2717 Playbook path required.\x1b[0m');
    return;
  }

  if (!existsSync(path)) {
    console.error('  \x1b[31m  \u2717 File not found: ' + path + '\x1b[0m');
    return;
  }

  const content = readFileSync(path, 'utf-8');

  if (subcmd === 'parse') {
    const { parsePlaybook } = await import(resolve(KAEDE_SRC, 'orchestrator'));
    const result = parsePlaybook(content);

    console.log('');
    console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
    console.log('  \x1b[35m║    KAEDE — Playbook Parser           ║\x1b[0m');
    console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
    console.log('');
    console.log(`  \x1b[90m  File: ${path}\x1b[0m`);
    console.log(`  \x1b[90m  Title: ${result.title || '(none)'}\x1b[0m`);
    console.log(`  \x1b[90m  Roles: ${result.roles.length}\x1b[0m`);
    console.log(`  \x1b[90m  Workflow lists: ${result.workflow.lists.length}\x1b[0m`);
    console.log(`  \x1b[90m  Labels: ${result.conventions.labels.length}\x1b[0m`);
    console.log('');
    for (const role of result.roles) {
      console.log(`  \x1b[36m  Role: ${role.name}\x1b[0m`);
      for (const r of role.responsibilities) {
        console.log(`     \x1b[90m  \u2022 ${r}\x1b[0m`);
      }
    }
    if (result.workflow.lists.length > 0) {
      console.log('');
      console.log('  \x1b[36m  Workflow:\x1b[0m');
      for (const list of result.workflow.lists) {
        console.log(`     \x1b[90m  ${list}\x1b[0m`);
      }
    }
    console.log('');
    console.log('  \x1b[32m  \u2705  Playbook parsed successfully.\x1b[0m');
  } else if (subcmd === 'show') {
    console.log('');
    console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
    console.log('  \x1b[35m║    KAEDE — Playbook Summary          ║\x1b[0m');
    console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
    console.log('');
    console.log(content);
  } else {
    console.error('  \x1b[31m  \u2717 Unknown subcommand: ' + subcmd + '\x1b[0m');
    console.log('  \x1b[37m  Available: parse, show\x1b[0m');
  }
}

// ── Orchestrate ──

async function cmdOrchestrate(): Promise<void> {
  const args = process.argv.slice(3);
  const getOpt = (f: string): string | undefined => {
    const i = args.indexOf(f);
    return i !== -1 ? args[i + 1] : undefined;
  };
  const playbookPath = getOpt('--playbook');
  const openkbDir = getOpt('--openkb') || resolve(process.cwd(), '.openkb');
  const opencodeDir = getOpt('--opencode') || resolve(process.cwd(), '.opencode');
  const detail = args.includes('--detail') || args.includes('-d');

  const { bundleContext } = await import(resolve(KAEDE_SRC, 'orchestrator'));

  const ctx = bundleContext({
    playbook: playbookPath,
    openkb: openkbDir,
    opencode: opencodeDir,
  });

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║    KAEDE — Orchestration Context     \x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');

  if (ctx.playbook) {
    console.log(`  \x1b[36m  Playbook:\x1b[0m \x1b[90m${ctx.playbook.title}\x1b[0m`);
    console.log(
      `  \x1b[90m    ${ctx.playbook.roles.length} roles \u00B7 ${ctx.playbook.workflow.lists.length} lists \u00B7 ${ctx.playbook.conventions.labels.length} labels\x1b[0m`,
    );
    if (detail) {
      for (const r of ctx.playbook.roles) {
        console.log(`    \x1b[90m  Role: ${r.name}\x1b[0m`);
        for (const resp of r.responsibilities) console.log(`      \x1b[90m\u2022 ${resp}\x1b[0m`);
      }
      console.log(`    \x1b[90m  Lists: ${ctx.playbook.workflow.lists.join(' \u2192 ')}\x1b[0m`);
    }
  } else {
    console.log('  \x1b[33m  \u26a0  Playbook not found or not provided.\x1b[0m');
  }

  if (ctx.opencode) {
    const mcp = (ctx.opencode as Record<string, unknown>).mcp as Record<string, unknown> | undefined;
    console.log(`  \x1b[36m  OpenCode Config:\x1b[0m \x1b[90m${mcp?.trello ? '\u2713 Trello MCP' : '\u2717 No MCP'}\x1b[0m`);
  }
  console.log(`  \x1b[36m  OpenKB Glossary:\x1b[0m \x1b[90m${ctx.openkb.glossary.length} terms\x1b[0m`);

  console.log('');
  console.log('  \x1b[32m  \u2705  Context loaded. Ready for orchestration.\x1b[0m');
  console.log('');
}

// ── Run ──

interface RunResult {
  success?: boolean;
  type: string;
  name: string;
  error?: string;
}

async function cmdRun(): Promise<void> {
  const args = process.argv.slice(3);
  const getOpt = (f: string): string | undefined => {
    const i = args.indexOf(f);
    return i !== -1 ? args[i + 1] : undefined;
  };
  const playbookPath = getOpt('--playbook');
  const isDryRun = args.includes('--dry-run') || args.includes('-n');

  // Known flags that take a value (skip both flag and value)
  const knownFlagArgs = ['--playbook', '--board', '--openkb', '--opencode', '--intent'];
  // Extra args passed to intent handler (--name, --task, --list, --desc, --member, --color)
  const extraArgs: Record<string, unknown> = {};

  // Find intent and collect extra args
  let intent = getOpt('--intent') || '';
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') || args[i].startsWith('-')) {
      if (knownFlagArgs.includes(args[i])) {
        i++; // skip next arg (value)
        continue;
      }
      // Collect extra intent args: --name value --task value etc.
      const key = args[i].replace(/^--?/, '');
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        extraArgs[key] = args[i + 1];
        i++;
      } else {
        extraArgs[key] = true;
      }
      continue;
    }
    intent += (intent ? ' ' : '') + args[i];
  }

  if (!intent) {
    console.error('  \x1b[31m  \u2717 Intent required.\x1b[0m');
    console.log(
      '  \x1b[37m  Usage:\x1b[0m bun scripts/kaede.ts run \x1b[36m--playbook <path>\x1b[0m \x1b[90m"intent" [--name ...] [--task ...]\x1b[0m',
    );
    console.log(
      '  \x1b[37m  Example:\x1b[0m kaede run --playbook apps/docs/content/playbook-template.md "buat board" --name "Sprint 1"',
    );
    return;
  }

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║    KAEDE — Execute Intent            \x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');
  console.log(`  \x1b[36m  Intent:\x1b[0m \x1b[90m"${intent}"\x1b[0m`);
  if (isDryRun) {
    console.log('  \x1b[33m  \u26a0  DRY RUN — no changes will be made.\x1b[0m');
  }

  if (playbookPath && existsSync(playbookPath)) {
    const { parsePlaybook, executeIntent } = await import(
      resolve(KAEDE_SRC, 'orchestrator')
    );
    const { TrelloMCPClient } = await import(resolve(KAEDE_SRC, 'trello-client'));

    const content = readFileSync(playbookPath, 'utf-8');
    const playbook = parsePlaybook(content);

    console.log(
      `  \x1b[36m  Playbook loaded:\x1b[0m \x1b[90m${playbook.workflow.lists.length} lists, ${playbook.roles.length} roles\x1b[0m`,
    );

    if (isDryRun) {
      console.log('');
      console.log('  \x1b[36m  Would execute:\x1b[0m \x1b[90m"' + intent + '"\x1b[0m');
      console.log(
        `  \x1b[36m  Intents available:\x1b[0m \x1b[90mmulai sprint, buat card, assign, buat label, arsipkan, pindah semua, buat board, komentar, report, tutup sprint, undo, batch update, sprint report\x1b[0m`,
      );
      console.log(`  \x1b[36m  Workflow lists:\x1b[0m \x1b[90m${playbook.workflow.lists.join(', ')}\x1b[0m`);
      console.log('');
      console.log('  \x1b[32m  \u2705  Dry run complete. Pass --board <id> to execute.\x1b[0m');
      console.log('');
      return;
    }

    console.log('');
    console.log('  \x1b[36m  Connecting to Trello MCP Server...\x1b[0m');

    const client = new TrelloMCPClient();
    try {
      await client.connect();
      console.log('  \x1b[32m  \u2713 Connected.\x1b[0m');
      console.log('');
      console.log('  \x1b[36m  Executing intent...\x1b[0m');

      let boardId = getOpt('--board');
      if (!boardId) {
        console.log('  \x1b[33m  \u26a0  No --board provided. Auto-detecting...\x1b[0m');
        try {
          const boards = await client.listBoards() as Array<{ id: string; name: string }>;
          if (boards.length === 0) {
            console.log('  \x1b[31m  \u2717 No boards found. Cannot execute.\x1b[0m');
            return;
          }
          boardId = boards[0].id;
          console.log(`  \x1b[32m  \u2713 Using board: ${boards[0].name} (${boardId})\x1b[0m`);
        } catch (err) {
          console.log(`  \x1b[31m  \u2717 Failed to auto-detect board: ${(err as Error).message}\x1b[0m`);
          return;
        }
      }
      const results = await executeIntent(client, intent, playbook, boardId, extraArgs) as RunResult[];
      console.log('');
      for (const r of results) {
        if (r.success) {
          console.log(`  \x1b[32m  \u2713 ${r.type}: ${r.name}\x1b[0m`);
          // Show detail for query results
          if ((r as any).detail) {
            const detail = (r as any).detail;
            if (Array.isArray(detail)) {
              for (const item of detail) {
                if (typeof item === 'object' && item !== null) {
                  const name = (item.name || item.title || '(unnamed)') as string;
                  const id = (item.id || '') as string;
                  const url = (item.url || '') as string;
                  if (url) {
                    console.log(`    \x1b[90m\u2022 ${name} \u2014 ${url}\x1b[0m`);
                  } else if (id) {
                    console.log(`    \x1b[90m\u2022 ${name} (${id})\x1b[0m`);
                  } else {
                    console.log(`    \x1b[90m\u2022 ${name}\x1b[0m`);
                  }
                } else {
                  console.log(`    \x1b[90m\u2022 ${item}\x1b[0m`);
                }
              }
            } else if (typeof detail === 'object') {
              for (const [key, value] of Object.entries(detail)) {
                if (Array.isArray(value)) {
                  console.log(`  \x1b[36m    ${key}:\x1b[0m \x1b[90m${value.length} items\x1b[0m`);
                  for (const item of value.slice(0, 10)) {
                    if (typeof item === 'object' && item !== null) {
                      const itemName = (item as any).name || (item as any).title || JSON.stringify(item);
                      console.log(`      \x1b[90m\u2022 ${itemName}\x1b[0m`);
                    }
                  }
                  if (value.length > 10) {
                    console.log(`      \x1b[90m... and ${value.length - 10} more\x1b[0m`);
                  }
                } else {
                  console.log(`  \x1b[36m    ${key}:\x1b[0m \x1b[90m${value}\x1b[0m`);
                }
              }
            }
          }
        } else {
          console.log(`  \x1b[31m  \u2717 ${r.type}: ${r.name} \u2014 ${r.error}\x1b[0m`);
        }
      }

      console.log('');
      console.log('  \x1b[32m  \u2705  Intent execution completed.\x1b[0m');
    } catch (err) {
      console.error('  \x1b[31m  \u2717 Execution failed:\x1b[0m', (err as Error).message);
    } finally {
      client.close();
    }
  } else {
    console.log('  \x1b[33m  \u26a0  Playbook not provided. Execute with generic defaults.\x1b[0m');
  }
  console.log('');
}

// ── Template ──

async function cmdTemplate(): Promise<void> {
  const args = process.argv.slice(3);
  const subcmd = args[0];
  if (!subcmd) {
    console.error('  \x1b[31m  \u2717 Subcommand required.\x1b[0m');
    console.log('  \x1b[37m  Usage: kaede template \x1b[36mlist|show|apply\x1b[0m');
    return;
  }

  const { listTemplates, getTemplate, applyTemplate, loadTemplatesFromDir } = await import(
    resolve(KAEDE_SRC, 'templates')
  );

  if (subcmd === 'list') {
    const templates = listTemplates();
    console.log('');
    console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
    console.log('  \x1b[35m║     KAEDE — Card Templates          \x1b[0m');
    console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
    console.log('');
    console.log(`  \x1b[36m  ${templates.length} templates available\x1b[0m`);
    console.log('');
    for (const t of templates) {
      const checklistCount = t.checklistTemplates?.length || 0;
      const hasComment = t.commentTemplate ? '\x1b[32m\u2713\x1b[0m' : '\x1b[90m-\x1b[0m';
      const labels = (t.defaultLabels as string[] | undefined)?.join(', ') || '\x1b[90m(none)\x1b[0m';
      console.log(`  \x1b[36m  \u2022 ${t.name}\x1b[0m`);
      console.log(`      Checklist: ${checklistCount} items | Comment: ${hasComment} | Labels: ${labels}`);
    }
    console.log('');
  } else if (subcmd === 'show') {
    const name = args[1];
    if (!name) {
      console.error('  \x1b[31m  \u2717 Template name required.\x1b[0m');
      console.log('  \x1b[37m  Usage: kaede template show \x1b[36m<name>\x1b[0m');
      return;
    }
    const template = getTemplate(name);
    if (!template) {
      console.error('  \x1b[31m  \u2717 Template not found: ' + name + '\x1b[0m');
      return;
    }
    console.log('');
    console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
    console.log('  \x1b[35m║     KAEDE — Template Detail         \x1b[0m');
    console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
    console.log('');
    console.log(`  \x1b[36m  Name:\x1b[0m ${template.name}`);
    console.log(`  \x1b[36m  Description template:\x1b[0m`);
    console.log(`  \x1b[90m  ${template.descriptionTemplate.split('\n').join('\n  ')}\x1b[0m`);
    console.log('');
    if (template.checklistTemplates?.length) {
      console.log(`  \x1b[36m  Checklist items (${template.checklistTemplates.length}):\x1b[0m`);
      for (const item of template.checklistTemplates) {
        console.log(`    \x1b[90m\u2022 ${item}\x1b[0m`);
      }
    }
    if (template.commentTemplate) {
      console.log(`  \x1b[36m  Comment template:\x1b[0m`);
      console.log(`  \x1b[90m  ${template.commentTemplate.split('\n').join('\n  ')}\x1b[0m`);
    }
    console.log('');
  } else if (subcmd === 'apply') {
    const name = args[1];
    if (!name) {
      console.error('  \x1b[31m  \u2717 Template name required.\x1b[0m');
      console.log('  \x1b[37m  Usage: kaede template apply \x1b[36m<name>\x1b[0m [--task "Title"] [--want "..."] [--role "..."] [--benefit "..."]');
      return;
    }
    const getOpt = (f: string) => {
      const i = args.indexOf(f);
      return i !== -1 ? args[i + 1] : undefined;
    };
    const vars: Record<string, string> = {
      task: getOpt('--task') || getOpt('-t') || name,
      role: getOpt('--role') || getOpt('-r') || '',
      want: getOpt('--want') || getOpt('-w') || '',
      benefit: getOpt('--benefit') || getOpt('-b') || '',
      feature: getOpt('--feature') || getOpt('-f') || '',
      techStack: getOpt('--tech') || '',
      convention: getOpt('--convention') || getOpt('-c') || '',
      reference: getOpt('--reference') || getOpt('--ref') || '',
      priority: getOpt('--priority') || getOpt('-p') || '',
      assignee: getOpt('--assignee') || getOpt('-a') || '',
      sprint: getOpt('--sprint') || getOpt('-s') || '',
      technologies: getOpt('--technologies') || '',
      description: getOpt('--desc') || getOpt('-d') || '',
    };

    const result = applyTemplate(name, vars);
    console.log('');
    console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
    console.log('  \x1b[35m║     KAEDE — Applied Template        \x1b[0m');
    console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
    console.log('');
    console.log(`  \x1b[36m  Template: \x1b[0m${name}`);
    console.log(`  \x1b[36m  Task: \x1b[0m${vars.task}`);
    console.log('');
    console.log('  \x1b[36m  Description:\x1b[0m');
    console.log(`  \x1b[90m  ${result.description.split('\n').join('\n  ')}\x1b[0m`);
    console.log('');
    if (result.checklist.length) {
      console.log('  \x1b[36m  Checklist:\x1b[0m');
      for (const item of result.checklist) {
        console.log(`    \x1b[90m\u2022 ${item}\x1b[0m`);
      }
      console.log('');
    }
    if (result.comment) {
      console.log('  \x1b[36m  Comment:\x1b[0m');
      console.log(`  \x1b[90m  ${result.comment}\x1b[0m`);
      console.log('');
    }
    if (result.labels?.length) {
      console.log(`  \x1b[36m  Labels: \x1b[0m\x1b[90m${result.labels.join(', ')}\x1b[0m`);
      console.log('');
    }
  } else {
    console.error('  \x1b[31m  \u2717 Unknown subcommand: ' + subcmd + '\x1b[0m');
    console.log('  \x1b[37m  Available: list, show, apply\x1b[0m');
  }
}

// ── Report ──

async function cmdReport(): Promise<void> {
  const args = process.argv.slice(3);
  const subcmd = args[0] || 'sprint';

  if (subcmd !== 'sprint') {
    console.error('  \x1b[31m  \u2717 Unknown subcommand: ' + subcmd + '\x1b[0m');
    console.log('  \x1b[37m  Usage: kaede report sprint \x1b[36m--board <id>\x1b[0m [--name "Sprint Name"] [--list "List1,List2"]');
    return;
  }

  const getOpt = (f: string) => {
    const i = args.indexOf(f);
    return i !== -1 ? args[i + 1] : undefined;
  };
  const boardId = getOpt('--board') || '';
  const sprintName = getOpt('--name') || getOpt('-n') || 'Sprint Report';
  const listStr = getOpt('--list') || getOpt('-l') || '';
  const listNames = listStr ? listStr.split(',').map((s) => s.trim()) : [];

  if (!boardId) {
    console.error('  \x1b[31m  \u2717 --board <id> required.\x1b[0m');
    return;
  }

  const secrets = getSecrets();
  if (!secrets.TRELLO_API_KEY || !secrets.TRELLO_TOKEN) {
    console.error('  \x1b[31m  \u2717 Trello credentials not found. Run `kaede setup` first.\x1b[0m');
    return;
  }

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║     KAEDE — Sprint Report           \x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');

  const { TrelloMCPClient } = await import(resolve(KAEDE_SRC, 'trello-client'));
  const { generateSprintReport } = await import(resolve(KAEDE_SRC, 'orchestrator'));

  const client = new TrelloMCPClient();
  try {
    await client.connect();
    console.log(`  \x1b[36m  Generating report for "${sprintName}"...\x1b[0m`);
    const report = await generateSprintReport(client, boardId, listNames, sprintName);
    console.log('');
    console.log(report);
  } catch (err) {
    console.error('  \x1b[31m  \u2717 Failed:\x1b[0m', (err as Error).message);
  } finally {
    client.close();
  }
}

// ── Archive Sprint ──

async function cmdArchiveSprint(): Promise<void> {
  const args = process.argv.slice(3);
  const getOpt = (f: string) => {
    const i = args.indexOf(f);
    return i !== -1 ? args[i + 1] : undefined;
  };
  const boardId = getOpt('--board');
  const listName = getOpt('--list') || getOpt('-l') || 'Done';
  const archiveAction = getOpt('--action') || getOpt('-a') || 'all';

  if (!boardId) {
    console.error('  \x1b[31m  \u2717 --board <id> required.\x1b[0m');
    console.log('  \x1b[37m  Usage: kaede archive sprint --board <id> [--list "Done"|"Review"] [--action all|closed]\x1b[0m');
    return;
  }

  const secrets = getSecrets();
  if (!secrets.TRELLO_API_KEY || !secrets.TRELLO_TOKEN) {
    console.error('  \x1b[31m  \u2717 Trello credentials not found.\x1b[0m');
    return;
  }

  const api = 'https://api.trello.com/1';
  const auth = `key=${secrets.TRELLO_API_KEY}&token=${secrets.TRELLO_TOKEN}`;

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║     KAEDE — Archive Sprint          \x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');

  try {
    // Find the list
    const listsRes = await fetch(`${api}/boards/${boardId}/lists?${auth}&fields=name,id`);
    const lists = await listsRes.json() as Array<{ name: string; id: string }>;

    // Resolve target lists
    const targetLists = listName === 'all'
      ? lists.filter((l) => l.name.toLowerCase() !== 'backlog')
      : lists.filter((l) => l.name.toLowerCase() === listName.toLowerCase());

    if (targetLists.length === 0) {
      console.error(`  \x1b[31m  \u2717 No lists found matching "${listName}".\x1b[0m`);
      return;
    }

    console.log(`  \x1b[36m  Archiving cards from ${targetLists.length} list(s)...\x1b[0m`);

    let archived = 0;
    for (const list of targetLists) {
      const cardsRes = await fetch(`${api}/lists/${list.id}/cards?${auth}&fields=name,id,closed,dueComplete`);
      const cards = await cardsRes.json() as Array<{ id: string; name: string; closed?: boolean; dueComplete?: boolean }>;

      const toArchive = archiveAction === 'closed'
        ? cards.filter((c) => c.dueComplete)
        : cards;

      for (const card of toArchive) {
        await fetch(`${api}/cards/${card.id}?${auth}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ closed: true }),
        });
        archived++;
        process.stdout.write(`  \x1b[32m  \u2713 Archived: ${card.name.slice(0, 50)}\x1b[0m\n`);
      }
    }

    console.log('');
    console.log(`  \x1b[32m  \u2705  Done: ${archived} cards archived.\x1b[0m`);
  } catch (err) {
    console.error('  \x1b[31m  \u2717 Failed:\x1b[0m', (err as Error).message);
  }
  console.log('');
}

// ── Install ──

async function cmdInstall(): Promise<void> {
  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║        KAEDE — Global Install            \x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════════╝\x1b[0m');
  console.log('');

  const { execSync } = await import('child_process');
  const globalDir = KAEDE_GLOBAL_DIR;
  const kaedeConfigDir = resolve(homedir(), '.config', 'kaede');

  // 1. Copy the complete source tree to ~/.kaede/ (tanpa mereduksi komponen apa pun)
  console.log(`  \x1b[36m  Installing to ${globalDir}...\x1b[0m`);
  mkdirSync(globalDir, { recursive: true });

  const EXCLUDE_DIRS = new Set([
    'node_modules', '.git', '.next', '.netlify', '.playwright-mcp',
    '.sisyphus', '.tmp', '.tmp-gh-pages', '.worktree-gh-pages',
  ]);
  const EXCLUDE_REL = new Set(['dist/release']);
  const EXCLUDE_FILES = new Set(['secrets.env', 'bun.lock']);

  const copyTree = (from: string, to: string, rel = ''): void => {
    for (const entry of readdirSync(from)) {
      const relPath = rel ? `${rel}/${entry}` : entry;
      const src = resolve(from, entry);
      const dest = resolve(to, entry);
      if (statSync(src).isDirectory()) {
        if (EXCLUDE_DIRS.has(entry) || EXCLUDE_REL.has(relPath)) continue;
        mkdirSync(dest, { recursive: true });
        copyTree(src, dest, relPath);
      } else {
        if (EXCLUDE_FILES.has(relPath)) continue;
        writeFileSync(dest, readFileSync(src));
      }
    }
  };

  try {
    if (resolve(KAEDE_DIR) === resolve(globalDir)) {
      console.log('  \x1b[32m  \u2713 Running from install root, source copy not needed\x1b[0m');
    } else {
      copyTree(KAEDE_DIR, globalDir);
      console.log('  \x1b[32m  \u2713 Complete source tree copied to ~/.kaede/\x1b[0m');
    }
  } catch (err) {
    console.log(`  \x1b[31m  \u2717 Copy failed: ${(err as Error).message}\x1b[0m`);
    throw err;
  }

  // 2. Build MCP servers, salin dist, & daftarkan global OpenCode MCP config
  await ensureMcpConfig({ repair: false, force: true });

  // 3. bun link (global `kaede` command) — run from the install root so the
  //    global command always points at ~/.kaede, not the source checkout.
  console.log('  \x1b[36m  Linking globally via bun link...\x1b[0m');
  try {
    execSync('bun link', { cwd: globalDir, stdio: 'inherit' });
    console.log('  \x1b[32m  \u2713 \x1b[0m\x1b[36mkaede\x1b[0m\x1b[32m command available globally\x1b[0m');
    try {
      const { existsSync } = await import('fs');
      const link = resolve(homedir(), '.bun', 'bin', 'kaede');
      if (!existsSync(link)) console.log('  \x1b[33m  \u26a0  kaede symlink missing at ~/.bun/bin/kaede\x1b[0m');
    } catch {}
  } catch {
    console.log('  \x1b[33m  \u26a0  bun link failed, creating fallback script...\x1b[0m');
    // Fallback: create a wrapper script
    try {
      const wrapper = `@echo off\r\nbun "${resolve(globalDir, 'scripts', 'kaede.ts').replace(/\\/g, '\\\\')}" %*\r\n`;
      writeFileSync(resolve(globalDir, 'kaede.cmd'), wrapper, 'utf-8');
      console.log(`  \x1b[33m  \u26a0  Created fallback at ${resolve(globalDir, 'kaede.cmd')}\x1b[0m`);
      console.log(
        '  \x1b[33m      Add it to your PATH or run: \x1b[0m\x1b[36msetx PATH "%PATH%;%USERPROFILE%\\.kaede"\x1b[0m',
      );
    } catch {}
  }

  // 4. Setup credentials directory
  mkdirSync(kaedeConfigDir, { recursive: true });

  console.log('');
  console.log('  \x1b[32m  \u2705  KAEDE installed globally!\x1b[0m');
  console.log('');
  console.log('  \x1b[90m     Usage:\x1b[0m');
  console.log('  \x1b[90m       \x1b[36mkaede setup\x1b[0m          \u2014 onboarding lengkap (auth + MCP + verify)');
  console.log('  \x1b[90m       \x1b[36mkaede auth login\x1b[0m    \u2014 login OAuth Trello (browser)');
  console.log('  \x1b[90m       \x1b[36mkaede init\x1b[0m <dir>     \u2014 init project with KAEDE');
  console.log('  \x1b[90m       \x1b[36mkaede today\x1b[0m          \u2014 show today\'s Trello tasks');
  console.log('  \x1b[90m       \x1b[36mkaede status --mcp\x1b[0m   \u2014 check MCP connection');
  console.log('  \x1b[90m       \x1b[36mkaede run\x1b[0m "intent"   \u2014 execute intent from playbook');
  console.log('');
  console.log('  \x1b[90m     Two MCP servers registered globally in\x1b[0m');
  console.log('  \x1b[90m     ~/.config/opencode/opencode.json:\x1b[0m');
  console.log(
    '  \x1b[90m       \x1b[36mmcp.trello\x1b[0m    \u2014 kaede-trello (47 tools, fallback jika upstream tidak tersedia)\x1b[0m',
  );
  console.log('  \x1b[90m       \x1b[36mmcp.kaede\x1b[0m     \u2014 45 orchestration tools\x1b[0m');
  console.log('');
}

// ── Start API Server ──

async function cmdStart(): Promise<void> {
  const { startApiServer } = await import(resolve(KAEDE_SRC, 'api-server'));
  const server = await startApiServer(parseInt(process.argv[3], 10) || 3456);

  process.on('SIGINT', () => {
    console.log('\n  \x1b[33m  Shutting down API server...\x1b[0m');
    server.close();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    server.close();
    process.exit(0);
  });
}

// ── Test Tools ──

async function cmdTestTools(): Promise<void> {
  const secrets = getSecrets();
  if (!secrets.TRELLO_API_KEY || !secrets.TRELLO_TOKEN) {
    console.error('  \x1b[31m  \u2717 Trello credentials not found.\x1b[0m');
    console.error('  \x1b[33m  Run `bun scripts/kaede.ts setup` first.\x1b[0m');
    return;
  }

  const { TrelloMCPClient } = await import(resolve(KAEDE_SRC, 'trello-client'));

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║     KAEDE — Test MCP Tools           \x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');

  const tools: Array<[string, Record<string, unknown>]> = [
    ['list_workspaces', {}],
    ['list_boards', {}],
    ['get_my_cards', {}],
  ];
  const total = tools.length;

  const client = new TrelloMCPClient();
  try {
    const timeout = setTimeout(() => {
      throw new Error('Connection timed out (30s)');
    }, 30000);
    await client.connect();
    clearTimeout(timeout);
    console.log(`  \x1b[32m  \u2713 Connected to MCP Server\x1b[0m`);
    console.log('');

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < tools.length; i++) {
      const [tool, params] = tools[i];
      process.stdout.write(`  [${i + 1}/${total}] ${tool}... `);
      try {
        const result = await client.callTool(tool, params) as Record<string, unknown>;
        const summary = Object.keys(result)
          .slice(0, 3)
          .map((k) => `${k}: ${Array.isArray(result[k]) ? (result[k] as unknown[]).length : typeof result[k]}`)
          .join(', ');
        process.stdout.write(`\x1b[32m\u2713\x1b[0m \x1b[90m(${summary})\x1b[0m\n`);
        passed++;
      } catch (err) {
        process.stdout.write(`\x1b[31m\u2717\x1b[0m \x1b[90m${(err as Error).message.slice(0, 80)}\x1b[0m\n`);
        failed++;
      }
    }

    console.log('');
    console.log(`  \x1b[36m  Result: ${passed}/${total} passed, ${failed} failed\x1b[0m`);
    if (passed === total) {
      console.log('  \x1b[32m  \u2705  All MCP tools responding.\x1b[0m');
    } else {
      console.log('  \x1b[33m  \u26a0  Some tools failed. Check credentials or board config.\x1b[0m');
    }
  } catch (err) {
    console.error(`  \x1b[31m  \u2717 ${(err as Error).message}\x1b[0m`);
  } finally {
    client.close();
  }
  console.log('');
}

// ── Check Copy & Brand Voice ──

async function cmdCheckCopy(): Promise<void> {
  const filePath = process.argv[3];
  if (!filePath) {
    console.log('');
    console.log('  \x1b[31m  ✗ Harap sebutkan path file markdown: `kaede check-copy <file.md>`\x1b[0m');
    console.log('  \x1b[90m    Contoh: kaede check-copy article.md --channel seo-article\x1b[0m');
    console.log('');
    return;
  }

  const resolved = resolve(process.cwd(), filePath);
  if (!existsSync(resolved)) {
    console.log(`  \x1b[31m  ✗ File tidak ditemukan: ${resolved}\x1b[0m`);
    return;
  }

  const content = readFileSync(resolved, 'utf-8');
  const channelIdx = process.argv.indexOf('--channel');
  const channel = channelIdx !== -1 ? process.argv[channelIdx + 1] : undefined;

  const { validateBrandVoice } = await import(resolve(KAEDE_DIR, 'packages', 'kaede', 'src', 'brand-voice'));
  const res = validateBrandVoice(content, { channel: channel as any });

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║        KAEDE — Brand Voice & Copy Check      ║\x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════════════╝\x1b[0m');
  console.log('');
  console.log(`  File        \x1b[36m${filePath}\x1b[0m`);
  console.log(`  Persona     \x1b[33m${res.persona}\x1b[0m`);
  console.log(`  Channel     \x1b[90m${res.channel}\x1b[0m`);
  console.log(`  Words       \x1b[90m${res.metrics.wordCount} kata (~${res.metrics.readingTimeMinutes} mnt baca)\x1b[0m`);

  const scoreColor = res.score >= 80 ? '\x1b[32m' : res.score >= 60 ? '\x1b[33m' : '\x1b[31m';
  console.log(`  Score       ${scoreColor}${res.score} / 100 ${res.compliant ? '✓ PASSED' : '✗ NEEDS REVISION'}\x1b[0m`);
  console.log('');

  if (res.passedChecks.length > 0) {
    console.log('  \x1b[32mPassed Checks:\x1b[0m');
    for (const p of res.passedChecks) {
      console.log(`    \x1b[32m✓\x1b[0m ${p}`);
    }
    console.log('');
  }

  if (res.violations.length > 0) {
    console.log('  \x1b[31mItems Needing Attention:\x1b[0m');
    for (const v of res.violations) {
      const badge = v.severity === 'error' ? '\x1b[31m[ERROR]\x1b[0m' : v.severity === 'warning' ? '\x1b[33m[WARN]\x1b[0m' : '\x1b[36m[TIP]\x1b[0m';
      console.log(`    ${badge} ${v.message}`);
      if (v.snippet) console.log(`      \x1b[90mSnippet: "${v.snippet}"\x1b[0m`);
      if (v.suggestion) console.log(`      \x1b[32mSaran: ${v.suggestion}\x1b[0m`);
    }
    console.log('');
  }
}

// ── Agent-to-Agent Handoff ──

async function cmdHandoff(): Promise<void> {
  const cardId = process.argv[3];
  if (!cardId || cardId.startsWith('--')) {
    console.log('');
    console.log('  \x1b[31m  ✗ Harap sebutkan cardId: `kaede handoff <cardId> --to <agent> --action <action>`\x1b[0m');
    console.log('  \x1b[90m    Contoh: kaede handoff EozizbLs --to agent-hermes --action publish_draft --execute\x1b[0m');
    console.log('');
    return;
  }

  const toIdx = process.argv.indexOf('--to');
  const actionIdx = process.argv.indexOf('--action');
  const instructionsIdx = process.argv.indexOf('--instructions');
  const shouldExecute = process.argv.includes('--execute') || process.argv.includes('--post');

  const targetAgent = toIdx !== -1 ? process.argv[toIdx + 1] : '';
  const action = actionIdx !== -1 ? process.argv[actionIdx + 1] : '';
  const instructions = instructionsIdx !== -1 ? process.argv[instructionsIdx + 1] : undefined;

  if (!targetAgent || !action) {
    console.log('  \x1b[31m  ✗ Flags --to <agent> dan --action <action> wajib diisi.\x1b[0m');
    return;
  }

  const { createHandoffDirective } = await import(resolve(KAEDE_DIR, 'packages', 'kaede', 'src', 'agent-handoff'));
  const { comment, directive } = createHandoffDirective({
    targetAgent,
    cardId,
    action,
    instructions,
  });

  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║        KAEDE — Agent-to-Agent Handoff        ║\x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════════════╝\x1b[0m');
  console.log('');
  console.log(`  ID          \x1b[36m${directive.id}\x1b[0m`);
  console.log(`  Card ID     \x1b[36m${cardId}\x1b[0m`);
  console.log(`  Target      \x1b[33m@${targetAgent}\x1b[0m`);
  console.log(`  Action      \x1b[32m${action}\x1b[0m`);
  console.log('');

  if (shouldExecute) {
    console.log('  \x1b[90m  Posting handoff comment to Trello card...\x1b[0m');
    const secrets = getSecrets();
    if (!secrets.TRELLO_API_KEY || !secrets.TRELLO_TOKEN) {
      console.log('  \x1b[31m  ✗ Trello credentials not found. Run `kaede auth login` first.\x1b[0m');
      return;
    }
    const api = 'https://api.trello.com/1';
    const auth = `key=${secrets.TRELLO_API_KEY}&token=${secrets.TRELLO_TOKEN}`;
    const res = await fetch(`${api}/cards/${cardId}/actions/comments?${auth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: comment }),
    });
    if (res.ok) {
      console.log('  \x1b[32m  ✓ Handoff directive successfully posted to Trello card!\x1b[0m');
    } else {
      console.log(`  \x1b[31m  ✗ Failed to post comment: ${res.statusText}\x1b[0m`);
    }
  } else {
    console.log('  \x1b[90mGenerated Directive Comment (pass --execute to post directly):\x1b[0m');
    console.log('  ────────────────────────────────────────────────────────────');
    console.log(comment);
    console.log('  ────────────────────────────────────────────────────────────');
  }
  console.log('');
}

// ── Help ──

function cmdHelp(): void {
  console.log('');
  console.log('  \x1b[35mKAEDE — Koneksi Automated Environment DE\x1b[0m');
  console.log('  \x1b[90mCLI tool untuk manajemen Trello & AI Agent\x1b[0m');
  console.log('');
  console.log('  \x1b[37mUsage:\x1b[0m');
  console.log('    bun scripts/kaede.ts \x1b[36m<command>\x1b[0m');
  console.log('');
  console.log('  \x1b[37mCommands:\x1b[0m');
  console.log('    \x1b[36msetup\x1b[0m     \x1b[90mOnboarding lengkap: auth OAuth + MCP config + verifikasi. Flags: --yes, --no-mcp, --no-init\x1b[0m');
  console.log('    \x1b[36mauth\x1b[0m      \x1b[90mAuth Trello: login | status | logout | token | switch | list | save | delete [--manual] [--raw] [--profile <name>]\x1b[0m');
  console.log('    \x1b[36mtoday\x1b[0m     \x1b[90mTampilkan task Trello hari ini\x1b[0m');
  console.log(
    '    \x1b[36minit\x1b[0m      \x1b[90mInit KAEDE di project. Flags: --playbook <path>, --tech <stack>, --db <type>\x1b[0m',
  );
  console.log('    \x1b[36mpush\x1b[0m      \x1b[90mBuat Trello cards dari file markdown\x1b[0m');
  console.log('    \x1b[36menv\x1b[0m       \x1b[90mExport credentials (--bash, --ps, --cmd)\x1b[0m');
  console.log('    \x1b[36mstatus\x1b[0m    \x1b[90mCek status konfigurasi KAEDE (--mcp untuk test koneksi)\x1b[0m');
  console.log('    \x1b[36mplaybook\x1b[0m  \x1b[90mParse/show playbook (parse <path> | show <path>)\x1b[0m');
  console.log('    \x1b[36morchestrate\x1b[0m \x1b[90mLoad context (--playbook <path> [--detail])\x1b[0m');
  console.log(
    '    \x1b[36mrun\x1b[0m       \x1b[90mExecute intent (--playbook <path> [--board <id>] [--dry-run] [--intent <intent>])\x1b[0m',
  );
  console.log('    \x1b[36mbuild\x1b[0m     \x1b[90mBuild MCP server (dist/mcp-server.js)\x1b[0m');
  console.log('    \x1b[36mstart\x1b[0m     \x1b[90mStart API server (HTTP bridge for frontend) [port]\x1b[0m');
  console.log('    \x1b[36mtest-tools\x1b[0m \x1b[90mUji koneksi MCP tools (butuh Trello credentials)\x1b[0m');
  console.log('    \x1b[36mtemplate\x1b[0m  \x1b[90mCard templates: list, show <name>, apply <name> [--task "x"]\x1b[0m');
  console.log('    \x1b[36mcheck-copy\x1b[0m \x1b[90mValidasi markdown copy terhadap Brand Voice & Tone (<file.md> [--channel <name>])\x1b[0m');
  console.log('    \x1b[36mhandoff\x1b[0m    \x1b[90mAgent-to-agent handoff event (<cardId> --to <agent> --action <act> [--execute])\x1b[0m');
  console.log('    \x1b[36mreport\x1b[0m    \x1b[90mSprint report: sprint --board <id> [--name "Sprint X"] [--list "Done,Review"]\x1b[0m');
  console.log('    \x1b[36marchive\x1b[0m   \x1b[90mArchive sprint: sprint --board <id> [--list "Done"] [--action all|closed]\x1b[0m');
  console.log('    \x1b[36minstall\x1b[0m   \x1b[90mInstall KAEDE globally via bun link\x1b[0m');
  console.log('    \x1b[36mhelp\x1b[0m      \x1b[90mTampilkan pesan ini\x1b[0m');
  console.log('');
  console.log('  \x1b[37mExamples:\x1b[0m');
  console.log('    bun scripts/kaede.ts init                              # interactive');
  console.log('    bun scripts/kaede.ts init ../project --tech Laravel --db MySQL');
  console.log('    bun scripts/kaede.ts init . --playbook playbook.md    # init + playbook ref');
  console.log('    bun scripts/kaede.ts push tasks.md                     # file mode');
  console.log('    bun scripts/kaede.ts push tasks.md --board "My Board" --list "To Do"');
  console.log('    bun scripts/kaede.ts setup');
  console.log('    bun scripts/kaede.ts setup --yes                  # non-interaktif');
  console.log('    bun scripts/kaede.ts auth login                   # OAuth browser (auto)');
  console.log('    bun scripts/kaede.ts auth login --manual          # print URL + paste token');
  console.log('    bun scripts/kaede.ts auth status');
  console.log('    bun scripts/kaede.ts auth logout');
  console.log('    bun scripts/kaede.ts auth token --raw             # untuk scripting');
  console.log('    bun scripts/kaede.ts check-copy article.md --channel seo-article');
  console.log('    bun scripts/kaede.ts handoff EozizbLs --to agent-hermes --action publish_draft');
  console.log('    bun scripts/kaede.ts today');
  console.log('    bun scripts/kaede.ts env | iex                 # Windows PowerShell');
  console.log('    bun scripts/kaede.ts env --bash | source /dev/stdin  # Linux/Mac');
  console.log('    bun scripts/kaede.ts env --cmd | cmd            # Windows CMD');
  console.log('    bun scripts/kaede.ts playbook parse ../playbook/sprint.md');
  console.log('    bun scripts/kaede.ts orchestrate --playbook ../playbook/sprint.md --detail');
  console.log('    bun scripts/kaede.ts run --playbook playbook/sprint.md --intent "Mulai Sprint Alpha"');
  console.log('    bun scripts/kaede.ts run --playbook playbook/sprint.md --board abc123 "Mulai Sprint Alpha"');
  console.log('    bun scripts/kaede.ts run --playbook playbook/sprint.md --dry-run "Mulai Sprint Alpha"');
  console.log('    bun scripts/kaede.ts status --mcp');
  console.log('    bun scripts/kaede.ts build');
  console.log('    bun scripts/kaede.ts start');
  console.log('    bun scripts/kaede.ts start 8080');
  console.log('    bun scripts/kaede.ts test-tools');
  console.log('    bun scripts/kaede.ts install');
  console.log('');
  console.log('  \x1b[37mEnv:\x1b[0m');
  console.log('    \x1b[36mKAEDE_DIR\x1b[0m   \x1b[90mOverride path ke instalasi KAEDE (default: auto-detect)\x1b[0m');
  console.log('');
}

// ─── Main ───

async function main(): Promise<void> {
  const cmd = process.argv[2] || 'help';

  switch (cmd) {
    case 'setup':
      await cmdSetup();
      break;
    case 'auth':
      await cmdAuth();
      break;
    case 'today':
      await cmdToday();
      break;
    case 'init':
      await cmdInit();
      break;
    case 'push':
      await cmdPush();
      break;
    case 'env':
      await cmdEnv();
      break;
    case 'build':
      await cmdBuild();
      break;
    case 'status':
      await cmdStatus();
      break;
    case 'playbook':
      await cmdPlaybook();
      break;
    case 'orchestrate':
      await cmdOrchestrate();
      break;
    case 'run':
      await cmdRun();
      break;
    case 'start':
      await cmdStart();
      break;
    case 'test-tools':
      await cmdTestTools();
      break;
    case 'template':
      await cmdTemplate();
      break;
    case 'check-copy':
    case 'brand-voice':
      await cmdCheckCopy();
      break;
    case 'handoff':
      await cmdHandoff();
      break;
    case 'report':
      await cmdReport();
      break;
    case 'archive':
      await cmdArchiveSprint();
      break;
    case 'install':
      await cmdInstall();
      break;
    case 'help':
    default:
      cmdHelp();
      break;
  }
  readline.close();
}

main().catch((err: Error) => {
  console.error('  \x1b[31m  ✗ Fatal:', err.message, '\x1b[0m');
  process.exit(1);
});
