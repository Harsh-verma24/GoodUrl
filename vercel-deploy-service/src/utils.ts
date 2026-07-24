import { spawn } from 'child_process';
import path from 'path';
import fs from "fs"
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args);

    child.stdout?.on("data", (data) => {
      console.log(data.toString());
    });

    child.stderr?.on("data", (data) => {
      console.log(data.toString());
    });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed ${code}`));
    });

    child.on("error", reject);
  });
}

// export async function buildProject(id:string){
//     console.log("build start")

//     return new Promise<void>((resolve ,reject)  => {

//         const projectPath = path.join(__dirname,`output/${id}`)
//         console.log(projectPath)
//         console.log(fs.existsSync(projectPath))
//    const child = spawn("docker", [
//   "run",
//   "--rm",
//   "-v",
//   `${projectPath}:/app`,
//   "-w",
//   "/app",
//   "--user",
//   "root",
//   "node:20-alpine",
//   "sh",
//   "-lc",
//   "npm install && npm run build",
// ], {
//   stdio: ["ignore", "pipe", "pipe"],
// });

//     child.stdout?.on("data",function(data){
//         console.log("stdout:"+ data)
//     })

//     child.stderr?.on("data",function(data){
//         console.log("stderr:"+ data)
//     })

//    child.on("close", (code) => {
//       if (code === 0) {
//         resolve();
//       } else {
//         reject(new Error(`Build failed with exit code ${code}`));
//       }
//     });

//     child.on("error",reject)
//     })
// }

export async function buildProject(id: string) {

  console.log("build start");

  const projectPath = path.join(__dirname, `output/${id}`);
  const volumeName = `build-${id}`;


  console.log("Creating volume");

  await runCommand("docker", [
    "volume",
    "create",
    volumeName
  ]);


  console.log("Copying project");

  await runCommand("docker", [
    "run",
    "--rm",
    "-v",
    `${projectPath}:/source`,
    "-v",
    `${volumeName}:/app`,
    "alpine",
    "sh",
    "-c",
    "cp -r /source/* /app"
  ]);


  console.log("Running build");


  await runCommand("docker", [
    "run",
    "--rm",
    "-v",
    `${volumeName}:/app`,
    "-w",
    "/app",
    "node:20-alpine",
    "sh",
    "-lc",
    "npm install && npm run build"
  ]);
console.log("Copying build output back");

await runCommand("docker", [
  "run",
  "--rm",
  "-v",
  `${volumeName}:/app`,
  "-v",
  `${projectPath}:/output`,
  "alpine",
  "sh",
  "-c",
  "cp -r /app/dist /output"
]);

  console.log("Build completed");

  

}