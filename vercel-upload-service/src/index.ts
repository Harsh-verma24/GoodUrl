import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import {simpleGit} from "simple-git";
import { generate } from "./utils.js";
import path from "path";
import { fileURLToPath } from "url";
import { getAllFiles } from "./file.js";
import { uploadFileToS3 } from "./aws.js";
import {createClient} from "redis";

const publisher = createClient();
const subscriber = createClient();
publisher.on("error", (err) => console.log("Redis Client Error", err));

await publisher.connect();
await subscriber.connect();



const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();
app.use(cors())
app.use(express.json())
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/deploy",async(req,res)=>{
    const repoUrl = req.body.repoUrl;
    const id = generate();
    await simpleGit().clone(repoUrl,path.join(__dirname, `output/${id}`))
    console.log(repoUrl);

    // get all files in the output folder

    const files = getAllFiles(path.join(__dirname, `output/${id}`));
    await Promise.all(
      files.map((file) =>
        uploadFileToS3(file.slice(__dirname.length + 1).replace(/\\/g, "/"), file)
      )
    );

     await publisher.lPush("build-queue",id);
     publisher.hSet("status", id , "uploaded");
    //upload all files to s3
    res.json({
      id:id
    })
})

 app.get("/status",async(req,res)=>{
    const id = req.query.id;
    const status = await subscriber.hGet("status",id as string);
    res.json({
        status:status
    })
 })
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});