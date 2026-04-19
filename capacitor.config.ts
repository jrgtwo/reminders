 import type { CapacitorConfig } from '@capacitor/cli'

 const config: CapacitorConfig = {
   appId: 'com.remindertoday.app',
   appName: 'Reminders',
   webDir: 'dist/renderer',
   ios: {
     contentInset: 'automatic',
   },
   plugins: {
     StatusBar: {
       style: 'DEFAULT',
       backgroundColor: '#ffffff',
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