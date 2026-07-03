import { useEffect, useRef, useState } from 'react'
import { Image, Upload, X } from 'lucide-react'
import {
  BANNER_PAGES,
  CAROUSEL_BANNER_PAGES,
  subscribeSiteBannerImages,
  uploadSiteBannerImage,
  clearSiteBannerImage
} from '../lib/siteSettings.js'
import ConfirmDialog from './ConfirmDialog.jsx'

// The one place a real photo can end up on any page's banner (see
// index.css's --banner-image custom property, resolved per-page in
// App.jsx) — deliberately the only path, replacing the earlier
// approach of auto-pulling a listing's photo, which had no curation
// step for "suitable as a banner" specifically. Each page can have its
// own image, or fall back to "Default" for anything not set individually.
export default function AdminSiteBanner() {
  const [bannerImages, setBannerImages] = useState(undefined)
  const [pageKey, setPageKey] = useState('default')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  // null when closed; '' confirms clearing a single-image page; any
  // other string confirms removing just that one carousel image.
  const [confirmingClear, setConfirmingClear] = useState(null)
  // Bumped after every upload attempt (success or failure) and used as
  // part of the file input's `key` below, forcing React to throw away
  // the native <input> DOM node and mount a fresh one. Just resetting
  // `.value = ''` on the same node isn't reliable for a second
  // selection in every browser — a fresh node sidesteps that entirely.
  const [fileInputGeneration, setFileInputGeneration] = useState(0)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const unsubscribe = subscribeSiteBannerImages(setBannerImages)
    return unsubscribe
  }, [])

  const isCarousel = CAROUSEL_BANNER_PAGES.has(pageKey)
  const rawValue = bannerImages?.[pageKey]
  const currentUrl = isCarousel ? undefined : rawValue
  const currentImages = isCarousel ? (Array.isArray(rawValue) ? rawValue.filter(Boolean) : rawValue ? [rawValue] : []) : []
  const pageLabel = BANNER_PAGES.find((p) => p.key === pageKey)?.label

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setError('')
    setUploading(true)
    try {
      // Sequential, not Promise.all — carousel uploads read-modify-write
      // the same array field, so parallel uploads would race and drop
      // all but the last one.
      for (const file of files) {
        await uploadSiteBannerImage(pageKey, file)
      }
    } catch (err) {
      setError('Failed to upload: ' + err.message)
    } finally {
      setUploading(false)
      setFileInputGeneration((n) => n + 1)
    }
  }

  async function handleClear() {
    const url = confirmingClear || undefined
    setConfirmingClear(null)
    try {
      await clearSiteBannerImage(pageKey, url)
    } catch (err) {
      alert('Failed to remove: ' + err.message)
    }
  }

  return (
    <div className="form-card">
      <p style={{ margin: '0 0 4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Image size={16} /> Page banner images
      </p>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 16px' }}>
        Each page can have its own banner photo, shown behind a dark/coral scrim. Pages without
        their own image use "Default." Nothing is pulled automatically from listings or reports.
        This is the only way a photo can appear on any banner.
        {isCarousel && ' This page rotates through every image below as a carousel. Upload more than one to enable it.'}
      </p>

      <div className="field">
        <label htmlFor="banner-page">Page</label>
        <select id="banner-page" value={pageKey} onChange={(e) => setPageKey(e.target.value)}>
          {BANNER_PAGES.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
              {CAROUSEL_BANNER_PAGES.has(key) ? ' (carousel)' : ''}
            </option>
          ))}
        </select>
      </div>

      {bannerImages === undefined ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : isCarousel ? (
        currentImages.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
            {currentImages.map((url) => (
              <div key={url} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <img src={url} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                <button
                  className="chip"
                  onClick={() => setConfirmingClear(url)}
                  style={{ position: 'absolute', top: 6, right: 6, padding: '4px 8px' }}
                  title="Remove this image"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 16 }}>
            No images set for "{pageLabel}". Currently showing the plain gradient.
          </p>
        )
      ) : currentUrl ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 10 }}>
            <img src={currentUrl} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
          </div>
          <button className="chip" onClick={() => setConfirmingClear('')}>
            <X size={13} /> Remove this page's banner image
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 16 }}>
          No image set for "{pageLabel}". {pageKey !== 'default' && bannerImages?.default ? 'Currently showing the Default image.' : 'Currently showing the plain gradient.'}
        </p>
      )}

      {/* Keyed on both carousel-ness and an incrementing generation counter,
          so the native <input> is fully remounted (a) when switching
          between a carousel page and a single-image page, since `multiple`
          would otherwise flip on a live node, and (b) after every upload
          attempt, since resetting `.value = ''` on the same node isn't
          reliable for enabling a second selection in every browser — a
          fresh DOM node sidesteps both. */}
      <input
        key={`${isCarousel ? 'multi' : 'single'}-${fileInputGeneration}`}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={isCarousel}
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 8 }}>Uploading...</p>}
      {error && <p style={{ color: 'var(--status-disputed)', fontSize: 13, fontWeight: 600, marginTop: 8 }}>{error}</p>}
      <p className="field-hint" style={{ marginTop: 10 }}>
        <Upload size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
        Max 10MB{isCarousel ? ' per image' : ''}. Updates that page's banner immediately for everyone.
      </p>

      <ConfirmDialog
        open={confirmingClear !== null}
        title="Remove this banner image?"
        message={
          isCarousel && confirmingClear
            ? `This image will be removed from the "${pageLabel}" carousel immediately for everyone.`
            : `The banner image for "${pageLabel}" will be removed immediately for everyone.`
        }
        confirmLabel="Remove"
        onCancel={() => setConfirmingClear(null)}
        onConfirm={handleClear}
      />
    </div>
  )
}
