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

export function threadKey(m: RawMsg): ThreadKey {
  return String(m.replyToTopId ?? m.topicId ?? m.replyToId ?? m.id);
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
  for (const [date, arr] of byDay.entries()) {
    const threads = [...countThreads(arr).entries()].map(([_, s]) => ({
      topic: s.firstText ?? "(no title)",
      messages: s.messages,
      users: s.users.size,
    }));
    days.push({ date, threads });
  }

  return { timezone: tz, days };
}
