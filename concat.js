import { readFileSync, writeFileSync } from "fs";

const part1 = readFileSync("src/workers/inferenceWorkerOnnxCode.js", "utf-8");
const part2 = readFileSync("src/workers/inferenceWorker.js", "utf-8");

writeFileSync("public/inferenceWorker.combined.js", part1 + "\n" + part2);
