import { Search, FilePlus2, Bookmark, ShieldCheck, Map } from 'lucide-react'

export default function Header({ view, setView, savedCount }) {
  return (
    <header className="site-header">
      <div className="wordmark">
        <span className="mark">
          <ShieldCheck size={16} />
        </span>
        KeyCheck
      </div>
      <nav>
        <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>
          <Search size={15} />
          <span className="label">Search</span>
        </button>
        <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>
          <Map size={15} />
          <span className="label">Map</span>
        </button>
        <button className={view === 'saved' ? 'active' : ''} onClick={() => setView('saved')}>
          <Bookmark size={15} />
          <span className="label">Saved{savedCount > 0 ? ` (${savedCount})` : ''}</span>
        </button>
        <button className={view === 'submit' ? 'active' : ''} onClick={() => setView('submit')}>
          <FilePlus2 size={15} />
          <span className="label">Report</span>
        </button>
      </nav>
    </header>
  )
}
