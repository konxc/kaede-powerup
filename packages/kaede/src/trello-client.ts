/**
 * Trello MCP Client — Wrapper untuk komunikasi dengan Trello MCP Server
 *
 * Facade yang mengomposisikan domain service classes.
 * Setiap service menangani satu domain interface (ISP).
 */

import type { ITrelloMCPClient } from './trello-client.interface';
import { RpcService } from './services/rpc-service';
import { BoardService } from './services/board-service';
import { CardService } from './services/card-service';
import { ListService } from './services/list-service';
import { LabelService } from './services/label-service';
import { ChecklistService } from './services/checklist-service';
import { MemberService } from './services/member-service';
import { CommentService } from './services/comment-service';
import { AttachmentService } from './services/attachment-service';
import { WatchService } from './services/watch-service';

export class TrelloMCPClient implements ITrelloMCPClient {
  rpc: RpcService;
  boards: BoardService;
  cards: CardService;
  lists: ListService;
  labels: LabelService;
  checklists: ChecklistService;
  members: MemberService;
  comments: CommentService;
  attachments: AttachmentService;
  watches: WatchService;

  constructor(serverPath?: string, timeout?: number) {
    this.rpc = new RpcService(serverPath, timeout);
    const ct = this.rpc.callTool.bind(this.rpc);

    this.boards = new BoardService(ct);
    this.cards = new CardService(ct);
    this.lists = new ListService(ct);
    this.checklists = new ChecklistService(ct);
    this.members = new MemberService(ct);
    this.comments = new CommentService(ct);
    this.attachments = new AttachmentService(ct);
    this.watches = new WatchService(ct);

    this.labels = new LabelService(ct, this.cards.getCard.bind(this.cards), this.cards.updateCard.bind(this.cards));
  }

  // ─── IRpcClient ───

  connect(retries?: number): Promise<void> {
    return this.rpc.connect(retries);
  }

  sendRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
    return this.rpc.sendRequest(method, params);
  }

  sendNotification(method: string, params?: Record<string, unknown>): void {
    this.rpc.sendNotification(method, params);
  }

  callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    return this.rpc.callTool(name, args);
  }

  close(): void {
    this.rpc.close();
  }

  // ─── IBoardClient ───

  listBoards(): Promise<unknown[]> {
    return this.boards.listBoards();
  }

  listWorkspaces(): Promise<unknown[]> {
    return this.boards.listWorkspaces();
  }

  createBoard(name: string, opts?: Record<string, unknown>): Promise<unknown> {
    return this.boards.createBoard(name, opts);
  }

  // ─── ICardClient ───

  getMyCards(): Promise<unknown[]> {
    return this.cards.getMyCards();
  }

  getCardsByListId(listId: string, boardId: string): Promise<unknown[]> {
    return this.cards.getCardsByListId(listId, boardId);
  }

  getCard(cardId: string, includeMarkdown?: boolean): Promise<unknown> {
    return this.cards.getCard(cardId, includeMarkdown);
  }

  createCard(listId: string, name: string, description?: string, labels?: string[]): Promise<unknown> {
    return this.cards.createCard(listId, name, description, labels);
  }

  updateCard(cardId: string, updates: Record<string, unknown>): Promise<unknown> {
    return this.cards.updateCard(cardId, updates);
  }

  moveCard(cardId: string, listId: string, boardId?: string): Promise<unknown> {
    return this.cards.moveCard(cardId, listId, boardId);
  }

  archiveCard(cardId: string): Promise<unknown> {
    return this.cards.archiveCard(cardId);
  }

  copyCard(options: {
    sourceCardId: string;
    listId: string;
    name?: string;
    description?: string;
    keepFromSource?: string;
    pos?: string;
  }): Promise<unknown> {
    return this.cards.copyCard(options);
  }

  // ─── IListClient ───

  getLists(boardId: string): Promise<unknown[]> {
    return this.lists.getLists(boardId);
  }

  createList(boardId: string, name: string): Promise<unknown> {
    return this.lists.createList(boardId, name);
  }

  archiveList(listId: string): Promise<unknown> {
    return this.lists.archiveList(listId);
  }

  updateList(options: { listId: string; name?: string; closed?: boolean; pos?: number; subscribed?: boolean }): Promise<unknown> {
    return this.lists.updateList(options);
  }

  sortListCards(listId: string, sort: string): Promise<unknown> {
    return this.lists.sortListCards(listId, sort);
  }

  copyList(sourceListId: string, targetBoardId: string, name?: string): Promise<unknown> {
    return this.lists.copyList(sourceListId, targetBoardId, name);
  }

  moveList(listId: string, targetBoardId: string): Promise<unknown> {
    return this.lists.moveList(listId, targetBoardId);
  }

  // ─── ILabelClient ───

  getBoardLabels(boardId: string): Promise<unknown[]> {
    return this.labels.getBoardLabels(boardId);
  }

  createLabel(boardId: string, name: string, color: string): Promise<unknown> {
    return this.labels.createLabel(boardId, name, color);
  }

  updateLabel(labelId: string, name: string, color: string): Promise<unknown> {
    return this.labels.updateLabel(labelId, name, color);
  }

  deleteLabel(labelId: string): Promise<unknown> {
    return this.labels.deleteLabel(labelId);
  }

  addLabelToCard(cardId: string, labelId: string): Promise<void> {
    return this.labels.addLabelToCard(cardId, labelId);
  }

  removeLabelFromCard(cardId: string, labelId: string): Promise<unknown> {
    return this.labels.removeLabelFromCard(cardId, labelId);
  }

  searchLabels(boardId: string, query?: string): Promise<unknown> {
    return this.labels.searchLabels(boardId, query);
  }

  // ─── IChecklistClient ───

  createChecklist(cardId: string, name: string): Promise<unknown> {
    return this.checklists.createChecklist(cardId, name);
  }

  addChecklistItem(checklistId: string, name: string, checked?: boolean): Promise<unknown> {
    return this.checklists.addChecklistItem(checklistId, name, checked);
  }

  deleteChecklist(checklistId: string): Promise<unknown> {
    return this.checklists.deleteChecklist(checklistId);
  }

  deleteChecklistItem(checklistId: string, checkItemId: string): Promise<unknown> {
    return this.checklists.deleteChecklistItem(checklistId, checkItemId);
  }

  updateChecklistItem(options: { checklistId: string; checkItemId: string; name?: string; checked?: boolean }): Promise<unknown> {
    return this.checklists.updateChecklistItem(options);
  }

  getCardChecklists(cardId: string): Promise<unknown> {
    return this.checklists.getCardChecklists(cardId);
  }

  copyChecklist(sourceChecklistId: string, cardId: string): Promise<unknown> {
    return this.checklists.copyChecklist(sourceChecklistId, cardId);
  }

  // ─── IMemberClient ───

  getBoardMembers(boardId: string): Promise<unknown[]> {
    return this.members.getBoardMembers(boardId);
  }

  assignMember(cardId: string, memberId: string): Promise<unknown> {
    return this.members.assignMember(cardId, memberId);
  }

  removeMember(cardId: string, memberId: string): Promise<unknown> {
    return this.members.removeMember(cardId, memberId);
  }

  // ─── ICommentClient ───

  addComment(cardId: string, text: string): Promise<unknown> {
    return this.comments.addComment(cardId, text);
  }

  getCardComments(cardId: string, limit?: number): Promise<unknown[]> {
    return this.comments.getCardComments(cardId, limit);
  }

  // ─── IAttachmentClient ───

  attachFileToCard(cardId: string, fileUrl: string, name?: string, mimeType?: string): Promise<unknown> {
    return this.attachments.attachFileToCard(cardId, fileUrl, name, mimeType);
  }

  attachImageToCard(cardId: string, imageUrl: string, name?: string): Promise<unknown> {
    return this.attachments.attachImageToCard(cardId, imageUrl, name);
  }

  getCardAttachments(cardId: string): Promise<unknown[]> {
    return this.attachments.getCardAttachments(cardId);
  }

  attachDataToCard(cardId: string, data: string, name?: string, mimeType?: string): Promise<unknown> {
    return this.attachments.attachDataToCard(cardId, data, name, mimeType);
  }

  attachImageDataToCard(cardId: string, imageData: string, name?: string): Promise<unknown> {
    return this.attachments.attachImageDataToCard(cardId, imageData, name);
  }

  // ─── IWatchClient ───

  watchCard(cardId: string, add?: boolean): Promise<unknown> {
    return this.watches.watchCard(cardId, add);
  }

  unwatchCard(cardId: string): Promise<unknown> {
    return this.watches.unwatchCard(cardId);
  }

  watchList(listId: string, add?: boolean): Promise<unknown> {
    return this.watches.watchList(listId, add);
  }

  unwatchList(listId: string): Promise<unknown> {
    return this.watches.unwatchList(listId);
  }

  getCardActivity(cardId: string, options?: { filter?: string; limit?: number }): Promise<unknown> {
    return this.watches.getCardActivity(cardId, options);
  }
}
