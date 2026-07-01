// Module-level singleton, matching this codebase's existing style for
// small cross-cutting concerns (watchlist.js, confirms.js) rather than
// introducing React Context — this app has never used Context, and a
// provider would be more ceremony than one toast stack needs. Any
// component can call showToast() directly with no prop drilling; the
// only subscriber is ToastStack.jsx.
let toasts = []
const listeners = new Set()

function notify() {
  listeners.forEach((fn) => fn(toasts))
}

export function subscribeToasts(callback) {
  listeners.add(callback)
  callback(toasts)
  return () => listeners.delete(callback)
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

export function showToast(message, tone = 'default', duration = 3000) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  toasts = [...toasts, { id, message, tone }]
  notify()
  setTimeout(() => dismissToast(id), duration)
  return id
}
