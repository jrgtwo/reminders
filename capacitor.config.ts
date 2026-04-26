 import type { CapacitorConfig } from '@capacitor/cli'

 const config: CapacitorConfig = {
   appId: 'com.remindertoday.app',
   appName: 'Reminders',
   webDir: 'dist/renderer',
   server: {
     hostname: 'remindertoday.com',
     iosScheme: 'https',
   },
   ios: {
     contentInset: 'never',
     backgroundColor: '#0d1117',
   },
   plugins: {
     StatusBar: {
       style: 'DARK',
       overlaysWebView: true,
     },
     Keyboard: {
       resize: 'body',
       style: 'DARK',
       resizeOnFullScreen: true,
     },
     LocalNotifications: {},
     BackgroundRunner: {
       label: 'com.remindertoday.app.sync',
       src: 'runner.js',
       event: 'sync',
       repeat: true,
       interval: 15, // minutes — Android floor; iOS treats as a hint
       autoStart: true,
     },
   },
 }

 export default config
