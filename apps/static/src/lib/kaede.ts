/**
 * KAEDE — Koneksi Automated Environment DE
 * Trello Power-Up capabilities & iframe connector.
 *
 * Modul ini berjalan di dalam hidden iframe Trello dan mendaftarkan
 * semua capability yang diekspos Power-Up ke UI Trello.
 *
 * @see https://developer.atlassian.com/cloud/trello/power-ups/
 */

import { APP_KEY } from './trello';

// ===================================================================
//  Configuration
// ===================================================================

export const KAEDE = {
  name: 'KAEDE',
  version: '1.0.0',
  appKey: APP_KEY,
  icon: {
    dark: 'https://cdn.jsdelivr.net/gh/konxc/konxc.github.io@main/assets/kaede-icon-dark.svg',
    light: 'https://cdn.jsdelivr.net/gh/konxc/konxc.github.io@main/assets/kaede-icon-light.svg',
  },
  // Fallback icon (inline SVG data-uri) — purple box with "K"
  iconFallback: {
    dark: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSIjNmM1Y2U3Ii8+PHRleHQgeD0iNDklIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSI3MDAiPks8L3RleHQ+PC9zdmc+',
    light:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSIjNmM1Y2U3Ii8+PHRleHQgeD0iNDklIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSI3MDAiPks8L3RleHQ+PC9zdmc+',
  },
};

// ===================================================================
//  Storage helpers (scoped per board / card)
// ===================================================================

/**
 * Get a storage key-value pair scoped to the context.
 * @param t — TrelloPowerUp iframe context
 * @param scope — 'board' | 'card'
 * @param key
 * @param defaultValue
 */
export async function get(
  t: any,
  scope: string,
  key: string,
  defaultValue: any,
): Promise<any> {
  try {
    const val = await t.get(scope, 'shared', key);
    return val !== undefined && val !== null ? val : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Set a storage key-value pair scoped to the context.
 * @param t — TrelloPowerUp iframe context
 * @param scope — 'board' | 'card'
 * @param key
 * @param value
 */
export async function set(t: any, scope: string, key: string, value: any): Promise<void> {
  await t.set(scope, 'shared', key, value);
}

// ===================================================================
//  Capabilities
// ===================================================================

export const capabilities: Record<string, (t: any) => any> = {
  // ---------------------------------------------------------------
  //  Board Buttons — Dashboard & t-connect
  // ---------------------------------------------------------------
  'board-buttons': function (t) {
    return [
      {
        icon: KAEDE.iconFallback.dark,
        text: 'KAEDE',
        callback: async function (t: any) {
          return t.popup({
            title: 'KAEDE Dashboard',
            url: 'board.html',
            height: 520,
          });
        },
        condition: 'edit',
      },
      {
        icon: KAEDE.iconFallback.light,
        text: 'KAEDE: Connect',
        callback: async function (t: any) {
          return t.popup({
            title: 'KAEDE Connect',
            url: 'connect.html',
            height: 360,
          });
        },
        condition: 'edit',
      },
    ];
  },

  // ---------------------------------------------------------------
  //  Card Buttons — Environment & MCP actions
  // ---------------------------------------------------------------
  'card-buttons': function (t) {
    return [
      {
        icon: KAEDE.iconFallback.dark,
        text: 'KAEDE: Environment',
        callback: async function (t: any) {
          return t.popup({
            title: 'Environment Manager',
            url: 'card.html',
            height: 300,
          });
        },
        condition: 'edit',
      },
      {
        icon: KAEDE.iconFallback.light,
        text: 'KAEDE: MCP',
        callback: async function (t: any) {
          return t.popup({
            title: 'MCP Control',
            url: 'mcp.html',
            height: 480,
          });
        },
        condition: 'edit',
      },
    ];
  },

  // ---------------------------------------------------------------
  //  Card Badge — show env status on card front
  // ---------------------------------------------------------------
  'card-badges': function (t) {
    return t.card('id', 'name').then(async function (card: any) {
      const env = await get(t, 'card', 'environment', 'unset');

      const badgeMap: Record<string, { text: string; color: string; icon: string }> = {
        production: { text: 'PROD', color: 'red', icon: KAEDE.iconFallback.dark },
        staging: { text: 'STAG', color: 'yellow', icon: KAEDE.iconFallback.dark },
        development: { text: 'DEV', color: 'green', icon: KAEDE.iconFallback.dark },
        unset: { text: '—', color: 'gray', icon: KAEDE.iconFallback.dark },
      };

      const badge = badgeMap[env] || badgeMap.unset;

      return [
        {
          text: badge.text,
          color: badge.color,
          icon: badge.icon,
          refresh: 30, // refresh every 30 seconds
        },
      ];
    });
  },

  // ---------------------------------------------------------------
  //  Show Card — detailed env info in card detail view
  // ---------------------------------------------------------------
  'show-card': function (t) {
    return t.card('id', 'name').then(async function (card: any) {
      const env = await get(t, 'card', 'environment', 'unset');
      const deployUrl = await get(t, 'card', 'deployUrl', '');

      return {
        title: 'KAEDE: Environment',
        detail: [
          '<div style="padding:12px 0">',
          '  <div style="font-size:11px;font-weight:600;color:#8888a0;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Environment</div>',
          '  <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;background:' +
            (env === 'production'
              ? 'rgba(255,118,117,0.15);color:#ff7675'
              : env === 'staging'
                ? 'rgba(253,203,110,0.15);color:#fdcb6e'
                : env === 'development'
                  ? 'rgba(0,184,148,0.15);color:#00b894'
                  : 'rgba(159,160,178,0.15);color:#9fa0b2') +
            '">' +
            String(env).toUpperCase() +
            '</span>',
          '</div>',
          deployUrl
            ? [
                '<div style="padding:12px 0">',
                '  <div style="font-size:11px;font-weight:600;color:#8888a0;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Deploy URL</div>',
                '  <a href="' +
                  deployUrl +
                  '" target="_blank" rel="noopener" style="color:#6c5ce7;text-decoration:underline">' +
                  deployUrl +
                  '</a>',
                '</div>',
              ].join('')
            : '',
          '<div style="padding:12px 0">',
          '  <button data-action="kaede-set-env" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border:none;border-radius:8px;background:#6c5ce7;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:500;cursor:pointer">Set Environment</button>',
          '</div>',
        ].join('\n'),
      };
    });
  },

  // ---------------------------------------------------------------
  //  On enable / disable — lifecycle hooks
  // ---------------------------------------------------------------
  'on-enable': function (t) {
    console.log('[KAEDE] Power-Up enabled on board', t.getContext().board);
  },

  'on-disable': function (t) {
    console.log('[KAEDE] Power-Up disabled on board', t.getContext().board);
  },

  // ---------------------------------------------------------------
  //  Authorization — MCP + Trello API key flow
  // ---------------------------------------------------------------
  'authorization-status': function (t) {
    return Promise.all([
      get(t, 'board', 'auth', null),
      get(t, 'board', 'apiBase', null),
    ]).then(function (results) {
      const auth = results[0];
      const apiBase = results[1];
      return {
        authorized: auth !== null && apiBase !== null,
      };
    });
  },

  'show-authorization': function (t) {
    return t.popup({
      title: 'KAEDE: Authorize',
      url: 'auth.html',
      height: 360,
    });
  },

  // ---------------------------------------------------------------
  //  Locale / translations
  // ---------------------------------------------------------------
  locale: function () {
    return {
      'kaede:environment': 'Environment',
      'kaede:production': 'Production',
      'kaede:staging': 'Staging',
      'kaede:development': 'Development',
    };
  },
};

// ===================================================================
//  Initialize (Trello iframe only — skip on standalone site visit)
// ===================================================================

const isIframe = window.self !== window.top;

if (isIframe) {
  console.log('[KAEDE] Initializing v%s in Trello iframe', KAEDE.version);

  window.TrelloPowerUp.initialize(capabilities)
    .then(function () {
      const el = document.getElementById('status');
      if (el) el.textContent = 'KAEDE ready.';
    })
    .catch(function (err: unknown) {
      console.error('[KAEDE] Initialization failed:', err);
      const el = document.getElementById('status');
      if (el) el.textContent = 'Initialization failed.';
    });
}

export { isIframe };
