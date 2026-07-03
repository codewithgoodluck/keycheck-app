import { AlertTriangle } from 'lucide-react'

// Replaces window.confirm() for destructive admin actions (delete
// report/reply/review, remove banner image). Native confirm()/alert()
// are unreliable in practice — browsers silently suppress them after a
// page triggers several in a row ("prevent this page from creating
// additional dialogs"), and some embedded/in-app browsers block them
// outright, both of which make a delete button look like it "does
// nothing" even though the click registered fine. An in-app dialog
// can't be silently swallowed that way.
export default function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <AlertTriangle size={22} />
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="chip" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="confirm-dialog-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
