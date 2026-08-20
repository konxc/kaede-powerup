import { test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';

import {
  loadEnv,
  globalSecretsPath,
  writeGlobalSecrets,
  buildAuthorizeUrl,
  maskToken,
  trelloValidateToken,
  revokeToken,
} from '../../../scripts/kaede-auth.ts';

const HOME = resolve(tmpdir(), 'kaede-auth-test-home');

beforeEach(() => {
  rmSync(HOME, { recursive: true, force: true });
  mkdirSync(HOME, { recursive: true });
});

afterEach(() => {
  rmSync(HOME, { recursive: true, force: true });
});

test('loadEnv: parse key=value, skip comment & blank', () => {
  const p = resolve(HOME, 'a.env');
  writeFileSync(p, '# comment\n\nTRELLO_API_KEY=abc\nTRELLO_TOKEN=xyz\nSOMETHING=with=equals\n', 'utf-8');
  const env = loadEnv(p);
  expect(env.TRELLO_API_KEY).toBe('abc');
  expect(env.TRELLO_TOKEN).toBe('xyz');
  expect(env.SOMETHING).toBe('with=equals');
  expect(env).not.toHaveProperty('# comment');
});

test('globalSecretsPath: ~/.config/kaede/secrets.env', () => {
  expect(globalSecretsPath(HOME)).toBe(resolve(HOME, '.config', 'kaede', 'secrets.env'));
});

test('writeGlobalSecrets: tulis file baru dengan header', () => {
  const path = writeGlobalSecrets(HOME, { TRELLO_API_KEY: 'k', TRELLO_TOKEN: 't' });
  expect(path).toBe(globalSecretsPath(HOME));
  const content = readFileSync(path, 'utf-8');
  expect(content).toContain('TRELLO_API_KEY=k');
  expect(content).toContain('TRELLO_TOKEN=t');
  expect(content).toContain('kaede auth login');
});

test('writeGlobalSecrets: merge dengan file existing, pertahankan kunci lain', () => {
  writeGlobalSecrets(HOME, { TRELLO_API_KEY: 'k1', TRELLO_TOKEN: 't1', EXTRA: 'keep' });
  writeGlobalSecrets(HOME, { TRELLO_TOKEN: 't2' });
  const env = loadEnv(globalSecretsPath(HOME));
  expect(env.TRELLO_API_KEY).toBe('k1');
  expect(env.TRELLO_TOKEN).toBe('t2');
  expect(env.EXTRA).toBe('keep');
});

test('writeGlobalSecrets: undefined menghapus kunci', () => {
  writeGlobalSecrets(HOME, { TRELLO_API_KEY: 'k', TRELLO_TOKEN: 't' });
  writeGlobalSecrets(HOME, { TRELLO_TOKEN: undefined });
  const env = loadEnv(globalSecretsPath(HOME));
  expect(env.TRELLO_TOKEN).toBeUndefined();
  expect(env.TRELLO_API_KEY).toBe('k');
});

test('buildAuthorizeUrl: tanpa returnUrl', () => {
  const url = buildAuthorizeUrl('mykey');
  expect(url.startsWith('https://trello.com/1/authorize?')).toBe(true);
  expect(url).toContain('expiration=never');
  expect(url).toContain('scope=read,write,account');
  expect(url).toContain('response_type=token');
  expect(url).toContain('key=mykey');
  expect(url).not.toContain('return_url');
});

test('buildAuthorizeUrl: dengan returnUrl menambah callback_method fragment', () => {
  const url = buildAuthorizeUrl('mykey', { returnUrl: 'http://127.0.0.1:4000/callback' });
  expect(url).toContain('return_url=' + encodeURIComponent('http://127.0.0.1:4000/callback'));
  expect(url).toContain('callback_method=fragment');
});

test('maskToken: masked, short token jadi bulat', () => {
  expect(maskToken('')).toBe('');
  expect(maskToken('abc')).toBe('••••');
  expect(maskToken('ATTA1234567890')).toBe('ATTA…7890');
});

test('trelloValidateToken: berhasil + ambil member', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.includes('/member?key=')) {
      return { ok: true, status: 200, json: async () => ({ id: 'm1', fullName: 'Sandiko', username: 'sandikodev' }) };
    }
    return { ok: true, status: 200, json: async () => ({ id: 't1', dateExpires: null }) };
  };
  try {
    const info = await trelloValidateToken('key', 'token');
    expect(info.id).toBe('t1');
    expect(info.expires).toBe('never');
    expect(info.member).toEqual({ id: 'm1', fullName: 'Sandiko', username: 'sandikodev' });
  } finally {
    globalThis.fetch = orig;
  }
});

test('trelloValidateToken: token invalid melempar error', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({}) });
  try {
    await expect(trelloValidateToken('key', 'bad')).rejects.toThrow('401');
  } finally {
    globalThis.fetch = orig;
  }
});

test('revokeToken: 200 / 404 dianggap sukses', async () => {
  const orig = globalThis.fetch;
  let calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(String(url));
    const u = String(url);
    const status = u.includes('gone') ? 404 : 200;
    return { ok: status === 200, status };
  };
  try {
    expect(await revokeToken('key', 'token')).toBe(true);
    expect(await revokeToken('key', 'gone')).toBe(true);
    expect(calls[0]).toContain('/1/tokens/token?key=key');
    expect(calls[1]).toContain('gone');
    expect(calls.every((c) => String(c).includes('key=key'))).toBe(true);
  } finally {
    globalThis.fetch = orig;
  }
});

test('existsSync setelah writeGlobalSecrets true', () => {
  const path = writeGlobalSecrets(HOME, { TRELLO_API_KEY: 'k' });
  expect(existsSync(path)).toBe(true);
});
