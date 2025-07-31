#!/usr/bin/env node
/**
 * Cross-Environment Firebase Backup System
 * Works with both emulators and production Firebase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const SEED_DATA_DIR = path.join(BACKUP_DIR, 'seed-data');
const DEV_EXPORTS_DIR = path.join(BACKUP_DIR, 'dev-exports');
const PROD_EXPORTS_DIR = path.join(BACKUP_DIR, 'prod-exports');

// Ensure backup directories exist
[BACKUP_DIR, SEED_DATA_DIR, DEV_EXPORTS_DIR, PROD_EXPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

class BackupSystem {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  // Export from emulators (development)
  async exportDev() {
    console.log('🔄 Exporting from Firebase emulators...');
    
    const exportPath = path.join(DEV_EXPORTS_DIR, `export-${this.timestamp}`);
    
    try {
      // Export emulator data
      execSync(`firebase emulators:export "${exportPath}" --only firestore,storage`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      
      // Create metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        environment: 'development',
        type: 'emulator-export',
        path: exportPath
      };
      
      fs.writeFileSync(
        path.join(exportPath, 'backup-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      console.log(`✅ Dev export completed: ${exportPath}`);
      return exportPath;
    } catch (error) {
      console.error('❌ Dev export failed:', error.message);
      throw error;
    }
  }

  // Import to emulators (development)
  async importDev(importPath = null) {
    const targetPath = importPath || this.findLatestExport(DEV_EXPORTS_DIR) || SEED_DATA_DIR;
    
    console.log(`🔄 Importing to Firebase emulators from: ${targetPath}`);
    
    try {
      execSync(`firebase emulators:start --import="${targetPath}" --only firestore,storage`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      
      console.log('✅ Dev import completed');
    } catch (error) {
      console.error('❌ Dev import failed:', error.message);
      throw error;
    }
  }

  // Export from production
  async exportProd() {
    console.log('🔄 Exporting from production Firebase...');
    
    const exportPath = path.join(PROD_EXPORTS_DIR, `prod-export-${this.timestamp}`);
    const bucketPath = `gs://your-backup-bucket/exports/${this.timestamp}`;
    
    try {
      // Export Firestore to Cloud Storage
      execSync(`firebase firestore:export ${bucketPath} --project your-production-project`, {
        stdio: 'inherit'
      });
      
      // Download to local for processing
      execSync(`gsutil -m cp -r ${bucketPath} "${exportPath}"`, {
        stdio: 'inherit'
      });
      
      // Export Storage files
      execSync(`gsutil -m cp -r gs://your-production-project.appspot.com "${exportPath}/storage"`, {
        stdio: 'inherit'
      });
      
      // Create metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        environment: 'production',
        type: 'production-export',
        path: exportPath,
        cloudPath: bucketPath
      };
      
      fs.writeFileSync(
        path.join(exportPath, 'backup-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      console.log(`✅ Production export completed: ${exportPath}`);
      return exportPath;
    } catch (error) {
      console.error('❌ Production export failed:', error.message);
      throw error;
    }
  }

  // Create seed data package
  async createSeedData() {
    console.log('🔄 Creating seed data package...');
    
    try {
      // First export current dev data
      const exportPath = await this.exportDev();
      
      // Copy to seed data directory
      execSync(`cp -r "${exportPath}"/* "${SEED_DATA_DIR}/"`, { stdio: 'inherit' });
      
      // Update metadata for seed data
      const metadata = {
        timestamp: new Date().toISOString(),
        environment: 'seed',
        type: 'seed-data',
        description: 'Development seed data for new setups'
      };
      
      fs.writeFileSync(
        path.join(SEED_DATA_DIR, 'backup-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      console.log(`✅ Seed data package created: ${SEED_DATA_DIR}`);
      console.log('💡 Commit this to version control for team distribution');
      
    } catch (error) {
      console.error('❌ Seed data creation failed:', error.message);
      throw error;
    }
  }

  // Import seed data to emulators
  async importSeedData() {
    console.log('🔄 Importing seed data to emulators...');
    
    if (!fs.existsSync(SEED_DATA_DIR)) {
      console.error('❌ No seed data found. Run "npm run backup:package" first.');
      return;
    }
    
    try {
      // Start emulators with seed data
      console.log('Starting emulators with seed data...');
      console.log('Use Ctrl+C to stop when ready, then run your app normally');
      
      execSync(`firebase emulators:start --import="${SEED_DATA_DIR}" --only firestore,storage`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      
    } catch (error) {
      // Expected when user stops emulators
      console.log('✅ Seed data imported successfully');
    }
  }

  // Utility: Find latest export
  findLatestExport(directory) {
    if (!fs.existsSync(directory)) return null;
    
    const exports = fs.readdirSync(directory)
      .filter(name => fs.statSync(path.join(directory, name)).isDirectory())
      .map(name => ({
        name,
        path: path.join(directory, name),
        mtime: fs.statSync(path.join(directory, name)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    return exports.length > 0 ? exports[0].path : null;
  }

  // List available backups
  listBackups() {
    console.log('📋 Available backups:\n');
    
    ['seed-data', 'dev-exports', 'prod-exports'].forEach(type => {
      const dir = path.join(BACKUP_DIR, type);
      if (fs.existsSync(dir)) {
        console.log(`${type.toUpperCase()}:`);
        const items = fs.readdirSync(dir).filter(name => 
          fs.statSync(path.join(dir, name)).isDirectory()
        );
        
        if (items.length === 0) {
          console.log('  (none)');
        } else {
          items.forEach(item => {
            const metadataPath = path.join(dir, item, 'backup-metadata.json');
            if (fs.existsSync(metadataPath)) {
              const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
              console.log(`  ${item} - ${metadata.timestamp}`);
            } else {
              console.log(`  ${item}`);
            }
          });
        }
        console.log('');
      }
    });
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const backup = new BackupSystem();
  
  try {
    switch (command) {
      case 'export':
        await backup.exportDev();
        break;
      case 'import':
        await backup.importDev();
        break;
      case 'export-prod':
        await backup.exportProd();
        break;
      case 'package':
        await backup.createSeedData();
        break;
      case 'import-seed':
        await backup.importSeedData();
        break;
      case 'list':
        backup.listBackups();
        break;
      default:
        console.log(`
Usage: node backup.js <command>

Commands:
  export       Export from emulators to dev-exports/
  import       Import latest dev export to emulators
  export-prod  Export from production Firebase
  package      Create seed data package from current dev data
  import-seed  Import seed data to emulators
  list         List all available backups
        `);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BackupSystem;
