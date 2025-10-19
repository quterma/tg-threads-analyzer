import type { RawMsg } from "./telegram.js";

export function localDay(d: Date, tz: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return fmt.format(d);
}

export type ThreadKey = string;

export function threadKey(m: RawMsg): ThreadKey | undefined {
  if (m.replyToTopId != null) return String(m.replyToTopId); // форум/корень цепочки
  if (m.topicId != null) return String(m.topicId); // форум-топики
  if (m.replyToId != null) return String(m.replyToId); // ответ на сообщение
  return undefined; // одиночка — не считаем как тред
}

function authorId(m: RawMsg): number | undefined {
  return m.fromId;
}

export type ThreadStats = {
  messages: number;
  users: Set<number>;
  firstText?: string;
};

export function countThreads(msgs: RawMsg[]): Map<string, ThreadStats> {
  const byThread = new Map<string, ThreadStats>();
  for (const m of msgs) {
    const k = threadKey(m);
    if (k === undefined) continue; // <-- ключ: игнорим одиночные сообщения

    const s = byThread.get(k) ?? { messages: 0, users: new Set<number>() };
    s.messages += 1;
    if (m.fromId != null) s.users.add(m.fromId);
    if (s.firstText === undefined && m.text) s.firstText = m.text;
    byThread.set(k, s);
  }
  return byThread;
}

export type ReportDay = {
  date: string;
  threads: { topic: string; messages: number; users: number }[];
};

export function buildReport(msgs: RawMsg[], tz = "Asia/Tashkent") {
  const byDay = new Map<string, RawMsg[]>();

  for (const m of msgs) {
    const day = localDay(m.date, tz);
    const arr = byDay.get(day) ?? [];
    arr.push(m);
    byDay.set(day, arr);
  }

  const days: ReportDay[] = [];
  for (const date of [...byDay.keys()].sort()) {
    const arr = byDay.get(date)!;
    const threads = [...countThreads(arr).entries()].map(([, s]) => ({
      topic: s.firstText ?? "(no title)",
      messages: s.messages,
      users: s.users.size,
    }));
    days.push({ date, threads });
  }

  return { timezone: tz, days };
}
