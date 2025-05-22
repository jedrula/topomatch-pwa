import fs from "fs";
import path from "path";

export default function prependWorkerOnnxCode() {
  const workerPath = path.resolve("src/workers/inferenceWorker.js");
  const onnxPath = path.resolve("src/workers/inferenceWorkerOnnxCode.js");

  return {
    name: "prepend-worker-onnx-code",
    enforce: "pre",
    async load(id) {
      console.log("loading", id);
      // Only target the worker file
      if (id.includes("inferenceWorker.js")) {
        const onnxCode = await fs.promises.readFile(onnxPath, "utf-8");
        const workerCode = await fs.promises.readFile(workerPath, "utf-8");
        return `${onnxCode}\n${workerCode}`;
      }
      return null;
    },
  };
}
