# Firebase Backup & Bootstrap System

This system allows you to backup and restore Firebase data across different environments (emulators, staging, production).

## 📋 Available Commands

```bash
npm run backup:export        # Export from emulators
npm run backup:import        # Import to emulators
npm run backup:export:prod   # Export from production
npm run backup:import:prod   # Import to production
npm run backup:package       # Create seed data package
npm run backup:import:seed   # Import seed data to emulators
npm run backup:list          # List all backups
```

## 🚀 Environment Bootstrap Workflow

### Scenario: Setting up a new Firebase project with meaningful data

1. **Create seed data** (from your current development environment):
   ```bash
   npm run backup:package
   ```

2. **Bootstrap new Firebase project**:
   ```bash
   # Method A: Using our backup system
   FIREBASE_PROJECT_ID=your-new-project npm run backup:import:prod
   
   # Method B: Using Firebase CLI directly
   firebase firestore:import gs://backup-bucket/seed-data/firestore_export --project your-new-project
   ```

3. **Configure your new project**:
   - Update `.firebaserc` with new project ID
   - Update Firebase config in your app
   - Set up authentication providers
   - Configure storage rules

## 📁 Backup Structure

```
backups/
├── seed-data/           # Version-controlled seed data
│   ├── firestore_export/
│   ├── storage_export/
│   └── backup-metadata.json
├── dev-exports/         # Local development exports (gitignored)
│   └── export-YYYY-MM-DD/
└── prod-exports/        # Production exports (gitignored)
    └── prod-export-YYYY-MM-DD/
```

## 🔧 Configuration

### Environment Variables
- `FIREBASE_PROJECT_ID` - Target project for production imports

### Storage Requirements
- Cloud Storage bucket for temporary imports/exports
- Appropriate IAM permissions for Firebase CLI

## ⚠️ Security Notes

- **Production imports require confirmation** - they can overwrite existing data
- **Seed data is committed to git** - ensure no sensitive information
- **Dev/prod exports are gitignored** - they may contain sensitive data

## 🛠️ Common Use Cases

### 1. Developer Onboarding
```bash
git clone repo
npm install
npm run backup:import:seed  # Get meaningful test data
npm run dev:start
```

### 2. Creating Test Environment
```bash
npm run backup:package     # From dev environment
FIREBASE_PROJECT_ID=test-project npm run backup:import:prod
```

### 3. Production Backup
```bash
npm run backup:export:prod
```

### 4. Disaster Recovery
```bash
# Import latest production backup to new project
FIREBASE_PROJECT_ID=recovery-project npm run backup:import:prod
```

## 🔍 Troubleshooting

### Firebase CLI not authenticated
```bash
firebase login
```

### Missing permissions
Ensure your account has:
- Firestore Admin
- Storage Admin
- Cloud Storage Admin

### Invalid project ID
Check `.firebaserc` and ensure project exists:
```bash
firebase projects:list
```
