// Outbox helper. Every mutation in the repo layer appends an OutboxEntry here
// so a future sync layer can drain the outbox without touching the repo
// layer at all. Unused by anything else today — that's intentional.

import type { OutboxEntityType, OutboxEntry, OutboxOp } from '@shared/types';
import { db } from './db';

export async function appendOutboxEntry(
  entityType: OutboxEntityType,
  entityId: string,
  op: OutboxOp,
  payload: unknown,
): Promise<void> {
  const entry: OutboxEntry = {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    op,
    payload,
    createdAt: Date.now(),
    pushedAt: null,
  };
  await db.outbox.add(entry);
}
