import { useEffect, useMemo, useState } from 'react'
import { ImageOff, Play } from 'lucide-react'
import { IMAGE_PLACEHOLDER } from '../lib/constants'
import { cn, optimizeImage } from '../lib/utils'

export function MediaGallery({ images = [], videoUrl, name = 'Dog' }) {
  const media = useMemo(() => {
    const items = (images || []).filter(Boolean).map((url) => ({ type: 'image', url }))
    if (videoUrl) items.push({ type: 'video', url: videoUrl })
    return items
  }, [images, videoUrl])

  const [activeIndex, setActiveIndex] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setActiveIndex(0)
    setImageFailed(false)
  }, [images, videoUrl])

  if (media.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-sand text-ink/30">
        <div className="text-center">
          <ImageOff className="mx-auto h-8 w-8" />
          <p className="mt-2 text-sm font-semibold">No photos available</p>
        </div>
      </div>
    )
  }

  const active = media[Math.min(activeIndex, media.length - 1)]

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-pine-950">
        {active.type === 'video' ? (
          <video
            key={active.url}
            src={active.url}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-contain"
          />
        ) : (
          <img
            key={active.url}
            src={
              imageFailed
                ? IMAGE_PLACEHOLDER
                : optimizeImage(active.url, 1400)
            }
            onError={() => setImageFailed(true)}
            alt={`${name} photo ${activeIndex + 1}`}
            className="h-full w-full object-cover"
          />
        )}
        {media.length > 1 ? (
          <span className="absolute bottom-4 right-4 rounded-full bg-ink/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
            {activeIndex + 1} / {media.length}
          </span>
        ) : null}
      </div>

      {media.length > 1 ? (
        <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {media.map((item, index) => (
            <button
              key={`${item.type}-${item.url}`}
              type="button"
              onClick={() => {
                setActiveIndex(index)
                setImageFailed(false)
              }}
              className={cn(
                'relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border-2 transition',
                activeIndex === index
                  ? 'border-pine-900'
                  : 'border-transparent opacity-65 hover:opacity-100',
              )}
              aria-label={`View ${item.type} ${index + 1}`}
            >
              {item.type === 'video' ? (
                <span className="flex h-full w-full items-center justify-center bg-pine-950 text-cream">
                  <Play className="h-5 w-5 fill-current" />
                </span>
              ) : (
                <img
                  src={optimizeImage(item.url, 160)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
