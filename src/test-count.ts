import { countThreads } from "./aggregate.js";
type RM = {
  id: number;
  date: Date;
  fromId?: number;
  text?: string;
  replyToId?: number;
  replyToTopId?: number;
  topicId?: number;
};
const msgs: RM[] = [
  { id: 1, date: new Date(), fromId: 10, text: "hello", replyToTopId: 100 },
  { id: 2, date: new Date(), fromId: 11, text: "hi", replyToTopId: 100 },
  { id: 3, date: new Date(), fromId: 10, text: "ok", replyToId: 2 },
];
const map = countThreads(msgs as any);
console.log(
  [...map.entries()].map(([k, v]) => [k, v.messages, v.users.size, v.firstText])
);
