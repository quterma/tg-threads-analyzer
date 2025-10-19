import fs from "fs";
import prompts from "prompts";
import { TelegramClient, Api } from "telegram";
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

export type RawMsg = {
  id: number;
  date: Date;
  fromId?: number;
  text?: string;
  replyToTopId?: number;
  replyToId?: number;
  topicId?: number;
};

function asDate(x: any): Date {
  return typeof x === "number" ? new Date(x * 1000) : new Date(x);
}

function normalizeFromId(m: any): number | undefined {
  const f = m?.fromId;
  if (!f) return undefined;
  if (typeof f === "number" || typeof f === "bigint") return Number(f);
  if (typeof f === "string") return Number(f);
  if (typeof f === "object" && "userId" in f) return Number((f as any).userId);
  if (
    typeof f === "object" &&
    "peerId" in f &&
    (f as any).peerId?.userId != null
  ) {
    return Number((f as any).peerId.userId);
  }
  return undefined;
}

export async function fetchMessages(
  client: any,
  chat: string | number,
  since: Date
): Promise<RawMsg[]> {
  const peer = await client.getEntity(chat);
  const limit = 100;
  let offsetId = 0;
  const all: RawMsg[] = [];

  while (true) {
    const res = await client.invoke(
      new Api.messages.GetHistory({ peer, limit, addOffset: 0, offsetId })
    );
    const msgs = ("messages" in res ? res.messages : []) as any[];
    if (!msgs.length) break;

    for (const m of msgs) {
      const msgDate = asDate(m.date);
      if (msgDate < since) return all;

      const rt = m.replyTo ?? {};
      const obj: any = {
        id: m.id as number,
        date: msgDate,
      };
      if (normalizeFromId(m) != null) obj.fromId = normalizeFromId(m);
      if (rt.replyToMsgId != null) obj.replyToId = rt.replyToMsgId;
      if (rt.replyToTopId != null) obj.replyToTopId = rt.replyToTopId;
      if (m.topicId != null) obj.topicId = m.topicId;
      if (m.message) obj.text = m.message as string;

      all.push(obj as RawMsg);
    }

    offsetId = (msgs[msgs.length - 1]?.id as number) ?? offsetId;
  }

  return all;
}

function jsonReplacer(_k: string, v: any) {
  return typeof v === "bigint" ? Number(v) : v;
}

export async function debugDumpRaw(
  client: any,
  chat: string | number,
  limit = 20
) {
  const peer = await client.getEntity(chat);
  const res = await client.invoke(new Api.messages.GetHistory({ peer, limit }));
  const msgs = ("messages" in res ? res.messages : []) as any[];
  fs.writeFileSync("raw-sample.json", JSON.stringify(msgs, jsonReplacer, 2));
  console.log("Saved raw-sample.json with", msgs.length, "items");
}
