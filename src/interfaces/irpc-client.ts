export interface IRpcClient {
  connect(retries?: number): Promise<void>;
  close(): void;
  sendRequest(method: string, params?: Record<string, unknown>): Promise<unknown>;
  sendNotification(method: string, params?: Record<string, unknown>): void;
  callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
}
