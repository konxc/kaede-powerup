/**
 * KAEDE MCP Helpers
 *
 * Utility functions untuk mengurangi boilerplate di handler MCP server.
 */

import { TrelloMCPClient } from './trello-client';
import type { ITrelloMCPClient } from './trello-client.interface';

/**
 * Bungkus operasi yang membutuhkan TrelloMCPClient.
 * Handle connect + close otomatis.
 */
export async function withTrelloClient<T>(
  fn: (client: ITrelloMCPClient) => Promise<T>,
  serverPath?: string,
): Promise<T> {
  const client = new TrelloMCPClient(serverPath);
  try {
    await client.connect();
    return await fn(client);
  } finally {
    client.close();
  }
}
