import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.topomatch.app',
  appName: 'TopoMatch',
  webDir: 'dist',
  server: {
    cleartext: true, // Allow HTTP for localhost/development
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false // Allow Firebase Auth redirects
  },
  // Inline plugins need to be registered in packageClassList
  // @ts-ignore - undocumented but required for inline plugins
  packageClassList: [
    'IosPoseDetectionPlugin',
    'IosImageMatchingPlugin'
  ],
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: []
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#ffffff'
    },
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
