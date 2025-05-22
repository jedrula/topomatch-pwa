import fs from "fs";
import path from "path";

export default function prependWorkerOnnxCode() {
  const workerPath = path.resolve("src/workers/inferenceWorker.js");
  const onnxPath = path.resolve("src/workers/inferenceWorkerOnnxCode.js");
  const virtualId = "virtual:onnx-worker";

  return {
    name: "prepend-worker-onnx-code",
    resolveId(id) {
      if (id.includes(virtualId)) return id;
      return null;
    },
    async load(id) {
      console.log("Loading ID:", id);
      if (id.includes(virtualId)) {
        const onnxCode = await fs.promises.readFile(onnxPath, "utf-8");
        const workerCode = await fs.promises.readFile(workerPath, "utf-8");
        return `${onnxCode}\n${workerCode}`;
      }
      return null;
    },
  };
}
