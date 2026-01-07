import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.js';

/**
 * Wrapper for Firebase Cloud Functions calls
 * Uses native Capacitor plugin in iOS app, Firebase SDK in browser
 */

const isCapacitor = window.Capacitor !== undefined;

/**
 * Call a Firebase Cloud Function
 * @param {string} functionName - Name of the cloud function
 * @param {object} data - Data to send to the function
 * @returns {Promise<any>} - Function result
 */
export async function callFunction(functionName, data = {}) {
  if (isCapacitor) {
    // Use native Capacitor Firebase Functions plugin
    const { FirebaseFunctions } = await import('@capacitor-firebase/functions');
    
    const result = await FirebaseFunctions.callByName({
      name: functionName,
      data: data,
      region: 'europe-west1'
    });
    
    return result.data;
  } else {
    // Use Firebase SDK in browser
    const callable = httpsCallable(functions, functionName);
    const result = await callable(data);
    return result.data;
  }
}
