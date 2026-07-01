import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { subscribeToasts, dismissToast } from '../lib/toast.js'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  default: Info
}

export default function ToastStack() {
  const [toasts, setToasts] = useState([])

  useEffect(() => subscribeToasts(setToasts), [])

  if (toasts.length === 0) return null

  return (
    <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map(({ id, message, tone }) => {
        const Icon = ICONS[tone] || ICONS.default
        return (
          <div key={id} className={`toast toast-${tone}`}>
            <Icon size={16} />
            <span>{message}</span>
            <button onClick={() => dismissToast(id)} aria-label="Dismiss">
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
