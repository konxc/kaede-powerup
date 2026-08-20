/**
 * KAEDE — Set Environment (SolidJS)
 *
 * Migrasi dari public/card.html. Perilaku identik:
 *   - Pilih Production / Staging / Development → simpan env + envStats.
 *   - Enforcement playbook sebelum apply (best-effort).
 *   - Sinkronisasi label env via MCP bridge (proxy / local orchestrator),
 *     fail closed bila operasi tulis tidak tersedia (tidak ada key/token di browser).
 */
import { createSignal, For, Show } from 'solid-js';
import { KAEDEMCP } from '../lib/mcp-client';

const ENV_LABEL_MAP: Record<string, { name: string; color: string }> = {
  production: { name: 'Production', color: 'red' },
  staging: { name: 'Staging', color: 'yellow' },
  development: { name: 'Development', color: 'green' },
};

const ENV_OPTIONS = [
  { env: 'production', title: 'Production', subtitle: 'Live / customer-facing' },
  { env: 'staging', title: 'Staging', subtitle: 'Pre-production testing' },
  { env: 'development', title: 'Development', subtitle: 'Active development branch' },
];

interface EnforcementWarning {
  severity?: string;
  message: string;
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

export default function SetEnvironment() {
  const t = window.TrelloPowerUp.iframe();

  // Pertahankan initialize placeholder asli (kartu ini tidak memuat kaede.ts).
  window.TrelloPowerUp.initialize({ 'card-buttons': function () { return []; } });

  const [warnings, setWarnings] = createSignal<EnforcementWarning[]>([]);

  function showEnforcement(warningsList: EnforcementWarning[]) {
    if (!warningsList || warningsList.length === 0) {
      setWarnings([]);
      return;
    }
    setWarnings(warningsList);
  }

  function runEnforcement(env: string, cardId: string) {
    KAEDEMCP.init(t)
      .then(function () {
        return t.get('board', 'shared', 'playbook', null);
      })
      .then(function (playbook: string) {
        if (!playbook) return;
        const plan = [
          {
            action: 'update_card',
            params: { cardId, name: env },
            description: 'Set environment to ' + env,
          },
        ];
        return KAEDEMCP.enforcePlaybook(playbook, plan, []).then(function (result: any) {
          if (result && result.warnings && result.warnings.length > 0) {
            showEnforcement(result.warnings);
          }
          syncLabelViaBridge(cardId, env);
        });
      })
      .catch(function () {
        /* enforcement skipped */
      });
  }

  function intent(intentName: string, args: Record<string, unknown>) {
    return KAEDEMCP.callIntent(intentName, args).then(function (res) {
      return resolveIntentResults(res);
    });
  }

  /**
   * Sync environment label via MCP bridge (proxy / local orchestrator).
   * Best-effort: operasi tulis hanya berjalan di Mode 1 (lokal) atau ketika
   * proxy punya KAEDE_API_KEY — kegagalan ditelan diam-diam (fail closed).
   * Tidak ada key/token Trello di browser.
   */
  function syncLabelViaBridge(cardId: string, env: string) {
    const target = ENV_LABEL_MAP[env];
    const otherEnvs = Object.keys(ENV_LABEL_MAP).filter(function (e) {
      return e !== env;
    });

    return intent('get_card', { cardId })
      .then(function (card: any) {
        return intent('get_board_labels', { boardId: card.idBoard }).then(function (labels: any[]) {
          let targetLabel = labels.find(function (l) {
            return l.name === env || l.color === target.color;
          });

          function ensureLabel() {
            if (targetLabel) return Promise.resolve(targetLabel);
            return intent('create_label', {
              name: target.name,
              color: target.color,
              boardId: card.idBoard,
            }).then(function (newLabel: any) {
              targetLabel = newLabel;
              return newLabel;
            });
          }

          return ensureLabel().then(function (label: any) {
            const removePromises = otherEnvs
              .map(function (e) {
                return ENV_LABEL_MAP[e].name;
              })
              .map(function (otherName) {
                const other = labels.find(function (l) {
                  return l.name === otherName;
                });
                return other
                  ? intent('remove_label_from_card', { cardId, labelId: other.id }).catch(function () {})
                  : Promise.resolve();
              });

            return Promise.all(removePromises).then(function () {
              return intent('add_label_to_card', { cardId, labelId: label.id }).catch(function () {});
            });
          });
        });
      })
      .catch(function () {
        /* label sync skipped — write ops may be disabled on public proxy */
      });
  }

  function selectEnv(env: string) {
    let cardId = '';

    t.card('id')
      .then(function (card: any) {
        cardId = card.id;
        return Promise.all([
          t.get('card', 'shared', 'environment', null),
          t.get('board', 'shared', 'envStats', {}),
        ]);
      })
      .then(function (results) {
        const oldEnv = results[0];
        const stats = results[1];

        if (oldEnv === env) {
          t.closePopup();
          return;
        }

        if (oldEnv && stats[oldEnv] !== undefined) {
          stats[oldEnv] = Math.max(0, stats[oldEnv] - 1);
          if (stats[oldEnv] === 0) delete stats[oldEnv];
        }

        stats[env] = (stats[env] || 0) + 1;

        return Promise.all([
          t.set('card', 'shared', 'environment', env),
          t.set('board', 'shared', 'envStats', stats),
          runEnforcement(env, cardId),
        ]);
      })
      .then(function () {
        t.closePopup();
      })
      .catch(function (err) {
        console.error('[KAEDE] Failed to set environment:', err);
        t.closePopup();
      });
  }

  const alertBorderColor = () =>
    warnings().some(function (w) {
      return w.severity === 'error';
    })
      ? 'rgba(225,112,85,0.3)'
      : 'rgba(253,203,110,0.3)';
  const alertBackground = () =>
    warnings().some(function (w) {
      return w.severity === 'error';
    })
      ? 'rgba(225,112,85,0.08)'
      : 'rgba(253,203,110,0.08)';

  return (
    <>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-kaede-text">Set Environment</h2>
        <span class="flex items-center justify-center size-5 rounded bg-kaede-primary text-white text-[8px] font-bold">K</span>
      </div>

      <Show when={warnings().length > 0}>
        <div
          class="mb-3 px-3 py-2 rounded-md border text-xs leading-relaxed"
          style={{ borderColor: alertBorderColor(), background: alertBackground() }}
        >
          <div class="font-semibold text-kaede-text mb-1">Enforcement</div>
          <For each={warnings()}>
            {(w) => (
              <div class="flex items-start gap-1.5 mt-1">
                <span class={'shrink-0 ' + (w.severity === 'error' ? 'text-kaede-danger' : 'text-kaede-warning')}>
                  {w.severity === 'error' ? '!' : '\u26A0'}
                </span>
                <span class="text-kaede-muted">{w.message}</span>
              </div>
            )}
          </For>
        </div>
      </Show>

      <For each={ENV_OPTIONS}>
        {(opt) => (
          <button
            type="button"
            onClick={() => selectEnv(opt.env)}
            class="w-full text-left px-3.5 py-2.5 mb-1.5 rounded-md border border-kaede-border bg-kaede-bg text-kaede-text text-sm cursor-pointer transition-[border-color,background] duration-200 hover:border-kaede-primary hover:bg-[rgba(108,92,231,0.08)]"
          >
            <span class="font-medium">{opt.title}</span>
            <span class="block text-[11px] text-kaede-muted mt-0.5">{opt.subtitle}</span>
          </button>
        )}
      </For>

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
