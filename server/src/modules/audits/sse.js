import { EventEmitter } from 'node:events';

// In-process pub/sub for audit progress. ponytail: single-dyno in-memory bus matches the
// "no queue, audit dies on restart" ceiling in SYSTEM_DESIGN §3 — swap for Redis pub/sub if we scale out.
const bus = new EventEmitter();
bus.setMaxListeners(0);

export const emitProgress = (auditId, payload) => bus.emit(String(auditId), payload);

export function subscribeProgress(auditId, listener) {
  const key = String(auditId);
  bus.on(key, listener);
  return () => bus.off(key, listener);
}
