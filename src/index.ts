import "dotenv/config";
import prompts from "prompts";
import { initClient, fetchMessages } from "./telegram.js";
import { buildReport } from "./aggregate.js";

(async () => {
  const { chat, tz } = await prompts([
    { type: "text", name: "chat", message: "Enter @group or chat ID:" },
    {
      type: "text",
      name: "tz",
      message: "Enter timezone (IANA):",
      initial: "Asia/Tashkent",
    },
  ]);
  if (!chat) {
    console.error("❌ No chat provided");
    process.exit(1);
  }

  const client = await initClient();

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const msgs = await fetchMessages(client, chat, since);
    const zone = (tz && tz.trim()) || "Asia/Tashkent";
    const report = buildReport(msgs, zone);
    console.log(JSON.stringify(report, null, 2));
  } catch (e) {
    console.error("FAILED:", e);
    process.exitCode = 1;
  } finally {
    await client.disconnect();
    process.exit(0);
  }
})();
