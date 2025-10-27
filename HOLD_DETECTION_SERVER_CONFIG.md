# Hold Detection Server Configuration

## Backend Configuration (Cloud Functions)

Since the automatic hold detection is now handled by Cloud Functions (not frontend), you need to update the backend configuration when the detection server URL changes.

**Note**: This project uses the modern `defineString()` API with `.env` files, not the deprecated `functions.config()`.

**Important**: There is **no default value** for `HOLD_DETECTION_SERVER_URL`. This is intentional - the app will fail fast if not configured, preventing silent failures with wrong URLs.

### Quick Setup

```bash
cd server

# Copy the example file
cp .env.example .env

# Edit .env and update the URL
# HOLD_DETECTION_SERVER_URL=https://your-ngrok-url.ngrok-free.app

# IMPORTANT: For emulators, also update .env.local
# (Emulators use .env.local, not .env)
# Edit .env.local with your local ngrok URL

# For production, create .env.production
cp .env.example .env.production
# Edit and update with production URL
```

**Important**: Firebase Emulators specifically use `.env.local`, not `.env`. Make sure to update `.env.local` when changing your local development URL!

### Method 1: Environment File (Recommended)

#### For Local Development (Emulator)
Edit `server/.env.local`:
```bash
HOLD_DETECTION_SERVER_URL=https://your-local-url.ngrok-free.app
```

**Note**: Emulators specifically use `.env.local`, not `.env`!

Then restart the emulator:
```bash
cd server
npm run serve
```

#### For Production Deployment
Create or update `server/.env.production`:
```bash
HOLD_DETECTION_SERVER_URL=https://your-production-url.ngrok-free.app
```

Then deploy:
```bash
cd server
npm run deploy
```

**Important**: Add `.env` files to `.gitignore` if they contain sensitive URLs!

### Method 2: Firebase Console (Production Only)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Functions** → **Configuration** → **Environment variables**
4. Add/update: `HOLD_DETECTION_SERVER_URL=https://your-url.ngrok-free.app`
5. Redeploy functions: `cd server && npm run deploy`

### ~~Method 3: Firebase CLI (DEPRECATED)~~

```bash
# ⚠️ DEPRECATED - Do not use after Dec 31, 2025
# firebase functions:config:set hold_detection.server_url="..."
```

This method is deprecated and will stop working after December 31, 2025. Use `.env` files instead.

### Current Configuration

**Cloud Function**: `server/src/holdDetection.ts`
```typescript
const DETECTION_SERVER_URL = defineString("HOLD_DETECTION_SERVER_URL", {
  description: "URL of the hold detection server",
  default: "https://6d2401b5f155.ngrok-free.app",
});
```

### How It Works

1. User uploads location image → Firebase Storage
2. **Cloud Function** `onLocationImageUploaded` triggers automatically
3. Function reads `HOLD_DETECTION_SERVER_URL` from environment config
4. Function sends image to detection server
5. Function saves results to Firestore

### Frontend (Legacy)

The frontend still has a hardcoded URL in `src/services/holdDetectionApiService.ts` for **admin testing only**. This is NOT used for automatic detection.

If you need to test detection from the admin panel, manually update:
```typescript
// src/services/holdDetectionApiService.ts
function getApiUrl(): string {
  return 'https://your-new-url.ngrok-free.app' // Update this line
}
```

---

## Migration Notes

- ✅ **Removed**: `src/services/configService.js` (frontend config management)
- ✅ **Removed**: Admin panel URL configuration UI
- ✅ **Removed**: Firestore `/app-config/settings` collection (no longer used)
- ✅ **Backend**: Cloud Function uses `HOLD_DETECTION_SERVER_URL` environment variable
- ⚠️ **Frontend**: Hardcoded URL kept only for admin testing/debugging

## Quick Reference

| Use Case | Method | File/Location |
|----------|---------|---------------|
| **Local development** | Edit `server/.env.local` | `HOLD_DETECTION_SERVER_URL=https://...` |
| **Production** | Edit `server/.env.production` | `HOLD_DETECTION_SERVER_URL=https://...` |
| **Production (alt)** | Firebase Console | Functions → Configuration → Env vars |
| **View current value** | Check `.env.local` or `.env.production` | Emulator uses `.env.local` |
| **Admin testing only** | Hardcoded in code | `src/services/holdDetectionApiService.ts` |

---

**Last Updated**: October 27, 2025  
**Migration**: Using modern `defineString()` API with `.env` files (not deprecated `functions.config()`)
