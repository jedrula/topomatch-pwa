/**
 * Cleanup script for stuck transcoding videos
 * 
 * This script:
 * 1. Finds all ascents with video.status="transcoding"
 * 2. Checks actual Google Cloud Transcoder job status
 * 3. Updates Firestore to match reality (failed/succeeded/still-processing)
 * 
 * Usage: node scripts/cleanup-transcoding-state.js [userId]
 */

const admin = require('firebase-admin');
const { TranscoderServiceClient } = require('@google-cloud/video-transcoder');

admin.initializeApp();
const db = admin.firestore();
const transcoderClient = new TranscoderServiceClient();

const PROJECT_ID = 'topomatch-pwa';
const LOCATION = 'europe-west1';

async function findStuckVideos(userId = null) {
  console.log('🔍 Finding videos stuck in "transcoding" state...\n');
  
  let query = db.collection('ascents')
    .where('video.status', '==', 'transcoding');
  
  if (userId) {
    query = query.where('userId', '==', userId);
  }
  
  const snapshot = await query.get();
  
  console.log(`📊 Found ${snapshot.size} videos in "transcoding" state\n`);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    userId: doc.data().userId,
    video: doc.data().video,
    uploadedAt: doc.data().video?.uploadedAt?.toDate(),
  }));
}

async function extractJobIdFromLogs(ascentId) {
  console.log(`  📝 Searching Cloud Function logs for transcoder job ID...`);
  
  const { execSync } = require('child_process');
  
  try {
    // Get logs and search for this ascentId
    const logsCommand = `gcloud functions logs read onStorageFileCreated --region=europe-west1 --limit=200`;
    const allLogs = execSync(logsCommand, { encoding: 'utf-8', shell: '/bin/bash' });
    
    // Find the section with this ascentId
    const lines = allLogs.split('\n');
    let foundAscent = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes(ascentId)) {
        foundAscent = true;
      }
      
      // Look for "Transcoding job created" within a few lines after finding the ascentId
      if (foundAscent && line.includes('Transcoding job created')) {
        const match = line.match(/jobs\/([a-f0-9-]+)/);
        if (match) {
          console.log(`  ✓ Found job ID: ${match[1]}`);
          return match[1];
        }
      }
      
      // Reset if we've gone too far (more than 10 lines without finding the job)
      if (foundAscent && i > 10 && !line.includes('Transcoding job')) {
        foundAscent = false;
      }
    }
  } catch (error) {
    console.log(`  ⚠️  Error searching logs: ${error.message}`);
  }
  
  console.log(`  ❌ Could not find job ID in recent logs`);
  return null;
}

async function checkTranscoderJobStatus(jobId) {
  try {
    const jobPath = `projects/${PROJECT_ID}/locations/${LOCATION}/jobs/${jobId}`;
    const [job] = await transcoderClient.getJob({ name: jobPath });
    
    return {
      state: job.state,
      error: job.error,
      startTime: job.startTime,
      endTime: job.endTime,
      createTime: job.createTime,
    };
  } catch (error) {
    if (error.code === 5) { // NOT_FOUND
      return { state: 'NOT_FOUND', error: 'Job does not exist' };
    }
    throw error;
  }
}

async function updateAscentStatus(ascentId, status, error = null) {
  const updates = {
    'video.status': status,
  };
  
  if (error) {
    updates['video.error'] = error;
  }
  
  await db.collection('ascents').doc(ascentId).update(updates);
  console.log(`  ✅ Updated Firestore: status="${status}"`);
}

async function processVideo(video, manualJobIds = {}) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📹 Ascent: ${video.id}`);
  console.log(`   User: ${video.userId}`);
  console.log(`   Uploaded: ${video.uploadedAt}`);
  console.log(`   Video ID: ${video.video.videoId}`);
  console.log(`   Time in "transcoding": ${getTimeDiff(video.uploadedAt)}`);
  
  // Check if job ID provided manually
  let jobId = manualJobIds[video.id];
  
  if (!jobId) {
    // First check if stored in Firestore (future-proof after we deploy the fix)
    jobId = video.video.transcoderJobId;
    if (jobId) {
      console.log(`  ✓ Found job ID in Firestore: ${jobId}`);
    }
  }
  
  if (!jobId) {
    // Try to extract job ID from logs (fallback for old videos)
    jobId = await extractJobIdFromLogs(video.id);
  } else if (manualJobIds[video.id]) {
    console.log(`  📌 Using manually provided job ID: ${jobId}`);
  }
  
  if (!jobId) {
    console.log(`  ❌ Could not find transcoder job ID`);
    console.log(`  💡 Recommendation: Mark as failed (job never created or lost)`);
    return {
      ascentId: video.id,
      action: 'mark-failed',
      reason: 'Job ID not found in logs',
    };
  }
  
  console.log(`  🎬 Transcoder Job ID: ${jobId}`);
  
  // Check actual job status
  const jobStatus = await checkTranscoderJobStatus(jobId);
  
  console.log(`  📊 Job State: ${jobStatus.state}`);
  
  if (jobStatus.error) {
    console.log(`  ❌ Error: ${JSON.stringify(jobStatus.error, null, 2)}`);
  }
  
  if (jobStatus.createTime) {
    const created = new Date(jobStatus.createTime.seconds * 1000);
    console.log(`  🕐 Created: ${created.toISOString()}`);
  }
  
  if (jobStatus.endTime) {
    const ended = new Date(jobStatus.endTime.seconds * 1000);
    console.log(`  🏁 Ended: ${ended.toISOString()}`);
  }
  
  // Determine action based on state
  let action = null;
  let reason = null;
  
  switch (jobStatus.state) {
    case 'FAILED':
      action = 'mark-failed';
      reason = jobStatus.error?.message || 'Transcoding job failed';
      break;
    
    case 'SUCCEEDED':
      action = 'verify-files';
      reason = 'Job succeeded but Firestore not updated - check if files exist';
      break;
    
    case 'PROCESSING':
    case 'PENDING':
      action = 'still-processing';
      reason = `Job is ${jobStatus.state.toLowerCase()}`;
      break;
    
    case 'NOT_FOUND':
      action = 'mark-failed';
      reason = 'Transcoder job not found (may have been cleaned up)';
      break;
    
    default:
      action = 'unknown';
      reason = `Unknown state: ${jobStatus.state}`;
  }
  
  console.log(`\n  💡 Recommended action: ${action}`);
  console.log(`  📝 Reason: ${reason}`);
  
  return {
    ascentId: video.id,
    jobId,
    jobStatus,
    action,
    reason,
  };
}

function getTimeDiff(date) {
  if (!date) return 'unknown';
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

async function main() {
  const args = process.argv.slice(2);
  const applyFixes = args.includes('--apply');
  const userId = args.find(arg => !arg.startsWith('--'));
  
  // Manual job ID mapping (for when logs are old/cleared)
  // Format: { ascentId: jobId }
  const manualJobIds = {
    '5968d4f2-ca16-4f20-b53c-fad947122a69': '590c364d-eaec-4a21-9b44-57a1ea0c6732',
    // Add more as needed: 'ascentId': 'jobId',
  };
  
  console.log('🧹 TRANSCODING STATE CLEANUP SCRIPT\n');
  
  if (applyFixes) {
    console.log('⚠️  --apply flag detected: WILL UPDATE FIRESTORE\n');
  }
  
  if (userId) {
    console.log(`🎯 Filtering by userId: ${userId}\n`);
  }
  
  // Step 1: Find stuck videos
  const stuckVideos = await findStuckVideos(userId);
  
  if (stuckVideos.length === 0) {
    console.log('✅ No videos stuck in transcoding state!');
    process.exit(0);
  }
  
  // Step 2: Check each video
  const results = [];
  for (const video of stuckVideos) {
    const result = await processVideo(video, manualJobIds);
    results.push(result);
  }
  
  // Step 3: Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 SUMMARY\n');
  
  const actionGroups = results.reduce((acc, r) => {
    acc[r.action] = (acc[r.action] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Actions needed:');
  Object.entries(actionGroups).forEach(([action, count]) => {
    console.log(`  ${action}: ${count}`);
  });
  
  // Step 4: Ask to apply fixes
  console.log('\n📝 Detailed results:');
  results.forEach(r => {
    console.log(`\n  Ascent ${r.ascentId}:`);
    console.log(`    Action: ${r.action}`);
    console.log(`    Reason: ${r.reason}`);
  });
  
  // Step 5: Apply fixes if --apply flag is set
  if (applyFixes) {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 APPLYING FIXES...\n');
    
    let updatedCount = 0;
    for (const result of results) {
      if (result.action === 'mark-failed') {
        console.log(`📝 Updating ${result.ascentId}...`);
        await updateAscentStatus(result.ascentId, 'failed', result.reason);
        updatedCount++;
      } else if (result.action === 'still-processing') {
        console.log(`⏭️  Skipping ${result.ascentId} (still processing)`);
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} ascent(s)`);
    console.log('💡 Refresh your UI to see the changes');
  } else {
    console.log('\n' + '='.repeat(80));
    console.log('💡 To apply fixes automatically, run:');
    console.log(`   node scripts/cleanup-transcoding-state.js ${userId ? userId + ' ' : ''}--apply`);
    console.log('\nOr manually update using Firebase Console or investigate-video.js script');
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
