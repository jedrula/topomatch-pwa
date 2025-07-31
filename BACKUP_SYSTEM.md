# Backup & Data Migration System

## Overview
Cross-environment backup system for Firebase data (Firestore + Storage) that works with both emulators and production.

## Use Cases
1. **Seed Data**: Export emulator data → Import on fresh dev setup
2. **Disaster Recovery**: Scheduled production backups → Restore if needed
3. **Environment Migration**: Production → Staging/Dev environments

## Commands

### Development (Emulators)
```bash
# Export current emulator data
npm run backup:export

# Import seed data to emulators  
npm run backup:import

# Create seed data package for distribution
npm run backup:package
```

### Production
```bash
# Export production data
npm run backup:export:prod

# Import to production (careful!)
npm run backup:import:prod

# Schedule automated backups
npm run backup:schedule
```

## File Structure
```
backups/
├── seed-data/           # Distributed seed data
├── dev-exports/         # Local emulator exports
├── prod-exports/        # Production exports
└── scripts/             # Backup utilities
```

## Backup Contents
- **Firestore Collections**: All documents and subcollections
- **Storage Files**: Images, videos, and other uploads
- **Metadata**: Timestamps, environment info, version

## Safety Features
- Environment validation (prevents prod → dev accidents)
- Incremental backups (only changed data)
- Compression for large exports
- Rollback capability

## Quick Start
1. Export current dev data: `npm run backup:export`
2. Share with team: Commit `backups/seed-data/`
3. New dev imports: `npm run backup:import`
