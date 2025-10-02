import { Pool } from "pg";
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
});
// Універсальний helper із дженеріком
export function q(text, params) {
    return pool.query(text, params);
}
