import fs from "fs";
import path from "path/win32";

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