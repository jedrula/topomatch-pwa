/**
 * Inspect Diagnostic Report Document
 * 
 * This script fetches and displays the structure of a diagnostic report
 * from Firestore to help debug why UI elements aren't displaying correctly.
 * 
 * Usage:
 *   node debug/scripts/inspect-diagnostic.js <ascentId> [--production]
 * 
 * Examples:
 *   # Emulator (default - no auth required)
 *   node debug/scripts/inspect-diagnostic.js 7eee15ba-ad03-466a-9880-f7fa8c561237
 * 
 *   # Production (requires service account credentials in server/ folder)
 *   GOOGLE_APPLICATION_CREDENTIALS=./server/topomatch-pwa-firebase-adminsdk.json node debug/scripts/inspect-diagnostic.js <id> --production
 */

import { initializeFirebase, getFirestore } from './firebase-connection.js';
import { doc, getDoc } from 'firebase/firestore';

const COLLECTION = 'analysisDiagnostics';

async function inspectDiagnostic(ascentId) {
  console.log(`\n🔍 Inspecting diagnostic for ascent: ${ascentId}\n`);
  
  const db = getFirestore();
  const docRef = doc(db, COLLECTION, ascentId);
  
  try {
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('❌ Document does not exist');
      return;
    }
    
    const data = docSnap.data();
    console.log('✅ Document found!\n');
    
    // Display document structure
    console.log('📊 Document Structure:');
    console.log('='.repeat(80));
    
    // Basic info
    console.log('\n📌 Basic Info:');
    console.log(`  - Document ID: ${docSnap.id}`);
    console.log(`  - Ascent ID: ${data.ascentId}`);
    console.log(`  - User ID: ${data.userId}`);
    console.log(`  - Location ID: ${data.locationId}`);
    console.log(`  - Created: ${data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : 'N/A'}`);
    console.log(`  - Updated: ${data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : 'N/A'}`);
    
    // Match info
    console.log('\n🎯 Match Info:');
    if (data.match) {
      console.log(`  - Matched Image ID: ${data.match.matchedImageId || 'N/A'}`);
      console.log(`  - Match ID: ${data.match.matchId || 'N/A'}`);
      console.log(`  - Total Matches: ${data.match.totalMatches ?? 'N/A'}`);
      console.log(`  - Homography Inliers: ${data.match.homographyInliers ?? 'N/A'}`);
      console.log(`  - Server Quality: ${data.match.serverQuality || 'N/A'}`);
      
      // Debug URLs - THIS IS WHAT WE'RE LOOKING FOR
      console.log('\n🖼️  Debug URLs:');
      console.log(`  - Combined Debug URL: ${data.match.combinedDebugUrl || '❌ MISSING'}`);
      console.log(`  - Match Visualization URL: ${data.match.matchVisualizationUrl || '❌ MISSING'}`);
      console.log(`  - Matched Image URL: ${data.match.matchedImageUrl || '❌ MISSING'}`);
    } else {
      console.log('  ❌ No match data');
    }
    
    // Frames info
    console.log('\n🎬 Frames Info:');
    if (data.frames && Array.isArray(data.frames)) {
      console.log(`  - Total frames: ${data.frames.length}`);
      
      data.frames.forEach((frame, idx) => {
        console.log(`\n  Frame ${idx + 1}:`);
        console.log(`    - Frame Index: ${frame.frameIndex}`);
        console.log(`    - Limb Holds: ${frame.limbHolds?.length || 0}`);
        console.log(`    - Scoring entries: ${frame.scoring?.length || 0}`);
        
        // Check for debug URLs at frame level
        if (frame.debugUrls) {
          console.log(`    - Debug URLs:`);
          console.log(`      • Combined: ${frame.debugUrls.combinedDebugUrl || '❌ Missing'}`);
          console.log(`      • Visualization: ${frame.debugUrls.visualizationUrl || '❌ Missing'}`);
          console.log(`      • Pose Debug: ${frame.debugUrls.poseDebugUrl || '❌ Missing'}`);
        } else {
          console.log(`    - Debug URLs: ❌ MISSING (frame.debugUrls is undefined)`);
        }
        
        // Show limb holds summary
        if (frame.limbHolds && frame.limbHolds.length > 0) {
          frame.limbHolds.forEach((limb, limbIdx) => {
            console.log(`      Limb ${limbIdx + 1}: ${limb.limbName} (confidence: ${(limb.confidence * 100).toFixed(0)}%)`);
            if (limb.closestHolds && limb.closestHolds.length > 0) {
              console.log(`        Closest holds: ${limb.closestHolds.length}`);
            }
          });
        }
      });
    } else {
      console.log('  ❌ No frames data');
    }
    
    // Scores
    console.log('\n🏆 Overall Scores:');
    if (data.scores && Array.isArray(data.scores)) {
      console.log(`  - Total scored problems: ${data.scores.length}`);
      data.scores.slice(0, 5).forEach((score, idx) => {
        console.log(`    ${idx + 1}. ${score.name}: ${(score.score * 100).toFixed(1)}%`);
      });
    } else {
      console.log('  ❌ No scores data');
    }
    
    // Full raw data (for deep inspection)
    console.log('\n📄 Full Raw Data (JSON):');
    console.log('='.repeat(80));
    console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(80));
    
    // Summary
    console.log('\n📋 Summary:');
    const hasMatchDebugUrls = data.match?.combinedDebugUrl || data.match?.matchVisualizationUrl;
    const hasFrameDebugUrls = data.frames?.some(f => f.debugUrls);
    
    console.log(`  - Has match-level debug URLs: ${hasMatchDebugUrls ? '✅' : '❌'}`);
    console.log(`  - Has frame-level debug URLs: ${hasFrameDebugUrls ? '✅' : '❌'}`);
    
    if (!hasMatchDebugUrls && !hasFrameDebugUrls) {
      console.log('\n⚠️  WARNING: No debug URLs found at any level!');
      console.log('   This is why the buttons are not showing in the UI.');
      console.log('   The backend needs to include these URLs when creating diagnostic reports.');
    }
    
  } catch (error) {
    console.error('❌ Error fetching document:', error);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const ascentId = args[0];
const useProduction = args.includes('--production');

if (!ascentId) {
  console.error('❌ Error: ascentId is required');
  console.log('\nUsage:');
  console.log('  node debug/scripts/inspect-diagnostic.js <ascentId> [--production]');
  console.log('\nExamples:');
  console.log('  # Emulator (default)');
  console.log('  node debug/scripts/inspect-diagnostic.js 7eee15ba-ad03-466a-9880-f7fa8c561237');
  console.log('\n  # Production (requires auth - see firebase-connection.js for setup)');
  console.log('  node debug/scripts/inspect-diagnostic.js 7eee15ba-ad03-466a-9880-f7fa8c561237 --production');
  process.exit(1);
}

// Initialize and run
initializeFirebase(!useProduction);
inspectDiagnostic(ascentId)
  .then(() => {
    console.log('\n✅ Inspection complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
