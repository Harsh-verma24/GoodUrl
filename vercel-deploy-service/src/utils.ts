import { spawn } from 'child_process';
import path from 'path';
import fs from "fs"
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildProject(id:string){
    console.log("build start")

    return new Promise<void>((resolve ,reject)  => {

        const projectPath = path.join(__dirname,`output/${id}`)
        console.log(projectPath)
        console.log(fs.existsSync(projectPath))
   const child = spawn("docker", [
  "run",
  "--rm",
  "-v",
  `${projectPath}:/app`,
  "-w",
  "/app",
  "--user",
  "root",
  "--cap-drop=ALL",
  "--security-opt",
  "no-new-privileges",
  "node:20-alpine",
  "sh",
  "-lc",
  "npm install && npm run build",
], {
  stdio: ["ignore", "pipe", "pipe"],
});

    child.stdout?.on("data",function(data){
        console.log("stdout:"+ data)
    })

    child.stderr?.on("data",function(data){
        console.log("stderr:"+ data)
    })

   child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Build failed with exit code ${code}`));
      }
    });

    child.on("error",reject)
    })
}