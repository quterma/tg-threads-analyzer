import "dotenv/config";
import prompts from "prompts";
import { initClient, fetchMessages } from "./telegram.js";

(async () => {
  const { chat } = await prompts({
    type: "text",
    name: "chat",
    message: "Enter group username (e.g. @groupname) or numeric chat ID:",
  });

  if (!chat) {
    console.error("❌ No chat provided.");
    process.exit(1);
  }

  const client = await initClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const msgs = await fetchMessages(client, chat, since);

  console.log("Fetched:", msgs.length, "messages (last 7 days)");
  console.log("Sample:", msgs.slice(0, 3));
  process.exit(0);
})();
