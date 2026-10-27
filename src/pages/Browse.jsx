import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  Filter,
  PawPrint,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { GENDERS, SORT_OPTIONS } from '../lib/constants'
import { cn, sanitizeSearch } from '../lib/utils'
import { DogCard } from '../components/DogCard'
import { DogCardSkeleton } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { Pagination } from '../components/Pagination'
import { usePageTitle } from '../hooks/usePageTitle'

const PAGE_SIZE = 9
const DOG_FIELDS =
  'id,name,breed,age_years,gender,price_rwf,weight_kg,height_cm,location,image_urls,video_url,is_featured,created_at'

function readFilters(params) {
  return {
    q: params.get('q') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    gender: params.get('gender') || '',
    sort: params.get('sort') || 'newest',
  }
}

function buildParams(filters) {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.minPrice !== '') params.set('minPrice', filters.minPrice)
  if (filters.maxPrice !== '') params.set('maxPrice', filters.maxPrice)
  if (filters.gender) params.set('gender', filters.gender)
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort)
  return params
}

export function Browse() {
  usePageTitle('Browse dogs')
  const [searchParams, setSearchParams] = useSearchParams()
  const [draft, setDraft] = useState(() => readFilters(searchParams))
  const [dogs, setDogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [retry, setRetry] = useState(0)

  const paramsKey = searchParams.toString()
  const active = readFilters(searchParams)
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filterCount = [active.minPrice, active.maxPrice, active.gender].filter(Boolean).length

  useEffect(() => {
    setDraft(readFilters(searchParams))
  }, [paramsKey])

  useEffect(() => {
    let mounted = true

    if (!isSupabaseConfigured) {
      setLoading(false)
      setDogs([])
      setTotal(0)
      return undefined
    }

    const loadDogs = async () => {
      setLoading(true)
      setError('')
      const filters = readFilters(searchParams)
      const term = sanitizeSearch(filters.q)

      let request = supabase
        .from('dogs')
        .select(DOG_FIELDS, { count: 'exact' })
        .eq('status', 'approved')

      if (term) request = request.or(`name.ilike.%${term}%,breed.ilike.%${term}%`)
      if (filters.minPrice !== '' && !Number.isNaN(Number(filters.minPrice))) {
        request = request.gte('price_rwf', Number(filters.minPrice))
      }
      if (filters.maxPrice !== '' && !Number.isNaN(Number(filters.maxPrice))) {
        request = request.lte('price_rwf', Number(filters.maxPrice))
      }
      if (filters.gender) request = request.eq('gender', filters.gender)

      if (filters.sort === 'price-asc') {
        request = request.order('price_rwf', { ascending: true })
      } else if (filters.sort === 'price-desc') {
        request = request.order('price_rwf', { ascending: false })
      } else if (filters.sort === 'name') {
        request = request.order('name', { ascending: true })
      } else {
        request = request.order('is_featured', { ascending: false }).order('created_at', {
          ascending: false,
        })
      }

      const from = (page - 1) * PAGE_SIZE
      const { data, count, error: queryError } = await request.range(from, from + PAGE_SIZE - 1)

      if (!mounted) return
      if (queryError) {
        setError('We could not load listings right now. Please try again.')
        setDogs([])
        setTotal(0)
      } else {
        setDogs(data || [])
        setTotal(count || 0)
      }
      setLoading(false)
    }

    loadDogs()
    return () => {
      mounted = false
    }
  }, [searchParams, page, retry])

  const applyFilters = (nextDraft) => {
    setSearchParams(buildParams(nextDraft))
    setShowFilters(false)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    applyFilters(draft)
  }

  const clearAll = () => {
    setDraft(readFilters(new URLSearchParams()))
    setSearchParams({})
  }

  const clearFilter = (key) => {
    const next = {
      q: active.q,
      minPrice: active.minPrice,
      maxPrice: active.maxPrice,
      gender: active.gender,
      sort: active.sort,
    }
    next[key] = ''
    setSearchParams(buildParams(next))
  }

  const changePage = (nextPage) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
    document.getElementById('dog-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const filterPanel = (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </h2>
        {filterCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-bold text-clay-600 hover:text-clay-700"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="text-xs font-extrabold uppercase tracking-wider text-ink/35">Price range</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="min-price" className="sr-only">
              Minimum price
            </label>
            <input
              id="min-price"
              type="number"
              min="0"
              step="1000"
              value={draft.minPrice}
              onChange={(event) =>
                setDraft((current) => ({ ...current, minPrice: event.target.value }))
              }
              placeholder="Min RWF"
              className="input px-3 py-2.5 text-xs"
            />
          </div>
          <div>
            <label htmlFor="max-price" className="sr-only">
              Maximum price
            </label>
            <input
              id="max-price"
              type="number"
              min="0"
              step="1000"
              value={draft.maxPrice}
              onChange={(event) =>
                setDraft((current) => ({ ...current, maxPrice: event.target.value }))
              }
              placeholder="Max RWF"
              className="input px-3 py-2.5 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-extrabold uppercase tracking-wider text-ink/35">Gender</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDraft((current) => ({ ...current, gender: '' }))}
            className={cn(
              'rounded-full border px-3.5 py-2 text-xs font-bold transition',
              draft.gender === ''
                ? 'border-pine-950 bg-pine-950 text-cream'
                : 'border-ink/10 bg-white text-ink/55 hover:border-pine-500',
            )}
          >
            Any
          </button>
          {GENDERS.map((gender) => (
            <button
              key={gender.value}
              type="button"
              onClick={() => setDraft((current) => ({ ...current, gender: gender.value }))}
              className={cn(
                'rounded-full border px-3.5 py-2 text-xs font-bold transition',
                draft.gender === gender.value
                  ? 'border-pine-950 bg-pine-950 text-cream'
                  : 'border-ink/10 bg-white text-ink/55 hover:border-pine-500',
              )}
            >
              {gender.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => applyFilters(draft)}
        className="btn-primary mt-6 w-full"
      >
        <Filter className="h-4 w-4" />
        Apply filters
      </button>
      <button
        type="button"
        onClick={clearAll}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full py-2 text-xs font-bold text-ink/45 transition hover:text-ink"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset filters
      </button>
    </div>
  )

  return (
    <>
      <section className="relative overflow-hidden bg-pine-950 text-cream">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[36px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-20 left-16 h-52 w-52 rounded-full bg-clay-500/15 blur-2xl" />
        <div className="container-page relative py-12 sm:py-16">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-clay-300">
            <PawPrint className="h-4 w-4" />
            Meet the pack
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Browse dogs</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-cream/55 sm:text-base">
            Search approved listings from sellers across Rwanda. Use filters to find the right
            age, price, and companion for your home.
          </p>
        </div>
      </section>

      <div className="container-page -mt-7">
        <form
          onSubmit={handleSearch}
          className="relative z-10 flex flex-col gap-2 rounded-2xl border border-ink/10 bg-white p-2.5 shadow-soft sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
            <Search className="h-5 w-5 shrink-0 text-ink/35" />
            <label htmlFor="browse-search" className="sr-only">
              Search by name or breed
            </label>
            <input
              id="browse-search"
              value={draft.q}
              onChange={(event) =>
                setDraft((current) => ({ ...current, q: event.target.value }))
              }
              placeholder="Search by name or breed..."
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-ink/35"
            />
            {draft.q ? (
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, q: '' }))}
                className="rounded-full p-1 text-ink/35 transition hover:text-ink"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((open) => !open)}
              className="btn-outline flex-1 sm:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {filterCount > 0 ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-clay-500 text-[10px] text-white">
                  {filterCount}
                </span>
              ) : null}
            </button>
            <button type="submit" className="btn-primary flex-1 sm:flex-none">
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </form>
      </div>

      <section className="container-page pt-10">
        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className={cn('lg:block', showFilters ? 'block' : 'hidden')}>
            <div className="sticky top-28">{filterPanel}</div>
          </aside>

          <div id="dog-results" className="scroll-mt-28 min-w-0">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink/55">
                  {loading ? 'Finding dogs...' : `${total} dog${total === 1 ? '' : 's'} found`}
                </p>
                {active.q ? (
                  <p className="mt-0.5 text-xs text-ink/40">
                    Results for &ldquo;{active.q}&rdquo;
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-xs font-bold text-ink/45">
                  Sort by
                </label>
                <select
                  id="sort"
                  value={active.sort}
                  onChange={(event) =>
                    applyFilters({ ...readFilters(searchParams), sort: event.target.value })
                  }
                  className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-bold text-ink outline-none focus:border-pine-600"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filterCount > 0 || active.q ? (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {active.q ? (
                  <button
                    type="button"
                    onClick={() => clearFilter('q')}
                    className="flex items-center gap-1.5 rounded-full bg-pine-50 px-3 py-1.5 text-xs font-bold text-pine-800 ring-1 ring-pine-200"
                  >
                    &ldquo;{active.q}&rdquo;
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
                {active.minPrice ? (
                  <button
                    type="button"
                    onClick={() => clearFilter('minPrice')}
                    className="flex items-center gap-1.5 rounded-full bg-clay-50 px-3 py-1.5 text-xs font-bold text-clay-700 ring-1 ring-clay-200"
                  >
                    Min RWF {Number(active.minPrice).toLocaleString()}
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
                {active.maxPrice ? (
                  <button
                    type="button"
                    onClick={() => clearFilter('maxPrice')}
                    className="flex items-center gap-1.5 rounded-full bg-clay-50 px-3 py-1.5 text-xs font-bold text-clay-700 ring-1 ring-clay-200"
                  >
                    Max RWF {Number(active.maxPrice).toLocaleString()}
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
                {active.gender ? (
                  <button
                    type="button"
                    onClick={() => clearFilter('gender')}
                    className="flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-xs font-bold capitalize text-ink/65 ring-1 ring-ink/10"
                  >
                    {active.gender}
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-bold text-ink/40 underline-offset-2 hover:text-ink hover:underline"
                >
                  Clear all
                </button>
              </div>
            ) : null}

            {error ? (
              <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => setRetry((value) => value + 1)}
                    className="mt-2 font-bold underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <DogCardSkeleton key={index} />
                ))}
              </div>
            ) : dogs.length > 0 ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {dogs.map((dog) => (
                    <DogCard key={dog.id} dog={dog} />
                  ))}
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={changePage} />
              </>
            ) : (
              <EmptyState
                title={isSupabaseConfigured ? 'No dogs match your search' : 'Connect Supabase to browse'}
                description={
                  isSupabaseConfigured
                    ? 'Try a different name or widen your price range. New dogs are added regularly.'
                    : 'Add your Supabase URL and anon key to .env, run the database schema, and approved listings will appear here.'
                }
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={clearAll} className="btn-primary">
                      <RotateCcw className="h-4 w-4" />
                      Clear filters
                    </button>
                    <Link to="/" className="btn-outline">
                      Back home
                    </Link>
                  </div>
                }
              />
            )}
          </div>
        </div>
      </section>
    </>
  )
}
