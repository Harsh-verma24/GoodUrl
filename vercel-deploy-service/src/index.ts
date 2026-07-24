import dotenv from "dotenv";
dotenv.config();

import { createClient } from "redis";
import { copyFinalDistToS3, downloadS3Folder } from "./aws.js";
import { buildProject } from "./utils.js";

const subscriber = createClient();
const publisher = createClient();


await subscriber.connect();
await publisher.connect();

async function main(){
    while (true) {
    const response = await subscriber.brPop(
        "build-queue",
        0
    );

    // console.log(response);
//     console.log(JSON.stringify(response, null, 2));
// console.log(response?.element);
// console.log(response?.element.length);
// console.log([...response!.element]);
    const id = response?.element;

    if (!id) {
        console.log("No id received from build-queue");
        continue;
    }

   await downloadS3Folder(`output/${id}`);
   await buildProject(id);
   await copyFinalDistToS3(id);
   publisher.hSet("status", id, "deployed");
}
}

main();

// await downloadS3Folder("output/atemt8")
// await buildProject("atemt8")