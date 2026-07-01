import { app, db } from './firebase.js'
import { getWatchedTerms } from './watches.js'

// Push notification GROUNDWORK ONLY: this gets a device permission +
// FCM token and keeps it synced with the local watch list in Firestore's
// push_subscriptions collection. It does NOT deliver anything — nothing in
// this app currently watches for new reports and sends a push. That needs
// either a Firebase Cloud Function (requires the Blaze plan) or extending
// whatsapp-bot with a Firestore listener + FCM send call, once that bot is
// actually deployed. Deliberately deferred — see README.
//
// No service worker changes were made for this: getToken() below reuses
// the service worker vite-plugin-pwa already registers
// (navigator.serviceWorker.ready) instead of adding a second
// firebase-messaging-sw.js. That keeps this addition from touching the
// existing PWA/offline-caching setup at all. The tradeoff is that once a
// real send-trigger exists, background/closed-tab delivery will need
// vite-plugin-pwa switched to injectManifest mode so the generated service
// worker can also run messaging.onBackgroundMessage() — not needed yet
// since there's nothing sending pushes.

const TOKEN_KEY = 'keycheck_push_token'

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof Notification !== 'undefined' &&
    'PushManager' in window
  )
}

export function getStoredPushToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function storePushToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // localStorage unavailable — push still works for this session, just
    // won't be remembered across reloads without asking again.
  }
}

let messagingInstance // undefined = not checked yet, null = unsupported/unavailable

async function getMessagingLazy() {
  if (messagingInstance !== undefined) return messagingInstance
  try {
    const { getMessaging, isSupported } = await import('firebase/messaging')
    if (!(await isSupported())) {
      messagingInstance = null
      return null
    }
    messagingInstance = getMessaging(app)
  } catch (err) {
    console.warn('Firebase Messaging not available:', err.message)
    messagingInstance = null
  }
  return messagingInstance
}

// Requests notification permission and, if granted, obtains an FCM token
// and stores it against the caller's current watched terms. Only ever call
// this from a direct user action (a "notify me" button click) — never on
// page load. Throws with a user-presentable message on any failure.
export async function enablePushNotifications() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser.')
  }
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    throw new Error('Push notifications are not configured for this deployment yet.')
  }

  const messaging = await getMessagingLazy()
  if (!messaging) {
    throw new Error('Push notifications are not supported in this browser.')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.')
  }

  const registration = await navigator.serviceWorker.ready
  const { getToken } = await import('firebase/messaging')
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration })
  if (!token) {
    throw new Error('Could not get a push token from Firebase.')
  }

  storePushToken(token)

  const { doc, setDoc } = await import('firebase/firestore')
  const now = new Date().toISOString()
  await setDoc(doc(db, 'push_subscriptions', token), {
    token,
    watchedTerms: getWatchedTerms(),
    createdAt: now,
    updatedAt: now
  })

  return token
}

// Wires a callback for foreground push messages (tab open) — background/
// closed-tab delivery isn't set up (see file header). Nothing sends a real
// push yet, so this has nothing to receive in practice until a send-trigger
// exists, but it's wired now so App.jsx doesn't need changes later.
export async function onForegroundPushMessage(callback) {
  const messaging = await getMessagingLazy()
  if (!messaging) return () => {}
  const { onMessage } = await import('firebase/messaging')
  return onMessage(messaging, callback)
}

// Best-effort: keeps the stored push_subscriptions doc's watchedTerms in
// sync whenever the local watch list changes (lib/watches.js). Silently
// no-ops if this device never enabled push — push is additive, never
// required for watches to work locally. Call after addWatch/removeWatch.
export async function syncWatchedTermsIfSubscribed() {
  const token = getStoredPushToken()
  if (!token) return
  try {
    const { doc, setDoc } = await import('firebase/firestore')
    await setDoc(
      doc(db, 'push_subscriptions', token),
      { watchedTerms: getWatchedTerms(), updatedAt: new Date().toISOString() },
      { merge: true }
    )
  } catch (err) {
    console.warn('Failed to sync push subscription (non-fatal):', err.message)
  }
}
