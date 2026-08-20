/**
 * KAEDE MCP Client — Shared module for Power-Up ↔ MCP Server communication
 *
 * Dua mode deploy (lihat docs/architecture-topology.md):
 *   - Mode 1: localhost → http://localhost:3456 (full orchestrator, 45 tools)
 *   - Mode 2: lainnya → /.netlify/functions/trello-proxy (stateless subset)
 *
 * Auth (Mode 2, per-user OAuth):
 *   - Setiap pengguna authorize akun Trello-nya SENDIRI via popup OAuth
 *     (lihat auth.html). Token per-user disimpan di Trello shared storage
 *     scope MEMBER-PRIVATE (hanya user itu) dan dikirim sebagai
 *     `Authorization: Bearer <token>` per-request.
 *   - Proxy memvalidasi token server-side via /1/tokens/{token} → data yang
 *     dibaca/ditulis hanya milik user tsb (least-privilege). Tidak ada lagi
 *     token service-account bersama di browser.
 *   - Mode 1 (lokal) tidak butuh Bearer — kredensial dipegang server lokal.
 *
 * Usage:
 *   import { KAEDEMCP } from '../lib/mcp-client';
 *   KAEDEMCP.init(t).then(function() {
 *     KAEDEMCP.health().then(console.log);
 *   });
 */

/** Trello Power-Up iframe context (disederhanakan untuk portability). */
export type TrelloContext = any;

const API_BASE_DEFAULT = 'http://localhost:3456';

/** Envelope respons proxy: { success, results } */
export interface ProxyEnvelope {
  success: boolean;
  results?: any;
  error?: string;
}

class McpClient {
  private apiBase = API_BASE_DEFAULT;
  private userToken = '';
  private initialized = false;

  get apiBase(): string {
    return this.apiBase;
  }

  get initialized(): boolean {
    return this.initialized;
  }

  get token(): string {
    return this.userToken;
  }

  /** Set token per-user (dipanggil auth.html setelah OAuth sukses). */
  setToken(token: string): void {
    this.userToken = token || '';
  }

  private detectBase(host: string): string {
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3456';
    return '/.netlify/functions/trello-proxy';
  }

  /** Header JSON — attach per-user Bearer token bila tersedia. */
  private authHeaders(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = Object.assign(
      { 'Content-Type': 'application/json' },
      extra || {},
    );
    if (this.userToken) h['Authorization'] = 'Bearer ' + this.userToken;
    return h;
  }

  /**
   * Normalisasi envelope respons /api/mcp agar sama di kedua mode.
   *   - Proxy:  { success: true, results: <raw array/object> }
   *   - Lokal:  { success: true, results: [{ success, type, detail, ... }] }
   * Membaca mengembalikan `detail` (lokal) atau array mentah (proxy).
   */
  private resolveResults(res: ProxyEnvelope): any {
    if (!res) throw new Error('Empty response');
    if (res.success === false) throw new Error(res.error || 'Request failed');
    const r = res.results;
    if (Array.isArray(r) && r.length && r[0] && typeof r[0] === 'object' && 'success' in r[0]) {
      if (r[0].success === false) throw new Error(r[0].error || 'Intent failed');
      return r[0].detail;
    }
    return r;
  }

  /** Initialize: detect API base + baca token per-user (member-private). */
  init(t?: TrelloContext | null): Promise<void> {
    if (this.initialized) return Promise.resolve();
    const apiPromise: Promise<string | null> =
      t && typeof t.get === 'function'
        ? t.get('board', 'shared', 'apiBase', null)
        : Promise.resolve(null);
    const tokenPromise: Promise<string> =
      t && typeof t.get === 'function'
        ? t.get('member', 'private', 'kaede_token', '')
        : Promise.resolve('');
    return Promise.all([apiPromise, tokenPromise]).then(([stored, token]) => {
      this.apiBase = stored || this.detectBase(window.location.hostname);
      this.userToken = token || '';
      this.initialized = true;
    });
  }

  /** Health check */
  health(): Promise<any> {
    const isLocal =
      this.apiBase.indexOf('localhost') > -1 || this.apiBase.indexOf('127.0.0.1') > -1;
    const url = isLocal ? this.apiBase + '/api/health' : this.apiBase;
    return fetch(url, { method: 'POST' }).then((r) => r.json());
  }

  /** Call an MCP tool via HTTP bridge */
  callTool(name: string, args?: Record<string, unknown>): Promise<any> {
    return fetch(this.apiBase + '/api/tool', {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ name: name, arguments: args || {} }),
    }).then((r) => {
      if (!r.ok) return r.text().then((t) => Promise.reject(new Error(t)));
      return r.json();
    });
  }

  /** Execute a machine intent via /api/mcp (works on local + proxy) */
  callIntent(intent: string, args?: Record<string, unknown>): Promise<any> {
    return fetch(this.apiBase + '/api/mcp', {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ intent: intent, args: args || {} }),
    }).then((r) => {
      if (!r.ok) return r.text().then((t) => Promise.reject(new Error(t)));
      return r.json();
    });
  }

  /** Generate plan from intent */
  generatePlan(goal: string, extra?: Record<string, unknown>): Promise<any> {
    return this.callTool('generate_plan', { goal, ...(extra || {}) });
  }

  /** Execute plan */
  executePlan(plan: unknown[], boards: unknown[]): Promise<any> {
    return this.callTool('execute_plan', { plan, boards: boards || [] });
  }

  /** Enforce playbook compliance */
  enforcePlaybook(
    playbook: string,
    plan: unknown[],
    boards: unknown[],
  ): Promise<any> {
    return this.callTool('enforce_playbook', {
      playbook,
      plan: plan || [],
      boards: boards || [],
    });
  }

  /** Parse playbook markdown */
  parsePlaybook(content: string): Promise<any> {
    return this.callTool('parse_playbook', { content });
  }

  /** List boards via MCP bridge (proxy / local) — token per-user bila di proxy */
  listBoards(): Promise<any> {
    return this.callIntent('list_boards', {}).then((res) => this.resolveResults(res));
  }

  /** Execute MCP intent (legacy endpoint) */
  executeIntent(intent: string, args?: Record<string, unknown>, boardId?: string): Promise<any> {
    return fetch(this.apiBase + '/api/mcp', {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ intent, args: args || {}, boardId: boardId || '' }),
    }).then((r) => r.json());
  }
}

export const KAEDEMCP = new McpClient();
