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
  const host = req.hostname;
  console.log(host);
  const id = host.split(".")[0];
  console.log(id);
  const filePath = req.path;
  console.log(filePath);
  const key = `dist/${id}${filePath}`;
  console.log(key);


  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  const content = await s3.send(command);
  if (!content.Body) {
    res.status(404).send("File not found");
    return;
  }
  const type = filePath.endsWith("html")
    ? "text/html"
    : filePath.endsWith("css")
      ? "text/css"
      : "application/javascript";
  res.setHeader("Content-Type", type);
  res.send(await toBuffer(content.Body));
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
