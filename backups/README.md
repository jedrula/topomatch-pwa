# Backup Directories

This folder contains Firebase data exports for different purposes:

- `seed-data/` - Seed data for new developer setups (commit to git)
- `dev-exports/` - Local emulator exports (gitignored)  
- `prod-exports/` - Production data exports (gitignored)

## Usage

See [BACKUP_SYSTEM.md](../BACKUP_SYSTEM.md) for full documentation.

Quick commands:
- `npm run backup:package` - Create seed data from current emulator state
- `npm run backup:import:seed` - Import seed data to emulators
