# TopMatch PWA Setup Guide

This guide will help you set up the TopMatch PWA application on a new machine.

## Prerequisites

### Node.js Version Requirements
- **Frontend**: Node.js 18+ (works with warnings)
- **Firebase CLI**: Node.js 20+ or 22+ (required)
- **Recommended**: Node.js 20+ for full compatibility

### Installation Steps

1. **Install Node.js 20+**
   ```bash
   # Using Node Version Manager (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 20
   nvm use 20
   
   # Verify installation
   node --version  # Should show v20.x.x
   npm --version   # Should show v10.x.x
   
   # Or download from https://nodejs.org/
   ```

2. **Clone Repository and Switch to Development Branch**
   ```bash
   git clone <repository-url>
   cd topomatch-pwa
   git checkout pose-model
   ```

3. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   cd ..
   ```

4. **Install Firebase CLI**
   ```bash
   # Remove old Firebase CLI if installed with older Node version
   sudo npm uninstall -g firebase-tools  # Only if previously installed
   
   # Install with Node 20+
   npm install -g firebase-tools
   
   # Verify installation
   firebase --version
   ```

5. **Prepare Workers**
   ```bash
   # Combine worker files (required before starting frontend)
   node concat.js
   ```

6. **Initial Setup with Seed Data**
   ```bash
   # First time only - import seed data and start emulators
   npm run backup:import:seed
   # Use Ctrl+C to stop when ready - this saves seed data + any changes to firebase-emulator-data/
   ```

7. **Start Development Servers**
   
   **Terminal 1 - Frontend:**
   ```bash
   npm run dev
   # Runs on http://localhost:5173/
   ```
   
   **Terminal 2 - Firebase Emulators:**
   ```bash
   cd server
   npm run serve
   # Starts Firebase emulators with your saved data (seed + any changes you've made)
   ```

## Project Structure

- `src/` - Vue.js frontend source code
- `server/` - Firebase Functions backend
- `public/` - Static assets and combined worker files
- `concat.js` - Script to combine worker files

## Common Issues

### Node.js Version Compatibility
- Firebase CLI requires Node 20+ but shows warnings, not errors
- Frontend works with Node 18+ but shows deprecation warnings
- Solution: Upgrade to Node 20+ for best experience

### Worker Files
- The `concat.js` script must be run before starting the frontend
- This combines `inferenceWorkerOnnxCode.js` and `inferenceWorker.js` into `public/inferenceWorker.combined.js`
- Also combines hold detection worker files

### Firebase Emulator Issues
- **Java Required**: Firebase emulators require Java to be installed. Install with `sudo apt install default-jre` on Ubuntu/Debian
- Ensure ports 4000, 5001, 8085, 9000, 9090, 9099, 9199, 8080 are available
- Use `npm run emulators:kill` in server directory to kill stuck processes

## Development Workflow

### First Time Setup
1. Run `npm run backup:import:seed` to start emulators with seed data
2. Interact with the app, make changes, add test data
3. Stop emulators with Ctrl+C (automatically saves all data)

### Daily Development  
1. Always run `node concat.js` after pulling changes that affect worker files
2. Start Firebase emulators: `cd server && npm run serve` (loads your accumulated data)
3. Start frontend server: `npm run dev`
4. Frontend will be available at http://localhost:5173/
5. Firebase emulator UI typically at http://localhost:4000/

### Data Persistence
- Emulators automatically save data to `firebase-emulator-data/` on exit
- Each restart loads your previous data + any changes you've made
- Seed data provides initial content, then you build your own dataset

## Build Process

The application uses:
- **Frontend**: Vite for bundling and development server
- **Backend**: Firebase Functions with TypeScript
- **Database**: Firestore (via emulator in development)
- **Storage**: Firebase Storage (via emulator in development)

## Notes

- The application includes machine learning models for pose detection and image matching
- ONNX runtime is used for running ML models in the browser
- Worker threads are used for computationally intensive tasks
