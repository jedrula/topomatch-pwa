# iOS Push Notifications Setup

## What's Been Done (Frontend)
✅ Installed `@capacitor/push-notifications` plugin
✅ Updated `pushNotificationService.js` to support both web and iOS
✅ Added PushNotifications config to `capacitor.config.ts`
✅ Tokens saved to Firestore at `/users/{userId}/pushTokens/{token}`

## Required: iOS Xcode Configuration

### 1. Enable Push Notifications Capability
1. Open `ios/App/App.xcworkspace` in Xcode
2. Select your app target
3. Go to "Signing & Capabilities" tab
4. Click "+ Capability"
5. Add "Push Notifications"

### 2. Update AppDelegate.swift
Add these methods to `ios/App/App/AppDelegate.swift`:

```swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    // ... existing code ...
    
    // ADD THESE TWO METHODS:
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }
}
```

### 3. Configure Firebase for iOS Push
1. Make sure `GoogleService-Info.plist` is in your iOS project
2. Ensure APNs certificates are configured in Firebase Console:
   - Go to Firebase Console → Project Settings → Cloud Messaging
   - Upload your APNs Authentication Key or Certificate

### 4. Sync and Build
```bash
npx cap sync ios
npm run ios:build
```

## How It Works

### Web (Browser)
- Uses Web Push API with VAPID keys
- Service worker handles notifications
- Tokens saved to `/users/{userId}/webPushSubscriptions/{id}`

### iOS (Capacitor)
- Uses native APNS (Apple Push Notification Service)
- Registers device token with Firebase
- Tokens saved to `/users/{userId}/pushTokens/{token}`
- Platform: `ios`, Type: `capacitor`

## Backend Updates Needed

The server-side notification sending needs to support both:
1. **Web Push subscriptions**: Send using `web-push` library with VAPID keys
2. **iOS tokens**: Send using Firebase Admin SDK's `messaging.send()`

Update `/server/src/services/notificationService.ts` to:
- Query both `webPushSubscriptions` and `pushTokens` collections
- Send to web users using existing web-push flow
- Send to iOS users using Firebase Admin SDK

## Testing
1. Run app in iOS Simulator or device
2. Sign in
3. Check console for "Push registration success, token: ..."
4. Verify token saved in Firestore
5. Test notification from Firebase Console or your backend

## Firestore Schema

```
/users/{userId}/
  ├── webPushSubscriptions/     # Web browsers
  │   └── {subscriptionId}
  │       ├── endpoint
  │       ├── keys
  │       ├── createdAt
  │       └── lastUsed
  │
  └── pushTokens/               # iOS/Android native
      └── {token}
          ├── token
          ├── platform: "ios" | "android"
          ├── type: "capacitor"
          ├── createdAt
          └── lastUsed
```
