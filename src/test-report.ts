import { buildReport } from "./aggregate.js";

const fakeMsgs = [
  {
    id: 1,
    date: new Date("2025-10-19T08:00:00Z"),
    fromId: 1,
    text: "Morning update",
    replyToTopId: 100,
  },
  {
    id: 2,
    date: new Date("2025-10-19T09:00:00Z"),
    fromId: 2,
    text: "Follow up",
    replyToTopId: 100,
  },
  {
    id: 3,
    date: new Date("2025-10-18T14:00:00Z"),
    fromId: 1,
    text: "Old thread",
    topicId: 200,
  },
];

const report = buildReport(fakeMsgs as any, "Asia/Tashkent");

console.log(JSON.stringify(report, null, 2));
