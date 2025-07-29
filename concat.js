import { readFileSync, writeFileSync } from "fs";

// Build inference worker
const part1 = readFileSync("src/workers/inferenceWorkerOnnxCode.js", "utf-8");
const part2 = readFileSync("src/workers/inferenceWorker.js", "utf-8");

writeFileSync("public/inferenceWorker.combined.js", part1 + "\n" + part2);

// Build hold detection worker
const onnxCode = readFileSync("src/workers/inferenceWorkerOnnxCode.js", "utf-8");
const holdDetectionWorker = readFileSync("src/workers/holdDetectionWorker.js", "utf-8");

writeFileSync("public/holdDetectionWorker.combined.js", onnxCode + "\n" + holdDetectionWorker);
