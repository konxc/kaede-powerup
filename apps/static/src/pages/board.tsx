/**
 * KAEDE — Board Dashboard (SolidJS)
 *
 * Migrasi dari public/board.html. Perilaku identik:
 *   - Status koneksi MCP (health check).
 *   - Board selector (list_boards via bridge — tanpa credential client).
 *   - Playbook Enforcement, Env Stats, dan Per-List Breakdown (read-only).
 */
import { createSignal, For, onMount, Show } from 'solid-js';
import { KAEDEMCP } from '../lib/mcp-client';

const ENV_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  production: { bg: 'rgba(225,112,85,0.15)', text: 'text-kaede-danger', dot: 'bg-red-500' },
  staging: { bg: 'rgba(253,203,110,0.15)', text: 'text-kaede-warning', dot: 'bg-yellow-500' },
  development: { bg: 'rgba(0,184,148,0.15)', text: 'text-kaede-success', dot: 'bg-green-500' },
};

interface BoardItem {
  id: string;
  name: string;
}

interface EnforcementResult {
  safe?: boolean;
  warnings?: Array<{ type: string; message: string; severity?: string }>;
  blockers?: Array<{ type: string; message: string; severity?: string }>;
  summary?: string;
}

interface ListBreakdown {
  listName: string;
  cards: any[];
}

/** Resolve /api/mcp envelope menjadi data mentah (sama untuk local + proxy). */
function resolveIntentResults(res: any): any {
  if (!res || res.success === false) throw new Error((res && res.error) || 'intent failed');
  const r = res.results;
  if (Array.isArray(r) && r.length && r[0] && typeof r[0] === 'object' && 'success' in r[0]) {
    if (r[0].success === false) throw new Error(r[0].error || 'intent failed');
    return r[0].detail;
  }
  return r;
}

export default function BoardDashboard() {
  const t = window.TrelloPowerUp.iframe();
  const currentBoardId = t.getContext().board;

  const [connStatus, setConnStatus] = createSignal('');
  const [connOk, setConnOk] = createSignal(false);
  const [powerupTitle, setPowerupTitle] = createSignal('Power-Up Active');
  const [powerupVersion, setPowerupVersion] = createSignal('KAEDE v1.0.0');
  const [boards, setBoards] = createSignal<BoardItem[]>([]);
  const [enforcement, setEnforcement] = createSignal<EnforcementResult | null>(null);
  const [envStats, setEnvStats] = createSignal<Record<string, number> | null>(null);
  const [breakdown, setBreakdown] = createSignal<ListBreakdown[]>([]);

  function checkMCPConnection() {
    KAEDEMCP.init(t)
      .then(function () {
        return KAEDEMCP.health();
      })
      .then(function (data) {
        setConnOk(true);
        setConnStatus('MCP: Connected (v' + (data.version || '?') + ')');
        setPowerupTitle('Power-Up Active + MCP');
        setPowerupVersion('KAEDE v1.0.0 | API v' + (data.version || '?'));
      })
      .catch(function () {
        setConnOk(false);
        setConnStatus('MCP: Not connected. Run "bun scripts/kaede.mjs start"');
      });
  }

  function loadBoardSelector() {
    KAEDEMCP.listBoards()
      .then(function (res) {
        if (!Array.isArray(res)) return;
        setBoards(res);
      })
      .catch(function () {
        /* ignore */
      });
  }

  function loadEnforcement() {
    t.get('board', 'shared', 'playbook', null)
      .then(function (playbook: string) {
        if (!playbook) return;
        return KAEDEMCP.enforcePlaybook(playbook, [], []).then(function (result: EnforcementResult) {
          if (!result) return;
          const warnings = result.warnings || [];
          const blockers = result.blockers || [];
          if (warnings.length + blockers.length === 0) return;
          setEnforcement(result);
        });
      })
      .catch(function () {
        /* ignore */
      });
  }

  function loadEnvStats() {
    t.get('board', 'shared', 'envStats', {})
      .then(function (stats: Record<string, number>) {
        if (!stats || Object.keys(stats).length === 0) return;
        setEnvStats(stats);
      })
      .catch(function () {
        /* ignore */
      });
  }

  function loadListBreakdown() {
    KAEDEMCP.callIntent('get_board_lists', { boardId: currentBoardId })
      .then(function (res) {
        const lists = resolveIntentResults(res);
        const openLists = lists.filter(function (l: any) {
          return !l.closed;
        });
        const cardPromises = openLists.map(function (list: any) {
          return KAEDEMCP.callIntent('get_cards_by_list', { listId: list.id }).then(function (cardsRes: any) {
            return { listName: list.name, cards: resolveIntentResults(cardsRes) };
          });
        });
        return Promise.all(cardPromises);
      })
      .then(function (listsWithCards: ListBreakdown[]) {
        if (!listsWithCards.some(function (l) { return l.cards.length > 0; })) return;
        setBreakdown(listsWithCards);
      })
      .catch(function () {
        /* ignore */
      });
  }

  onMount(function () {
    checkMCPConnection();
    loadBoardSelector();
    loadEnforcement();
    loadEnvStats();
    loadListBreakdown();
  });

  const enforcementItems = (): Array<{ severity: string; message: string; type: string }> => {
    const e = enforcement();
    if (!e) return [];
    return (e.warnings || [])
      .concat(e.blockers || [])
      .map(function (w) {
        return { severity: w.severity || 'warning', message: w.message, type: w.type };
      });
  };

  return (
    <>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-kaede-text">KAEDE Dashboard</h2>
        <span class="flex items-center justify-center size-6 rounded bg-kaede-primary text-white text-[9px] font-bold">K</span>
      </div>

      {/* MCP Connection Status */}
      <Show when={connStatus()}>
        <div class="flex items-center gap-2 px-3 py-2 bg-kaede-bg rounded-md mb-3">
          <span class={'size-2 rounded-full ' + (connOk() ? 'bg-kaede-success' : 'bg-kaede-warning')}></span>
          <span class="text-sm text-kaede-text">{connStatus()}</span>
        </div>
      </Show>

      {/* Board Selector (t-connect) */}
      <div class="mb-3">
        <label class="text-[11px] font-semibold text-kaede-muted uppercase tracking-wide mb-1">Connected Board</label>
        <select
          class="w-full px-3 py-2 rounded-md border border-kaede-border bg-kaede-bg text-sm text-kaede-text outline-none transition-colors focus:border-kaede-primary"
        >
          <option value="">Select board...</option>
          <For each={boards()}>
            {(b) => <option value={b.id} selected={b.id === currentBoardId}>{b.name}</option>}
          </For>
        </select>
      </div>

      {/* Status Cards */}
      <div class="space-y-2">
        <div class="flex items-center gap-3 px-3 py-2 bg-kaede-bg rounded-md">
          <div class={'size-2 rounded-full bg-kaede-success'}></div>
          <div>
            <div class="text-sm font-medium text-kaede-text">{powerupTitle()}</div>
            <div class="text-[11px] text-kaede-muted">{powerupVersion()}</div>
          </div>
        </div>
        <div class="flex items-center gap-3 px-3 py-2 bg-kaede-bg rounded-md">
          <div class="size-2 rounded-full bg-kaede-primary"></div>
          <div>
            <div class="text-sm font-medium text-kaede-text">3 Environments</div>
            <div class="text-[11px] text-kaede-muted">Production · Staging · Development</div>
          </div>
        </div>
        <div class="flex items-center gap-3 px-3 py-2 bg-kaede-bg rounded-md">
          <div class="size-2 rounded-full bg-kaede-warning"></div>
          <div>
            <div class="text-sm font-medium text-kaede-text">Card Badge</div>
            <div class="text-[11px] text-kaede-muted">Environment badge on card front</div>
          </div>
        </div>
      </div>

      {/* Enforcement Summary */}
      <Show when={enforcement()}>
        <div class="mt-4">
          <div class="text-[11px] font-semibold text-kaede-text uppercase tracking-wide mb-2">Playbook Enforcement</div>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between px-3 py-2 bg-kaede-bg rounded-md">
              <span class="text-sm font-medium text-kaede-text">Compliance</span>
              <span
                class={'text-[11px] font-semibold uppercase px-2 py-0.5 rounded ' + (enforcement()?.safe !== false ? 'bg-kaede-success/20 text-kaede-success' : 'bg-kaede-warning/20 text-kaede-warning')}
              >
                {enforcement()?.safe !== false ? 'Compliant' : enforcementItems().length + ' issue' + (enforcementItems().length > 1 ? 's' : '')}
              </span>
            </div>
            <Show when={enforcement()?.summary}>
              <div class="px-3 py-2 text-xs text-kaede-muted">{enforcement()?.summary}</div>
            </Show>
            <For each={enforcementItems()}>
              {(w) => (
                <div class="flex items-start gap-2 px-3 py-2 bg-kaede-bg rounded-md">
                  <span class={'shrink-0 mt-px text-xs ' + (w.severity === 'error' ? 'text-kaede-danger' : 'text-kaede-warning')}>
                    {w.severity === 'error' ? '!' : '\u26A0'}
                  </span>
                  <span class="text-xs text-kaede-muted">
                    <span class="font-medium text-kaede-text capitalize">{w.type.replace(/_/g, ' ')}</span>:{' '}
                    {w.message}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Env Stats */}
      <Show when={envStats()}>
        <div class="mt-4">
          <div class="text-[11px] font-semibold text-kaede-text uppercase tracking-wide mb-2">Card Environment Stats</div>
          <div class="flex flex-col gap-2">
            <For each={Object.keys(envStats() || {}).sort()}>
              {(env) => {
                const c = ENV_COLORS[env] || { bg: 'rgba(159,160,178,0.15)', text: 'text-kaede-muted' };
                const count = (envStats() || {})[env] || 0;
                return (
                  <div class="flex items-center justify-between px-3 py-2 bg-kaede-bg rounded-md">
                    <span class="text-sm font-medium text-kaede-text capitalize">{env}</span>
                    <span class="text-[11px] font-semibold uppercase px-2 py-0.5 rounded" style={{ background: c.bg }}>
                      <span class={c.text}>{count} card{count > 1 ? 's' : ''}</span>
                    </span>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>

      {/* List Breakdown */}
      <Show when={breakdown().length > 0}>
        <div class="mt-4">
          <div class="text-[11px] font-semibold text-kaede-text uppercase tracking-wide mb-2">Per-List Breakdown</div>
          <div class="flex flex-col gap-2">
            <For each={breakdown()}>
              {(ld) => {
                const overdue = ld.cards.filter(function (c: any) {
                  return c.due && !c.dueComplete && new Date(c.due) < new Date();
                }).length;
                const assigned = ld.cards.filter(function (c: any) {
                  return c.idMembers && c.idMembers.length > 0;
                }).length;
                return (
                  <div class="flex items-center justify-between px-3 py-2 bg-kaede-bg rounded-md">
                    <div>
                      <span class="text-sm font-medium text-kaede-text">{ld.listName}</span>
                      <span class="text-[10px] text-kaede-muted ml-2">{ld.cards.length} cards</span>
                    </div>
                    <div class="flex gap-1.5 text-[10px]">
                      <Show when={overdue > 0}>
                        <span class="px-1.5 py-0.5 rounded bg-kaede-danger/15 text-kaede-danger">{overdue} overdue</span>
                      </Show>
                      <Show when={assigned > 0}>
                        <span class="px-1.5 py-0.5 rounded bg-kaede-primary/15 text-kaede-primary">{assigned} assigned</span>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>

      <div class="mt-4 p-3 bg-kaede-bg rounded-md border border-kaede-border/50">
        <p class="text-[11px] text-kaede-muted leading-relaxed">
          Open any card &rarr; click <strong class="text-kaede-text">KAEDE: Environment</strong> to manage the
          card's environment. Use <strong class="text-kaede-text">KAEDE: Connect</strong> to configure the MCP
          server connection.
        </p>
      </div>

      <div class="pt-3 border-t border-kaede-border/50 text-center">
        <a
          href="/"
          target="_blank"
          rel="noopener"
          class="text-[10px] text-kaede-muted hover:text-kaede-primary no-underline transition-colors"
        >
          About KAEDE Ecosystem
        </a>
      </div>
    </>
  );
}

