import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { q } from "./db.js";
import crypto from "crypto";
function sha256(s) {
    return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}
function parseUaDate(d) {
    // '02.10.2025' -> '2025-10-02'
    const m = d.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!m)
        return null;
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
}
async function getFirstHtmlWithPlaywright(url) {
    const browser = await chromium.launch();
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded" });
        return await page.content();
    }
    finally {
        await browser.close();
    }
}
// POST форма періоду: потрібні exact-поля, як у розмітці
async function postPeriodPage(url, startVal, endVal, pageNum, cookie) {
    const body = new URLSearchParams({
        "PeriodSite.start": startVal, // приклад: '9/25/2025 12:00:00 AM'
        "PeriodSite.end": endVal, // приклад: '10/2/2025 12:00:00 AM'
        "Paging.page": String(pageNum),
    }).toString();
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36",
            ...(cookie ? { cookie } : {}),
            referer: url,
        },
        body,
    });
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} on POST ${url} page=${pageNum}`);
    }
    return await res.text();
}
// Парсимо таблицю сторінки у масив BillLite
function collectFromHtml(html) {
    const $ = cheerio.load(html);
    const items = [];
    // 1) витягаємо start/end (для наступних POSTів)
    const startVal = $("#PeriodSite_start").val()?.toString() ||
        $("#startDate").val()?.toString() ||
        undefined;
    const endVal = $("#PeriodSite_end").val()?.toString() ||
        $("#endDate").val()?.toString() ||
        undefined;
    // 2) порахуємо maxPage
    let maxPage = 1;
    $(".pagination .pagination-button").each((_, el) => {
        const t = $(el).text().trim(); // '2', '3', '4', '»'
        const dp = $(el).attr("data-page")?.trim();
        const n = Number(dp ?? t);
        if (Number.isFinite(n))
            maxPage = Math.max(maxPage, n);
    });
    // 3) рядки таблиці
    $("#periodBills tbody tr").each((_, tr) => {
        const tds = $(tr).find("td");
        if (tds.length < 4)
            return;
        const a = $(tds[1]).find("a.link-blue").first();
        const href = a.attr("href") || "";
        const regNum = a.text().trim();
        const dateText = $(tds[2]).text().replace(/\s+/g, " ").trim(); // 'dd.mm.yyyy'
        const isoDate = parseUaDate(dateText);
        const titleRaw = $(tds[3]).text();
        const title = titleRaw.replace(/\s+/g, " ").trim();
        if (!href || !title)
            return;
        const url = new URL(href, "https://itd.rada.gov.ua").toString();
        const radaId = href.match(/\/Card\/(\d+)/i)?.[1] || href;
        items.push({
            radaId,
            url,
            title,
            lawTitle: title,
            number: regNum || undefined,
            registeredAt: isoDate || undefined,
        });
    });
    return { items, startVal, endVal, maxPage };
}
export async function ingestPeriod(daysBack = 2) {
    const listUrl = "https://itd.rada.gov.ua/billInfo/Bills/period";
    // 1) перша сторінка (GET)
    const firstHtml = await getFirstHtmlWithPlaywright(listUrl);
    const first = collectFromHtml(firstHtml);
    // 2) далі сторінки 2..N (POST з формою)
    const all = {};
    for (const it of first.items)
        all[it.radaId] = it;
    const startVal = first.startVal;
    const endVal = first.endVal;
    if (!startVal || !endVal) {
        console.warn("Не знайдено PeriodSite_start/end — лишаємо тільки першу сторінку.");
    }
    else {
        for (let p = 2; p <= first.maxPage; p++) {
            try {
                const html = await postPeriodPage(listUrl, startVal, endVal, p);
                const { items } = collectFromHtml(html);
                for (const it of items)
                    all[it.radaId] = it; // дедуп по radaId
            }
            catch (e) {
                console.warn(`Не вдалося завантажити сторінку ${p}:`, e?.message ?? e);
            }
        }
    }
    const items = Object.values(all);
    console.log("Знайдено записів загалом:", items.length);
    // upsert у БД
    for (const it of items) {
        await q(`INSERT INTO bills (rada_id, title, url, number, registered_at, law_title)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (rada_id)
       DO UPDATE SET
         title         = EXCLUDED.title,
         url           = EXCLUDED.url,
         number        = COALESCE(EXCLUDED.number, bills.number),
         registered_at = COALESCE(EXCLUDED.registered_at, bills.registered_at),
         law_title     = COALESCE(EXCLUDED.law_title, bills.law_title)`, [
            it.radaId,
            it.title,
            it.url,
            it.number ?? null,
            it.registeredAt ?? null,
            it.lawTitle ?? null,
        ]);
    }
    return items;
}
export async function ingestBillDetails(url, radaId) {
    const browser = await chromium.launch();
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded" });
        const html = await page.content();
        const $ = cheerio.load(html);
        const title = $("h1, .bill-title").first().text().trim() || $("title").text().trim();
        const status = $('*:contains("Статус")').next().text().trim() || null;
        const content = [
            title,
            $(".bill-summary").text().trim(),
            $(".bill-text").text().trim(),
            $("main").text().trim().slice(0, 20000),
        ]
            .filter(Boolean)
            .join("\n\n");
        const upd = await q(`UPDATE bills SET title = COALESCE($1, title), status = $2
       WHERE rada_id = $3
       RETURNING id`, [title || null, status, radaId]);
        const billId = upd.rows[0].id;
        const hash = sha256(content);
        const prev = await q(`SELECT content_hash FROM bill_versions WHERE bill_id = $1 ORDER BY fetched_at DESC LIMIT 1`, [billId]);
        if (!prev.rows[0] || prev.rows[0].content_hash !== hash) {
            await q(`INSERT INTO bill_versions (bill_id, content_hash, content)
         VALUES ($1,$2,$3)
         ON CONFLICT DO NOTHING`, [billId, hash, content]);
        }
        return billId;
    }
    finally {
        await browser.close();
    }
}
