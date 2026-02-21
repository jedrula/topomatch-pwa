/**
 * Inspect Analysis Logs for an Ascent
 * 
 * This script fetches all analysis log entries for a specific ascent to debug
 * why debug URLs might be missing or what the server is returning.
 * 
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./topomatch-pwa-firebase-adminsdk.json node debug/scripts/inspect-analysis-logs.js <ascentId>
 * 
 * Example:
 *   GOOGLE_APPLICATION_CREDENTIALS=./topomatch-pwa-firebase-adminsdk.json node debug/scripts/inspect-analysis-logs.js 7eee15ba-ad03-466a-9880-f7fa8c561237
 */

import admin from 'firebase-admin';

const COLLECTION = 'analysisLogs';

// Initialize Admin SDK
admin.initializeApp({
  projectId: 'topomatch-pwa'
});

const db = admin.firestore();

async function inspectAnalysisLogs(ascentId) {
  console.log(`\n🔍 Inspecting analysis logs for ascent: ${ascentId}\n`);
  
  try {
    const logsRef = db.collection(COLLECTION);
    const snapshot = await logsRef.where('ascentId', '==', ascentId).orderBy('timestamp', 'asc').get();
    
    if (snapshot.empty) {
      console.log('❌ No analysis logs found for this ascent');
      console.log('\nℹ️  This could mean:');
      console.log('   - The ascent was analyzed before logging was added');
      console.log('   - The analysis is still in progress');
      console.log('   - The ascent ID is incorrect');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} log entries\n`);
    console.log('='.repeat(80));
    
    snapshot.forEach((doc, idx) => {
      const data = doc.data();
      
      console.log(`\n📋 Log Entry ${idx + 1}/${snapshot.size}`);
      console.log('─'.repeat(80));
      console.log(`Document ID: ${doc.id}`);
      console.log(`Frame Index: ${data.frameIndex}`);
      console.log(`Timestamp: ${data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : 'N/A'}`);
      console.log(`Success: ${data.success ? '✅' : '❌'}`);
      
      if (data.error) {
        console.log(`\n❌ ERROR: ${data.error}`);
      }
      
      if (data.serverResult) {
        console.log('\n🖼️  Debug URLs:');
        console.log(`  - debug_images.combined_url: ${data.debugImagesCombinedUrl || '❌ MISSING'}`);
        console.log(`  - visualizationUrl: ${data.visualizationUrl || '❌ MISSING'}`);
        console.log(`  - download_url: ${data.downloadUrl || '❌ MISSING'}`);
        console.log(`  - pose_debug_url: ${data.poseDebugUrl || '❌ MISSING'}`);
        console.log(`  - Has any debug URLs: ${data.hasDebugUrls ? '✅' : '❌'}`);
        
        console.log('\n📊 Server Result Keys:');
        console.log(`  ${Object.keys(data.serverResult).join(', ')}`);
        
        console.log('\n📄 Full Server Result:');
        console.log(JSON.stringify(data.serverResult, null, 2));
      } else {
        console.log('\n⚠️  No server result data');
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Summary
    const successCount = snapshot.docs.filter(doc => doc.data().success).length;
    const withDebugUrls = snapshot.docs.filter(doc => doc.data().hasDebugUrls).length;
    
    console.log('\n📋 Summary:');
    console.log(`  - Total log entries: ${snapshot.size}`);
    console.log(`  - Successful: ${successCount}`);
    console.log(`  - Failed: ${snapshot.size - successCount}`);
    console.log(`  - With debug URLs: ${withDebugUrls}`);
    console.log(`  - Missing debug URLs: ${snapshot.size - withDebugUrls}`);
    
    if (withDebugUrls === 0) {
      console.log('\n⚠️  WARNING: No debug URLs found in any server response!');
      console.log('   The backend is not returning debug image URLs.');
      console.log('   Check the server code that generates these images.');
    }
    
  } catch (error) {
    console.error('❌ Error fetching logs:', error);
  }
}

// Parse command line arguments
const ascentId = process.argv[2];

if (!ascentId) {
  console.error('❌ Error: ascentId is required');
  console.log('\nUsage:');
  console.log('  GOOGLE_APPLICATION_CREDENTIALS=./topomatch-pwa-firebase-adminsdk.json node debug/scripts/inspect-analysis-logs.js <ascentId>');
  console.log('\nExample:');
  console.log('  GOOGLE_APPLICATION_CREDENTIALS=./topomatch-pwa-firebase-adminsdk.json node debug/scripts/inspect-analysis-logs.js 7eee15ba-ad03-466a-9880-f7fa8c561237');
  process.exit(1);
}

// Run
inspectAnalysisLogs(ascentId)
  .then(() => {
    console.log('\n✅ Inspection complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
