import "dotenv/config";
import { tryLock, unlock } from "./lock.js";
import { ingestPeriod, ingestBillDetails } from "./ingest.js";
import { computeDiffs } from "./diff.js";
import { classifyAndScore } from "./classify.js";
import { sendInstantAlertIfHigh } from "./alerts.js";

async function main() {
  if (!(await tryLock())) {
    console.log("Another run is in progress. Exiting.");
    return;
  }
  try {
    const daysBack = Number(
      process.argv.find((a) => a.startsWith("--daysBack="))?.split("=")[1] ?? 2
    );

    const list = await ingestPeriod(daysBack);
    for (const item of list) {
      const billId = await ingestBillDetails(item.url, item.radaId);
      await computeDiffs(billId);
      await classifyAndScore(billId);
      //await sendInstantAlertIfHigh(billId);
      // (digest — окремим cron-завданням)
    }
  } finally {
    await unlock();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
