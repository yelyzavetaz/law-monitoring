import fs from "fs";
import YAML from "yaml";
import { q } from "./db.js";

type Rules = {
  sectors: Record<string, { keywords: string[]; weight: number }>;
  risk: {
    boosters: { pattern: string; score: number }[];
    dampers: { pattern: string; score: number }[];
  };
  levels: Record<"LOW" | "MEDIUM" | "HIGH", string>;
};
const rules: Rules = YAML.parse(fs.readFileSync("config/rules.yaml", "utf8"));

export async function classifyAndScore(billId: number) {
  const { rows } = await q<{ title: string; content: string }>(
    `SELECT b.title, v.content
     FROM bills b
     JOIN LATERAL (
       SELECT content FROM bill_versions WHERE bill_id = b.id ORDER BY fetched_at DESC LIMIT 1
     ) v ON true
     WHERE b.id = $1`,
    [billId]
  );
  if (!rows[0]) return;
  const text = (rows[0].title + "\n" + rows[0].content).toLowerCase();

  // сектор
  let best: { sector: "SOCIAL" | "AGRI" | "CORPORATE"; score: number } = {
    sector: "CORPORATE",
    score: -1,
  };
  for (const [sector, def] of Object.entries(rules.sectors)) {
    const hits = def.keywords.reduce(
      (acc, kw) => acc + (text.includes(kw) ? 1 : 0),
      0
    );
    const s = hits * (def.weight || 1);
    if (s > best.score) best = { sector: sector as any, score: s };
  }

  // ризик
  let riskScore = 0;
  const tags: string[] = [];
  for (const b of rules.risk.boosters || []) {
    const re = new RegExp(b.pattern, "i");
    if (re.test(text)) {
      riskScore += b.score;
      tags.push(`+${b.pattern}`);
    }
  }
  for (const d of rules.risk.dampers || []) {
    const re = new RegExp(d.pattern, "i");
    if (re.test(text)) {
      riskScore += d.score;
      tags.push(`-${d.pattern}`);
    }
  }
  const level = riskScore > 40 ? "HIGH" : riskScore > 20 ? "MEDIUM" : "LOW";

  await q(
    `UPDATE bills SET sector = $1::sector, risk_score = $2, risk_level = $3::risk_level, tags = $4::jsonb WHERE id = $5`,
    [best.sector, riskScore, level, JSON.stringify(tags), billId]
  );
}
