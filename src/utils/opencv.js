/**
 * OpenCV.js singleton loader
 * 
 * Pattern from TechStark's official React+Vite example:
 * https://github.com/TechStark/opencv-js-examples/tree/main/opencv-js-react-example/src/opencv/opencv.js
 */

import cvModule from '@techstark/opencv-js';

let cvPromise;

/**
 * Load OpenCV.js WASM module
 * @returns {Promise<{cv: Object}>} Object containing OpenCV cv module
 */
export async function loadOpenCV() {
  // Return existing promise if already loading/loaded
  if (!cvPromise) {
    cvPromise = getOpenCv();
  }
  
  return cvPromise;
}

async function getOpenCv() {
  let cv;
  if (cvModule instanceof Promise) {
    cv = await cvModule;
  } else {
    if (cvModule.Mat) {
      // already initialized
      cv = cvModule;
    } else {
      await new Promise((resolve) => {
        cvModule.onRuntimeInitialized = () => resolve();
      });
      cv = cvModule;
    }
  }
  return { cv };
}

export function translateException(cv, err) {
  if (typeof err === "number") {
    try {
      const exception = cv.exceptionFromPtr(err);
      return exception;
    } catch (_error) {
      // ignore
    }
  }
  return err;
}
