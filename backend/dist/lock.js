import { q } from "./db.js";
// Використовуємо advisory lock на сесію
const LOCK_KEY = 982_345_671; // довільний int
export async function tryLock() {
    const res = await q("SELECT pg_try_advisory_lock($1) AS ok", [LOCK_KEY]);
    return res.rows[0].ok;
}
export async function unlock() {
    await q("SELECT pg_advisory_unlock($1)", [LOCK_KEY]);
}
