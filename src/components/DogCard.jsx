import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Dog, MapPin, Play } from 'lucide-react'
import { IMAGE_PLACEHOLDER } from '../lib/constants'
import { cn, formatAge, formatPrice, optimizeImage } from '../lib/utils'

export function DogCard({ dog, className }) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = imageFailed ? IMAGE_PLACEHOLDER : optimizeImage(dog.image_urls?.[0], 900)

  return (
    <Link
      to={`/dogs/${dog.id}`}
      className={cn(
        'group block overflow-hidden rounded-3xl border border-ink/10 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lift',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        <img
          src={image}
          alt={`${dog.name}, ${dog.breed || 'dog'}`}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {dog.is_featured ? (
            <span className="rounded-full bg-cream/95 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-pine-900 shadow-sm backdrop-blur">
              Featured
            </span>
          ) : (
            <span />
          )}
          {dog.video_url ? (
            <span className="flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
              <Play className="h-3 w-3 fill-current" />
              Video
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/55 to-transparent" />
        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-ink shadow-sm backdrop-blur">
          <Dog className="h-3.5 w-3.5 text-clay-600" />
          <span className="capitalize">{dog.gender || 'Dog'}</span>
          <span className="text-ink/30">·</span>
          {formatAge(dog.age_years)}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-semibold text-ink">{dog.name}</h3>
            <p className="mt-0.5 truncate text-sm text-ink/50">{dog.breed || 'Mixed breed'}</p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine-50 text-pine-800 transition group-hover:bg-pine-950 group-hover:text-cream">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-ink/5 pt-4">
          <p className="text-base font-extrabold text-pine-900">{formatPrice(dog.price_rwf)}</p>
          {dog.location ? (
            <p className="flex min-w-0 items-center gap-1 text-xs text-ink/45">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{dog.location}</span>
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
