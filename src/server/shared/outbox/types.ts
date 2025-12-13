export type OutboxStatus = "pending" | "processing" | "done" | "dead";

export interface OutboxItem<TPayload> {
  id: string;
  createdAt: Date;
  payload: TPayload;
  status: OutboxStatus;
  retryCount: number;
  nextAttemptAt: Date | null;
}
