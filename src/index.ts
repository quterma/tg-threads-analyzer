import "dotenv/config";
import { initClient } from "./telegram.js";

(async () => {
  try {
    const client = await initClient();
    console.log("READY:", !!client);
    process.exit(0);
  } catch (e) {
    console.error("FAILED:", e);
    process.exit(1);
  }
})();
