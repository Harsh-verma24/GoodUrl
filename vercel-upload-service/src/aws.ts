import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

console.log({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  bucket: process.env.AWS_BUCKET_NAME,
});



export const uploadFileToS3 = async (fileName: string, localPath: string) => {
    const s3Client = new S3Client({
        region: process.env.AWS_REGION!,
        endpoint: process.env.AWS_ENDPOINT!,
        forcePathStyle: true,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    }); 
    const fileContent =  fs.readFileSync(localPath);
   try{
     const response = await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileName,
        Body: fileContent,
    })) 
    console.log("File uploaded successfully:", response);
   }
   catch(err){
    console.error("Error uploading file to S3:", err);
   }

}