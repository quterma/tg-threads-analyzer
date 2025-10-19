import fs from "fs";
import prompts from "prompts";
import { TelegramClient } from "telegram";
import sessionsPkg from "telegram/sessions/index.js";
const { StringSession } = sessionsPkg;

export function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env`);
  return v;
}

export function loadSessionString(path: string): string {
  try {
    if (fs.existsSync(path)) {
      return fs.readFileSync(path, "utf-8").trim();
    }
    return "";
  } catch (e) {
    console.error("Failed to load session file:", e);
    return "";
  }
}

export function saveSessionString(path: string, session: string): void {
  try {
    const dir = path.split("/").slice(0, -1).join("/");
    if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path, session, "utf-8");
    console.log(`Session saved to ${path}`);
  } catch (e) {
    console.error("Failed to save session file:", e);
  }
}

export function createClient(sessionString: string) {
  const apiId = Number(getEnv("API_ID"));
  const apiHash = getEnv("API_HASH");
  return new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });
}

async function ask(type: "text" | "password", message: string) {
  const { value } = await prompts({ type, name: "value", message });
  return (value ?? "") as string;
}

const authPrompts = {
  phoneNumber: () => ask("text", "Enter your phone number:"),
  password: () => ask("password", "Enter 2FA password (if set):"),
  phoneCode: () => ask("text", "Enter the code you received:"),
};

export async function initClient() {
  const sessionFile = getEnv("SESSION_FILE");
  const sessionStr = loadSessionString(sessionFile);
  const client = createClient(sessionStr);

  console.log("Connecting to Telegram...");

  await client.start({
    ...authPrompts,
    onError: (err: unknown) => {
      throw err;
    },
  });
  console.log("✅ Connected to Telegram");

  const newSession = (client.session as any).save() as string;
  saveSessionString(sessionFile, newSession);
  console.log("💾 Session saved to", sessionFile);

  return client;
}
