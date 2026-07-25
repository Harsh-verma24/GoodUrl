import fs from "fs";
import path from "path";

 export const getAllFiles = (dirPath: string) => {
    let response : string[] = [];
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
        if (file === ".git" || file === "node_modules") {
            return;
        }
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