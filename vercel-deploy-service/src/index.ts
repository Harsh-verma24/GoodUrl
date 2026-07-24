import dotenv from "dotenv";
dotenv.config();

import { createClient } from "redis";

const publisher = createClient({
  url: process.env.REDIS_URL!
});

const subscriber = createClient({
  url: process.env.REDIS_URL!
});

await subscriber.connect();
await publisher.connect();

async function main() {
  const { copyFinalDistToS3, downloadS3Folder } = await import("./aws.js");
  const { buildProject } = await import("./utils.js");

  while (true) {
    const response = await subscriber.brPop("build-queue", 0);
    const id = response?.element;

    if (!id) {
      console.log("No id received from build-queue");
      continue;
    }

    await downloadS3Folder(`output/${id}`);
    await buildProject(id);
    await copyFinalDistToS3(id);
    await publisher.hSet("status", id, "deployed");
  }
}

main();

// await downloadS3Folder("output/atemt8")
// await buildProject("atemt8")