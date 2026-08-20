/**
 * KAEDE — Trello client-side helpers (per-user OAuth) + globals.
 *
 * Client-side OAuth popup (lihat auth.html):
 *   - Consumer key publik Power-Up KAEDE.
 *   - loadClient() memuat https://api.trello.com/1/client.js bila belum ada.
 *   - authorizeTrello(t) memunculkan popup OAuth, lalu menyimpan token
 *     member-private `kaede_token` untuk dipakai mcp-client.
 */

declare global {
  interface Window {
    TrelloPowerUp: any;
    Trello: any;
  }
}

/** Consumer key publik Power-Up KAEDE (untuk client-side OAuth). */
export const APP_KEY = 'd8946d641d10b0e3cf4588ead15f1de2';

/**
 * Load Trello REST client (https://api.trello.com/1/client.js).
 * Memuat sekali, lalu resolve dari cache window.Trello.
 */
export function loadClient(): Promise<any> {
  return new Promise(function (resolve, reject) {
    if (window.Trello && window.Trello.authorize) return resolve(window.Trello);
    const s = document.createElement('script');
    s.src = 'https://api.trello.com/1/client.js?key=' + APP_KEY;
    s.onload = function () {
      resolve(window.Trello);
    };
    s.onerror = function () {
      reject(new Error('Gagal memuat Trello client.js'));
    };
    document.head.appendChild(s);
  });
}

/**
 * Authorize akun Trello user (popup OAuth), simpan token member-private,
 * lalu kembalikan token. Scope: baca + tulis, expiration: never.
 */
export function authorizeTrello(t: any): Promise<string> {
  return loadClient().then(function (T) {
    return new Promise(function (resolve, reject) {
      T.authorize({
        type: 'popup',
        name: 'KAEDE',
        scope: { read: true, write: true },
        expiration: 'never',
        interactive: true,
        success: function () {
          resolve(T.token());
        },
        error: function (err: unknown) {
          reject(err);
        },
      });
    });
  }).then(function (token: string) {
    return t.set('member', 'private', 'kaede_token', token).then(function () {
      return token;
    });
  });
}
