/**
 * KAEDE Trello MCP Client Interface
 *
 * Combined interface yang mewarisi semua domain interface.
 * Implementasi konkrit: TrelloMCPClient di trello-client.ts
 *
 * Untuk dependency injection yang lebih granular, gunakan
 * domain interface individual (IBoardClient, ICardClient, dll).
 */

import type { IRpcClient } from './interfaces/irpc-client';
import type { IBoardClient } from './interfaces/iboard-client';
import type { IListClient } from './interfaces/ilist-client';
import type { ICardClient } from './interfaces/icard-client';
import type { IMemberClient } from './interfaces/imember-client';
import type { ILabelClient } from './interfaces/ilabel-client';
import type { IChecklistClient } from './interfaces/ichecklist-client';
import type { ICommentClient } from './interfaces/icomment-client';
import type { IAttachmentClient } from './interfaces/iattachment-client';
import type { IWatchClient } from './interfaces/iwatch-client';

export interface ITrelloMCPClient extends
  IRpcClient,
  IBoardClient,
  IListClient,
  ICardClient,
  IMemberClient,
  ILabelClient,
  IChecklistClient,
  ICommentClient,
  IAttachmentClient,
  IWatchClient
{}
