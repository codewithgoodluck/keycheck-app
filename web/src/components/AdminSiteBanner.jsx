import { useEffect, useRef, useState } from 'react'
import { Image, Upload, X } from 'lucide-react'
import { subscribeSiteBannerUrl, uploadSiteBannerImage, clearSiteBannerImage } from '../lib/siteSettings.js'

// The one place a real photo can end up on every page's banner (see
// index.css's --banner-image custom property, set from this value in
// App.jsx) — deliberately the only path, replacing the earlier
// approach of auto-pulling a listing's photo, which had no curation
// step for "suitable as the whole site's banner" specifically.
export default function AdminSiteBanner() {
  const [bannerUrl, setBannerUrl] = useState(undefined)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const unsubscribe = subscribeSiteBannerUrl(setBannerUrl)
    return unsubscribe
  }, [])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      await uploadSiteBannerImage(file)
    } catch (err) {
      setError('Failed to upload: ' + err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleClear() {
    if (!confirm('Remove the site banner image? Every page falls back to the plain gradient.')) return
    try {
      await clearSiteBannerImage()
    } catch (err) {
      alert('Failed to remove: ' + err.message)
    }
  }

  return (
    <div className="form-card">
      <p style={{ margin: '0 0 4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Image size={16} /> Site banner image
      </p>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 16px' }}>
        Shown behind a dark scrim on every page's banner across the whole site. Choose something
        that still reads clearly with white/dark text over it — this is the only way a photo can
        appear there; nothing is pulled automatically from listings or reports.
      </p>

      {bannerUrl === undefined ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : bannerUrl ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 10 }}>
            <img src={bannerUrl} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
          </div>
          <button className="chip" onClick={handleClear}>
            <X size={13} /> Remove banner image
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 16 }}>
          No banner image set — every page currently shows the plain gradient.
        </p>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 8 }}>Uploading...</p>}
      {error && <p style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, marginTop: 8 }}>{error}</p>}
      <p className="field-hint" style={{ marginTop: 10 }}>
        <Upload size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
        Max 10MB. Replacing the image updates it everywhere immediately.
      </p>
    </div>
  )
}
