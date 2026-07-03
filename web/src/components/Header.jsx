import { Search, Bookmark, ShieldCheck, Map, ClipboardCheck, Home } from 'lucide-react'

const LISTING_VIEWS = ['listings', 'listing-detail', 'submit-listing', 'my-listings', 'lister-auth']

// Market and the Report tab were removed from primary nav — Market has
// no other entry point right now (deep-link only), and Report is
// covered by FloatingReportButton.jsx, which stays visible on every
// page except the submit form itself; keeping both a nav tab and a
// floating button for the same action was redundant.
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
        <button className={view === 'saved' ? 'active' : ''} onClick={() => setView('saved')}>
          <Bookmark size={15} />
          <span className="label">Saved{savedCount > 0 ? ` (${savedCount})` : ''}</span>
        </button>
      </nav>
    </header>
  )
}
