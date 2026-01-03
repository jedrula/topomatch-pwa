# Push Notifications Setup

This feature allows admins to send push notifications to all users when new routesetting is published at a location.

## Architecture

### Frontend Components
- **LocationDetailView**: "Publish Routesetting" button for admins
- **pushNotificationService.js**: FCM token management and notification requests
- **main.js**: Auto-requests notification permission on login
- **firebase-messaging-sw.js**: Service worker handling background notifications

### Backend
- **notifications.ts**: Firebase Function `notifyNewRoutesetting` 
  - Sends batch notifications to all users
  - Admin-only (checks `users/{uid}/isAdmin`)
  - Future: Will filter by location followers

### Data Structure
```
/users/{userId}/fcmTokens/{tokenId}
  - token: string (FCM registration token)
  - createdAt: timestamp
  - lastUsed: timestamp
```

## Setup Instructions

### 1. Generate VAPID Key

In Firebase Console:
1. Go to Project Settings > Cloud Messaging
2. Under "Web Push certificates", click "Generate key pair"
3. Copy the generated key

### 2. Add Environment Variables

Add to `.env.local` (development):
```env
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
```

Add to `.env.production`:
```env
VITE_FIREBASE_VAPID_KEY=your-production-vapid-key-here
```

### 3. Deploy Firebase Functions

```bash
cd server
npm run build
npm run deploy:functions
```

### 4. Test in Development

1. Start emulators: `npm run serve` (in server/)
2. Start dev server: `npm run dev` (in root)
3. Login as admin user
4. Navigate to a location
5. Click "Publish Routesetting" button
6. Check browser console for notification permission prompt

### 5. Deploy to Production

```bash
# Frontend (includes service worker)
npm run deploy:frontend

# Functions (if not done in step 3)
cd server && npm run deploy:functions
```

## User Flow

1. **User logs in** → Auto-prompts for notification permission
2. **User grants permission** → FCM token saved to Firestore
3. **Admin clicks "Publish Routesetting"** → Calls Cloud Function
4. **Function sends notifications** → All users receive push
5. **User clicks notification** → Navigates to location page

## Browser Support

- ✅ Chrome/Edge (desktop & mobile)
- ✅ Firefox (desktop & mobile)  
- ✅ Safari 16.4+ (macOS & iOS)
- ❌ Safari < 16.4 (no push notification support)

## Future Enhancements

### Phase 2: Location Following
- Add "Follow" button on location pages
- Store: `/users/{userId}/followedLocations/{locationId}`
- Filter notifications to only followers
- Update `notifyNewRoutesetting` to query followers collection

### Phase 3: Notification Settings
- User preferences: notification types, frequency
- **Note**: Digest mode and per-location muting are not planned features - notifications will remain instant and global on/off only

## Testing

### Emulator Testing
Push notifications work in emulators for:
- ✅ Permission requests
- ✅ Token generation and storage
- ✅ Function execution
- ❌ Actual push delivery (FCM requires production)

### Production Testing
1. Deploy functions and frontend
2. Login on 2+ devices/browsers
3. Grant notification permission on all
4. Publish routesetting from one device
5. Verify notification received on others

## Troubleshooting

### "Permission denied" error
- User not logged in, or
- User is not admin (check `users/{uid}/isAdmin = true`)

### No permission prompt shown
- Already denied in browser settings
- Have user reset site permissions

### Token not saving
- Check Firestore rules allow write to `/users/{uid}/fcmTokens`
- Verify VAPID key is correct

### Notifications not received
- Verify service worker is registered (DevTools > Application > Service Workers)
- Check browser notification permissions (Settings > Privacy)
- Ensure device is online and has active token

### "Failed to send notification"
- Check Cloud Function logs: `firebase functions:log`
- Verify FCM is enabled in Firebase Console
- Check token validity (FCM may expire old tokens)

## Security

- ✅ Admin-only function (checks `isAdmin` claim)
- ✅ Authenticated requests only
- ✅ Token cleanup for invalid registrations
- ✅ Rate limiting via Firebase Functions quotas

## Cost Considerations

- FCM is free (1M messages/month)
- Cloud Functions charged per invocation
- Firestore reads: 1 per user + 1 per token
- Estimated cost: < $0.01 per notification batch (100 users)

## Monitoring

View notification metrics:
```bash
# Function logs
firebase functions:log --only notifyNewRoutesetting

# Firestore token count
# Count docs in /users/{userId}/fcmTokens subcollections
```
