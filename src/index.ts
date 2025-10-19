import { initClient } from "./telegram.js";
(async () => {
  console.log(await initClient());
})();
