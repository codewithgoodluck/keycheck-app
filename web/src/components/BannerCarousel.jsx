import { useEffect, useState } from 'react'

// Rotating background for a carousel-capable page banner (see
// CAROUSEL_BANNER_PAGES in lib/siteSettings.js). Renders behind its
// parent's content as absolutely-positioned, crossfading layers — the
// parent (a .hero/.page-banner) must keep position:relative and get the
// `hero-carousel`/`page-banner-carousel` modifier class from index.css,
// which turns off that element's own --banner-image background so the
// two don't paint on top of each other. Caller is expected to only
// render this when it has at least one image; with zero it'd just be an
// empty, inert wrapper.
export default function BannerCarousel({ images, intervalMs = 6000 }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [images])

  useEffect(() => {
    if (images.length < 2) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [images, intervalMs])

  return (
    <div className="banner-carousel-bg" aria-hidden="true">
      {images.map((url, i) => (
        <div
          key={url}
          className={`banner-carousel-layer${i === index ? ' active' : ''}`}
          style={{ backgroundImage: `url("${url}")` }}
        />
      ))}
      <div className="banner-carousel-scrim" />
      {images.length > 1 && (
        <div className="banner-carousel-dots">
          {images.map((url, i) => (
            <button
              key={url}
              className={`banner-carousel-dot${i === index ? ' active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Show banner image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
