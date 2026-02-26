# Hold Detection Server Configuration

Single source of truth: Firestore document `app-config/backend` field `holdDetection.serverUrl`.

## Set / Update

### Option A: Admin UI (preferred)

Use the admin page `/admin/healthcheck` to view and update the URL.

### Option B: Firestore Console

Create/update the document:

- Collection: `app-config`
- Document ID: `backend`

Example payload:

```json
{
  "holdDetection": {
    "serverUrl": "https://<your-ngrok>.ngrok-free.app"
  }
}
```

## How It’s Used

- **Cloud Functions** (automatic hold detection): reads `holdDetection.serverUrl` via Admin SDK.
- **Frontend** (admin testing + match-images): reads the same Firestore value at runtime.

## Notes

- The env var `HOLD_DETECTION_SERVER_URL` and `VITE_HOLD_DETECTION_API_URL` are no longer used.
