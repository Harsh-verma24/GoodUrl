import { ListObjectsV2Command, S3Client ,GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
    

export async function downloadS3Folder(prefix: string) {
    console.log("download start")
  const s3 = new S3Client({
    endpoint: process.env.AWS_ENDPOINT!,
    region: process.env.AWS_REGION!,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  console.log(prefix);
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Prefix: prefix,
  });

  const response = await s3.send(command);
  console.log("Objects found:", response.Contents?.length ?? 0);
console.log(JSON.stringify(response, null, 2));
  const allPromise = (response.Contents || []).map(async (file) => {
    if (!file.Key) {
      return;
    }
    const finalOutputPath = path.join(__dirname, file.Key!);
    const dirName = path.dirname(finalOutputPath);
    console.log(`Downloading ${file.Key} to ${finalOutputPath}`);
    
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }
    const outputFile = fs.createWriteStream(finalOutputPath);
    
    const {Body} = await s3.send(new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: file.Key!,
    }));

    if(!Body) return;

    await pipeline(
        Body as NodeJS.ReadableStream,
        outputFile
    )

    return finalOutputPath;

  });
  await Promise.all(allPromise?.filter(x => x !== undefined));
  console.log("downloaded")
  console.log(response.Contents?.length || 0)
  // return response.Contents?.length || 0;
}



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

export const getAllFiles = (dirPath: string) => {
    let response : string[] = [];
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
        const fullFilePath = path.join(dirPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath));
        }
        else{
            response.push(fullFilePath);
        }
    });
    return response;
}


export async function  copyFinalDistToS3(id: string){
  const projectPath = path.join(__dirname, `output/${id}`);
  const buildOutputFolder = ["dist", ".next", "out"]
    .map((folderName) => path.join(projectPath, folderName))
    .find((folderPath) => fs.existsSync(folderPath));

  if (!buildOutputFolder) {
    throw new Error(`No build output folder found in ${projectPath}`);
  }

  const allFiles = getAllFiles(buildOutputFolder);

  await Promise.all(
    allFiles.map((file) => {
      const relativeFilePath = path.relative(buildOutputFolder, file).replace(/\\/g, "/");
      return uploadFileToS3(`dist/${id}/${relativeFilePath}`, file);
    })
  );
} 