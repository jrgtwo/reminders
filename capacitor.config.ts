 import type { CapacitorConfig } from '@capacitor/cli'

 const config: CapacitorConfig = {
   appId: 'com.remindertoday.app',
   appName: 'Reminders',
   webDir: 'dist/renderer',
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
   },
 }

 export default config
