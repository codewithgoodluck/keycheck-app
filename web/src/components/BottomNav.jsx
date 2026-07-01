import { Search, FilePlus2, Bookmark, Map } from 'lucide-react'

// Mirrors Header.jsx's nav items, but this is a genuinely different
// layout (icon-over-label tab bar, not a horizontal pill) so it's a
// separate component rather than a responsive variant of Header. Always
// mounted alongside Header in App.jsx — visibility is CSS-only (see
// .bottom-nav's media query in index.css) to avoid a resize-triggered
// remount.
export default function BottomNav({ view, setView, savedCount }) {
  return (
    <nav className="bottom-nav">
      <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>
        <Search size={19} />
        <span>Search</span>
      </button>
      <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>
        <Map size={19} />
        <span>Map</span>
      </button>
      <button className={view === 'saved' ? 'active' : ''} onClick={() => setView('saved')}>
        <Bookmark size={19} />
        <span>Saved{savedCount > 0 ? ` (${savedCount})` : ''}</span>
      </button>
      <button className={view === 'submit' ? 'active' : ''} onClick={() => setView('submit')}>
        <FilePlus2 size={19} />
        <span>Report</span>
      </button>
    </nav>
  )
}
