import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  HeartHandshake,
  Mail,
  MapPin,
  MessageCircle,
  PawPrint,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { HERO_IMAGE, SUPPORT_EMAIL, SUPPORT_PHONE } from '../lib/constants'
import { DogCard } from '../components/DogCard'
import { DogCardSkeleton } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { usePageTitle } from '../hooks/usePageTitle'

const FEATURED_FIELDS =
  'id,name,breed,age_years,gender,price_rwf,weight_kg,height_cm,location,image_urls,video_url,is_featured,created_at'

const steps = [
  {
    icon: Search,
    title: 'Browse reviewed dogs',
    text: 'Every public listing is checked by our team, so you can explore with confidence.',
  },
  {
    icon: MessageCircle,
    title: 'Meet the seller',
    text: 'Ask questions, request health records, and arrange a visit directly with the seller.',
  },
  {
    icon: HeartHandshake,
    title: 'Welcome them home',
    text: 'Meet the dog in person, agree on the details, and start your new life together.',
  },
]

export function Home() {
  usePageTitle()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }

    const loadFeatured = async () => {
      const { data, error: fetchError } = await supabase
        .from('dogs')
        .select(FEATURED_FIELDS)
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(4)

      if (!active) return
      if (fetchError) {
        setError('We could not load featured dogs right now. Please try again shortly.')
      } else {
        setDogs(data || [])
      }
      setLoading(false)
    }

    loadFeatured()
    return () => {
      active = false
    }
  }, [])

  const handleSearch = (event) => {
    event.preventDefault()
    const term = query.trim()
    navigate(term ? `/dogs?q=${encodeURIComponent(term)}` : '/dogs')
  }

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-clay-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-pine-100/60 blur-3xl" />

        <div className="container-page relative grid items-center gap-12 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="animate-fade-up">
            <span className="eyebrow">
              <PawPrint className="h-4 w-4" />
              Rwanda&apos;s dog marketplace
            </span>
            <h1 className="mt-5 max-w-2xl text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] text-ink sm:text-6xl lg:text-[72px]">
              Find your next
              <span className="relative ml-2 inline-block italic text-clay-600">
                best friend.
                <svg
                  viewBox="0 0 240 16"
                  className="absolute -bottom-2 left-0 w-full text-clay-300"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 11.5C53 3.5 140 2 237 8.5"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-[16px] leading-7 text-ink/60 sm:text-lg">
              Discover healthy, loved dogs from sellers across Rwanda. Browse real photos and
              videos, ask questions, and meet your match in person.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-ink/10 bg-white p-2 shadow-soft sm:rounded-full"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 pl-3">
                <Search className="h-5 w-5 shrink-0 text-ink/35" />
                <label htmlFor="hero-search" className="sr-only">
                  Search dogs by name or breed
                </label>
                <input
                  id="hero-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name or breed..."
                  className="w-full min-w-0 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink/35"
                />
              </div>
              <button type="submit" className="btn-primary shrink-0">
                <span className="hidden sm:inline">Search dogs</span>
                <Search className="h-4 w-4 sm:hidden" />
                <ArrowRight className="hidden h-4 w-4 sm:block" />
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink/40">
              <span className="font-semibold">Popular:</span>
              {['Boerboel', 'German Shepherd', 'Golden Retriever'].map((breed) => (
                <Link
                  key={breed}
                  to={`/dogs?q=${encodeURIComponent(breed)}`}
                  className="rounded-full border border-ink/10 bg-white/60 px-3 py-1.5 font-semibold text-ink/55 transition hover:border-pine-900/20 hover:text-ink"
                >
                  {breed}
                </Link>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs font-bold text-ink/45">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-pine-600" />
                Reviewed listings
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-pine-600" />
                Direct seller contact
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pine-600" />
                Free to browse
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[540px] animate-fade-up [animation-delay:120ms]">
            <div className="absolute -right-4 -top-5 h-28 w-28 rounded-full border-[18px] border-clay-200/60 sm:-right-8" />
            <div className="relative overflow-hidden rounded-[36px] bg-pine-950 shadow-soft sm:rounded-[48px]">
              <img
                src={HERO_IMAGE}
                alt="A happy dog looking up"
                className="aspect-[4/5] w-full object-cover sm:aspect-[5/5.4]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pine-950/55 via-transparent to-transparent" />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-cream/95 p-4 backdrop-blur sm:inset-x-6 sm:bottom-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine-950 text-cream">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-ink">Every listing, reviewed</p>
                    <p className="mt-0.5 text-xs text-ink/50">
                      We approve listings before they go public.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -left-3 top-8 rounded-2xl bg-white px-4 py-3 shadow-lift sm:-left-8">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink/35">
                Made for
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-ink">
                <MapPin className="h-3.5 w-3.5 text-clay-600" />
                Rwanda
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/5 bg-sand/55">
        <div className="container-page grid gap-6 py-7 sm:grid-cols-3">
          {[
            ['Approved before public', 'Our team reviews every listing for quality and safety.'],
            ['Photos & video tours', 'See the dog before you travel to meet them.'],
            ['Talk directly to sellers', 'No middlemen. Ask questions and arrange a visit.'],
          ].map(([title, text]) => (
            <div key={title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine-950 text-cream">
                <Check className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-ink">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-ink/50">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pt-20 sm:pt-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Ready to meet</span>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Featured dogs
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-ink/50">
              A handpicked selection of approved dogs waiting for a loving home.
            </p>
          </div>
          <Link
            to="/dogs"
            className="inline-flex items-center gap-2 text-sm font-bold text-pine-900 transition hover:gap-3"
          >
            View all dogs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <DogCardSkeleton key={index} />)
            : dogs.map((dog) => <DogCard key={dog.id} dog={dog} />)}
        </div>

        {!loading && dogs.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No approved dogs yet"
              description={
                isSupabaseConfigured
                  ? 'New listings are reviewed every day. Check back soon or explore all listings.'
                  : 'Connect Supabase and add your first approved listing to see dogs here.'
              }
              action={
                <Link to="/dogs" className="btn-primary">
                  Browse all dogs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
          </div>
        ) : null}
      </section>

      <section id="how-it-works" className="container-page scroll-mt-28 pt-24">
        <div className="rounded-[36px] bg-pine-950 px-6 py-12 text-cream sm:px-10 sm:py-16 lg:px-16">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-clay-300">
                <PawPrint className="h-4 w-4" />
                Simple by design
              </span>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Three steps to your new companion.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-cream/60">
                PawMarket makes finding a dog feel personal again. No endless messages or
                unverified listings — just genuine dogs and direct conversations.
              </p>
              <Link to="/dogs" className="btn-accent mt-8">
                Start browsing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-cream/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream text-pine-950">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold tracking-wider text-clay-300">
                          0{index + 1}
                        </span>
                        <h3 className="font-sans text-base font-extrabold">{step.title}</h3>
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-cream/55">{step.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="safety" className="container-page scroll-mt-28 pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="overflow-hidden rounded-[36px] bg-sand">
              <img
                src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80"
                alt="Two dogs running together outdoors"
                className="aspect-[5/4] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-6 left-4 right-4 rounded-2xl bg-white p-4 shadow-lift sm:left-8 sm:right-auto sm:w-72">
              <p className="flex items-center gap-2 text-sm font-extrabold text-ink">
                <ShieldCheck className="h-5 w-5 text-pine-700" />
                Trust is built in
              </p>
              <p className="mt-1.5 text-xs leading-5 text-ink/50">
                Only approved listings appear publicly. Sellers manage their own listings and
                admins review every submission.
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:pl-6">
            <span className="eyebrow">Buying with confidence</span>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              A safer way to find a dog online.
            </h2>
            <p className="mt-5 text-sm leading-7 text-ink/55">
              We keep the marketplace focused on real dogs and real people. Here is how we protect
              your experience.
            </p>
            <div className="mt-8 space-y-5">
              {[
                ['Human-reviewed listings', 'Every listing is approved before buyers can see it.'],
                ['Private account data', 'Row Level Security keeps seller data protected in Supabase.'],
                ['Direct, honest contact', 'Speak with the seller and meet the dog before paying.'],
                ['Safe media delivery', 'Photos and videos are securely stored and delivered by Cloudinary.'],
              ].map(([title, text]) => (
                <div key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine-50 text-pine-700">
                    <Check className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-ink">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-ink/50">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pt-24">
        <div className="grid overflow-hidden rounded-[36px] bg-clay-500 text-white lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 sm:p-12 lg:p-16">
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white/70">
              <Sparkles className="h-4 w-4" />
              For sellers
            </span>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Have a dog looking for a loving home?
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/75">
              Create a free seller account, upload photos and a video, and reach buyers across
              Rwanda. You stay in control of your listings and conversations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register?role=seller"
                className="btn bg-white text-clay-700 hover:bg-cream"
              >
                Become a seller
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="btn border border-white/30 text-white hover:bg-white/10"
              >
                Seller sign in
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1000&q=80"
              alt="A golden retriever"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-clay-500 via-clay-500/30 to-transparent" />
          </div>
        </div>
      </section>

      <section className="container-page pt-24">
        <div className="flex flex-col items-center rounded-[36px] border border-ink/10 bg-white px-6 py-12 text-center shadow-soft sm:px-12">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pine-50 text-pine-700">
            <MessageCircle className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions? We&apos;re here to help.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink/50">
            Whether you are buying or selling, our team can help you navigate PawMarket safely.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href={`tel:${SUPPORT_PHONE}`} className="btn-primary">
              <Phone className="h-4 w-4" />
              {SUPPORT_PHONE}
            </a>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="btn-outline">
              <Mail className="h-4 w-4" />
              Email support
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
