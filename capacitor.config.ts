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
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: []
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
