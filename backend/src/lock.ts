import { q } from "./db.js";

// Використовуємо advisory lock на сесію
const LOCK_KEY = 982_345_671; // довільний int

export async function tryLock(): Promise<boolean> {
  const res = await q<{ pg_try_advisory_lock: boolean }>(
    "SELECT pg_try_advisory_lock($1) AS ok",
    [LOCK_KEY]
  );
  return (res.rows[0] as any).ok;
}

export async function unlock(): Promise<void> {
  await q("SELECT pg_advisory_unlock($1)", [LOCK_KEY]);
}
