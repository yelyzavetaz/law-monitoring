import { q } from "./db.js";
import { createTwoFilesPatch } from "diff";
export async function computeDiffs(billId) {
    const v = await q(`SELECT id, content FROM bill_versions WHERE bill_id = $1 ORDER BY fetched_at ASC`, [billId]);
    for (let i = 1; i < v.rows.length; i++) {
        const prev = v.rows[i - 1];
        const curr = v.rows[i];
        // чи вже є diff
        const exists = await q(`SELECT diff_from_prev FROM bill_versions WHERE id = $1`, [curr.id]);
        if (exists.rows[0]?.diff_from_prev)
            continue;
        const patch = createTwoFilesPatch("prev", "curr", prev.content, curr.content, "", "");
        await q(`UPDATE bill_versions SET diff_from_prev = $1 WHERE id = $2`, [
            patch,
            curr.id,
        ]);
    }
}
