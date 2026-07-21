import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.washempire.app',
  appName: 'Wash Empire',
  webDir: 'dist',
  android: {
    buildOptions: {
      // Google Play requires AAB for new apps.
      releaseType: 'AAB',
    },
  },
}

export default config
