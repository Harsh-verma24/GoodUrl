import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();
import express from "express";

const app = express();

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  endpoint: process.env.AWS_ENDPOINT!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function toBuffer(body: unknown): Promise<Buffer> {
  if (typeof body === "string") {
    return Buffer.from(body);
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  const streamBody = body as {
    transformToByteArray?: () => Promise<Uint8Array>;
  };

  if (typeof streamBody.transformToByteArray === "function") {
    return Buffer.from(await streamBody.transformToByteArray());
  }

  throw new TypeError("Unsupported S3 body type");
}
app.get(/.*/, async (req, res) => {
  const parts = req.path.split("/").filter(Boolean);
  const id = parts[0];
  if (!id) {
    res.status(400).send("Deployment id missing");
    return;
  }

  let filePath = "/" + parts.slice(1).join("/");

  if (filePath === "/") {
    filePath = "/index.html";
  }
  console.log(filePath);
  const key = `dist/${id}${filePath}`;
  console.log(key);

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  try {
    const content = await s3.send(command);

    if (!content.Body) {
      res.status(404).send("File not found");
      return;
    }

    const ext = filePath.split(".").pop()?.toLowerCase();
    const types: Record<string, string> = {
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      svg: "image/svg+xml",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      ico: "image/x-icon",
      txt: "text/plain",
      woff: "font/woff",
      woff2: "font/woff2",
    };
    const type = types[ext ?? ""] || "application/octet-stream";
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(await toBuffer(content.Body));
  } catch (error) {
    console.log(error);
    res.status(404).send("File not found");
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
