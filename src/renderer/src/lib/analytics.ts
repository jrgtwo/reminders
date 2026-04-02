// Abstraction layer — import from here, not from posthog.ts directly.
// To swap analytics providers: replace posthog.ts and update this import.
export { capture, identifyUser, resetUser } from './posthog'
