// Використовуємо вбудований fetch (Node 18+)
import { q } from "./db.js";

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID!;

export async function sendInstantAlertIfHigh(billId: number) {
  const { rows } = await q<{
    title: string;
    risk_level: string;
    risk_score: number;
    sector: string;
    url: string;
    number: string | null;
  }>(
    `SELECT title, risk_level, risk_score, sector::text AS sector, url, number
     FROM bills WHERE id = $1`,
    [billId]
  );
  const b = rows[0];
  if (!b || b.risk_level !== "HIGH") return;

  const text = [
    `⚠️ Високий ризик (${b.risk_score}) — ${b.sector || "—"}`,
    `№ ${b.number ?? "—"} — ${b.title}`,
    b.url,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: TG_CHAT, text }),
  });
}

export async function sendDailyDigest() {
  const { rows } = await q<{
    title: string;
    risk_level: string;
    sector: string;
    url: string;
  }>(
    `SELECT title, risk_level, sector::text AS sector, url
     FROM bills
     WHERE updated_at >= now() - interval '24 hours'
     ORDER BY risk_level DESC, updated_at DESC
     LIMIT 30`
  );
  if (!rows.length) return;

  const text =
    `Щоденний дайджест (${new Date().toLocaleDateString("uk-UA")}):\n` +
    rows
      .map(
        (b) => `• [${b.risk_level}] ${b.sector || "—"} — ${b.title} (${b.url})`
      )
      .join("\n");

  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: TG_CHAT,
      text,
      disable_web_page_preview: true,
    }),
  });
}
