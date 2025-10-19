import { localDay, threadKey } from "./aggregate.js";

const tz = "Asia/Tashkent";
console.log("localDay:", localDay(new Date("2025-10-19T00:30:00Z"), tz)); // ожидаемо: 2025-10-19

const msgs = [
  { id: 10, date: new Date(), replyToTopId: 100 } as any,
  { id: 11, date: new Date(), replyToId: 10 } as any,
  { id: 12, date: new Date() } as any,
];

console.log("keys:", msgs.map(threadKey)); // ожидаемо: ["100","10","12"]
