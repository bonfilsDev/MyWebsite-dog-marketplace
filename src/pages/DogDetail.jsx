import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Dog,
  Edit3,
  Mail,
  MapPin,
  MessageCircle,
  PawPrint,
  Phone,
  Ruler,
  Scale,
  ShieldCheck,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatAge, formatPrice, getInitials, optimizeImage } from '../lib/utils'
import { usePageTitle } from '../hooks/usePageTitle'
import { MediaGallery } from '../components/MediaGallery'
import { ContactSellerModal } from '../components/ContactSellerModal'
import { DogCard } from '../components/DogCard'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../lib/constants'

const RELATED_FIELDS =
  'id,name,breed,age_years,gender,price_rwf,weight_kg,height_cm,location,image_urls,video_url,is_featured,created_at'

export function DogDetail() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const [dog, setDog] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contactOpen, setContactOpen] = useState(false)

  usePageTitle(dog?.name || 'Dog details')

  useEffect(() => {
    let active = true

    if (!isSupabaseConfigured) {
      setLoading(false)
      setError('Supabase is not connected. Add your credentials to view dog details.')
      return undefined
    }

    const loadDog = async () => {
      setLoading(true)
      setError('')
      setDog(null)

      const { data, error: queryError } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (!active) return

      if (queryError) {
        setError('We could not load this dog right now. Please try again.')
        setLoading(false)
        return
      }

      if (!data) {
        setLoading(false)
        return
      }

      setDog(data)
      setLoading(false)

      const { data: relatedData } = await supabase
        .from('dogs')
        .select(RELATED_FIELDS)
        .eq('status', 'approved')
        .neq('id', data.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (active) setRelated(relatedData || [])
    }

    loadDog()
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="container-page py-10">
        <div className="skeleton h-4 w-48" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="skeleton aspect-[4/3] rounded-3xl" />
            <div className="mt-6 space-y-3">
              <div className="skeleton h-7 w-2/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-5/6" />
              <div className="skeleton h-4 w-4/6" />
            </div>
          </div>
          <div className="skeleton h-[420px] rounded-3xl" />
        </div>
      </div>
    )
  }

  if (error || !dog) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={AlertTriangle}
          title={error ? 'Could not load this listing' : 'This dog is not available'}
          description={
            error ||
            'The listing may have been removed, rejected, or is still waiting for approval. Only approved listings are public.'
          }
          action={
            <Link to="/dogs" className="btn-primary">
              <ArrowLeft className="h-4 w-4" />
              Browse dogs
            </Link>
          }
        />
      </div>
    )
  }

  const isOwner = user?.id === dog.seller_id
  const canManage = isOwner || isAdmin
  const isPublic = dog.status === 'approved'

  const facts = [
    { icon: CalendarDays, label: 'Age', value: formatAge(dog.age_years) },
    { icon: Dog, label: 'Gender', value: dog.gender ? dog.gender[0].toUpperCase() + dog.gender.slice(1) : '—' },
    { icon: Scale, label: 'Weight', value: dog.weight_kg ? `${dog.weight_kg} kg` : '—' },
    { icon: Ruler, label: 'Height', value: dog.height_cm ? `${dog.height_cm} cm` : '—' },
  ]

  return (
    <>
      <div className="container-page py-8 sm:py-10">
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-ink/40">
          <Link to="/" className="transition hover:text-ink">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/dogs" className="transition hover:text-ink">
            Dogs
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-ink/65">{dog.name}</span>
        </nav>

        {!isPublic ? (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-amber-900">Listing preview — not public</p>
                  <StatusBadge status={dog.status} />
                </div>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Only approved listings appear in search and on your public profile.
                  {dog.rejection_reason ? ` Admin note: ${dog.rejection_reason}` : ''}
                </p>
              </div>
            </div>
            {canManage ? (
              <Link
                to={isAdmin ? `/admin/listings/${dog.id}/edit` : `/dashboard/listings/${dog.id}/edit`}
                className="btn-outline btn-sm shrink-0 bg-white"
              >
                <Edit3 className="h-4 w-4" />
                Edit listing
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="min-w-0">
            <MediaGallery
              images={dog.image_urls || []}
              videoUrl={dog.video_url}
              name={dog.name}
            />

            <div className="mt-8">
              <h2 className="text-3xl font-semibold tracking-tight">About {dog.name}</h2>
              <div className="mt-4 flex items-start gap-3">
                <PawPrint className="mt-1 h-5 w-5 shrink-0 text-clay-500" />
                <p className="prose-description">{dog.description}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 rounded-3xl border border-ink/10 bg-white p-5 sm:grid-cols-2 sm:p-6">
              {facts.map((fact) => {
                const Icon = fact.icon
                return (
                  <div key={fact.label} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine-50 text-pine-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink/35">
                        {fact.label}
                      </p>
                      <p className="text-sm font-bold text-ink">{fact.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 rounded-3xl bg-sand/70 p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-pine-700" />
                <h2 className="text-xl font-semibold">Meet safely</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  'Visit the dog in person before paying.',
                  'Ask for vaccination and health records.',
                  'Bring someone with you to the meeting.',
                  'Never send a full payment in advance.',
                ].map((tip) => (
                  <div key={tip} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-pine-700">
                      <Check className="h-3 w-3" />
                    </span>
                    <p className="text-xs leading-5 text-ink/60">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28">
            <div className="card overflow-hidden">
              <div className="border-b border-ink/5 p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-pine-50 px-3 py-1 text-[11px] font-bold text-pine-700">
                    {dog.breed || 'Mixed breed'}
                  </span>
                  {dog.is_featured && isPublic ? (
                    <span className="rounded-full bg-clay-50 px-3 py-1 text-[11px] font-bold text-clay-700">
                      Featured
                    </span>
                  ) : null}
                  {!isPublic ? <StatusBadge status={dog.status} /> : null}
                </div>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                  {dog.name}
                </h1>
                {dog.location ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/50">
                    <MapPin className="h-4 w-4" />
                    {dog.location}
                  </p>
                ) : null}
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink/35">
                      Price
                    </p>
                    <p className="mt-1 text-3xl font-extrabold tracking-tight text-pine-900">
                      {formatPrice(dog.price_rwf)}
                    </p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand">
                    <PawPrint className="h-5 w-5 text-clay-600" />
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-7">
                <div className="flex items-center gap-3 rounded-2xl bg-cream p-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine-950 text-xs font-extrabold text-cream">
                    {isOwner ? getInitials(user?.user_metadata?.full_name || 'You') : 'PM'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">
                      {isOwner ? 'Your listing' : 'Listed by a PawMarket seller'}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-pine-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Contact details protected
                    </p>
                  </div>
                </div>

                {isPublic ? (
                  <button
                    type="button"
                    onClick={() => setContactOpen(true)}
                    className="btn-primary mt-4 w-full"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contact seller
                  </button>
                ) : canManage ? (
                  <Link
                    to={isAdmin ? `/admin/listings/${dog.id}/edit` : `/dashboard/listings/${dog.id}/edit`}
                    className="btn-primary mt-4 w-full"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit this listing
                  </Link>
                ) : null}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a href={`tel:${SUPPORT_PHONE}`} className="btn-outline btn-sm">
                    <Phone className="h-3.5 w-3.5" />
                    Support
                  </a>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="btn-outline btn-sm">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                </div>

                <p className="mt-4 text-center text-[11px] leading-5 text-ink/35">
                  PawMarket never asks you to pay before meeting the dog. Report suspicious
                  listings to our team.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/60 p-4 text-xs text-ink/50">
              <ShieldCheck className="h-5 w-5 shrink-0 text-pine-700" />
              This listing was reviewed and approved by the PawMarket team.
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="container-page border-t border-ink/5 pt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Keep exploring</span>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">More dogs to meet</h2>
            </div>
            <Link
              to="/dogs"
              className="hidden items-center gap-1 text-sm font-bold text-pine-900 sm:flex"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <DogCard key={item.id} dog={item} />
            ))}
          </div>
        </section>
      ) : null}

      <ContactSellerModal open={contactOpen} onClose={() => setContactOpen(false)} dog={dog} />
    </>
  )
}
