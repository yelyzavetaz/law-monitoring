import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { q } from "./db.js";
const app = Fastify();
app.register(cors, {
    origin: "*",
});
app.get("/api/bills", async (req, reply) => {
    const { sector, level, q: query, date_from, date_to, } = req.query || {};
    const where = [];
    const params = [];
    if (sector) {
        params.push(sector);
        where.push(`sector = $${params.length}::sector`);
    }
    if (level) {
        params.push(level);
        where.push(`risk_level = $${params.length}::risk_level`);
    }
    if (query) {
        params.push(`%${query}%`);
        where.push(`(title ILIKE $${params.length} OR url ILIKE $${params.length})`);
    }
    if (date_from) {
        params.push(date_from);
        where.push(`registered_at >= $${params.length}::date`);
    }
    if (date_to) {
        params.push(date_to + " 23:59:59"); // Include the entire day
        where.push(`registered_at <= $${params.length}::timestamp`);
    }
    const sql = `
    SELECT id, rada_id, title, url, status, sector::text AS sector, risk_level, risk_score, tags, updated_at, registered_at, law_title 
    FROM bills
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY risk_level DESC, registered_at DESC
    LIMIT 200`;
    const res = await q(sql, params);
    console.log(res.rows);
    //reply.send(res.rows);
    return res.rows;
});
app.get("/api/bills/:id/versions", async (req, reply) => {
    console.log("Query:", req.query);
    const id = Number(req.params.id);
    const res = await q(`SELECT id, fetched_at, diff_from_prev, left(content, 4000) AS content_preview
     FROM bill_versions WHERE bill_id = $1 ORDER BY fetched_at DESC`, [id]);
    //reply.send(res.rows);
    return res.rows;
});
app
    .listen({ port: Number(process.env.PORT || 3000), host: "0.0.0.0" })
    .then(() => {
    console.log("API running on", process.env.PORT || 3000);
});
