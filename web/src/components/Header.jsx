import { Search, FilePlus2, Bookmark, ShieldCheck, Map, ClipboardCheck, Home, Compass } from 'lucide-react'

const LISTING_VIEWS = ['listings', 'listing-detail', 'submit-listing', 'my-listings', 'lister-auth']

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
        <button className={view === 'diligence' ? 'active' : ''} onClick={() => setView('diligence')}>
          <ClipboardCheck size={15} />
          <span className="label">Check</span>
        </button>
        <button className={LISTING_VIEWS.includes(view) ? 'active' : ''} onClick={() => setView('listings')}>
          <Home size={15} />
          <span className="label">Listings</span>
        </button>
        <button className={view === 'market' ? 'active' : ''} onClick={() => setView('market')}>
          <Compass size={15} />
          <span className="label">Market</span>
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
