import { FilePlus2 } from 'lucide-react'

export default function FloatingReportButton({ onClick }) {
  return (
    <button className="fab" onClick={onClick}>
      <FilePlus2 />
      <span className="label">Report a problem</span>
    </button>
  )
}
