import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Mail,
  PawPrint,
  Phone,
  PlusCircle,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { formatDate, formatPrice, getErrorMessage, optimizeImage } from '../lib/utils'
import { StatusBadge } from '../components/StatusBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { TableSkeleton } from '../components/Loading'
import { usePageTitle } from '../hooks/usePageTitle'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../lib/constants'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export function SellerDashboard() {
  usePageTitle('Seller dashboard')
  const { user, profile } = useAuth()
  const { addToast } = useToast()
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true

    if (!isSupabaseConfigured || !user) {
      setLoading(false)
      return undefined
    }

    const loadDogs = async () => {
      setLoading(true)
      setError('')
      const { data, error: queryError } = await supabase
        .from('dogs')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (!active) return
      if (queryError) {
        setError('We could not load your listings. Please refresh and try again.')
      } else {
        setDogs(data || [])
      }
      setLoading(false)
    }

    loadDogs()
    return () => {
      active = false
    }
  }, [user])

  const counts = useMemo(
    () => ({
      all: dogs.length,
      pending: dogs.filter((dog) => dog.status === 'pending').length,
      approved: dogs.filter((dog) => dog.status === 'approved').length,
      rejected: dogs.filter((dog) => dog.status === 'rejected').length,
    }),
    [dogs],
  )

  const filtered = tab === 'all' ? dogs : dogs.filter((dog) => dog.status === tab)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase
        .from('dogs')
        .delete()
        .eq('id', deleteTarget.id)
        .eq('seller_id', user.id)

      if (deleteError) throw deleteError
      setDogs((current) => current.filter((dog) => dog.id !== deleteTarget.id))
      addToast({ title: 'Listing deleted', message: `${deleteTarget.name} was removed.` })
      setDeleteTarget(null)
    } catch (deleteError) {
      addToast({
        title: 'Could not delete listing',
        message: getErrorMessage(deleteError),
        type: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  const firstName = (profile?.full_name || 'Seller').split(' ')[0]

  return (
    <>
      <section className="bg-pine-950 text-cream">
        <div className="container-page py-10 sm:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-clay-300">
                <PawPrint className="h-4 w-4" />
                Seller dashboard
              </span>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                Hello, {firstName}.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-cream/55">
                Manage your dogs, keep their details fresh, and follow each listing through review.
              </p>
            </div>
            <Link to="/dashboard/listings/new" className="btn-accent shrink-0">
              <PlusCircle className="h-4 w-4" />
              List a new dog
            </Link>
          </div>
        </div>
      </section>

      <div className="container-page py-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { key: 'all', label: 'Total listings', icon: PawPrint, tone: 'bg-sand text-ink' },
            {
              key: 'pending',
              label: 'Pending review',
              icon: Clock3,
              tone: 'bg-amber-50 text-amber-700',
            },
            {
              key: 'approved',
              label: 'Approved',
              icon: CheckCircle2,
              tone: 'bg-pine-50 text-pine-700',
            },
            {
              key: 'rejected',
              label: 'Needs changes',
              icon: XCircle,
              tone: 'bg-red-50 text-red-700',
            },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <button
                key={stat.key}
                type="button"
                onClick={() => setTab(stat.key)}
                className="rounded-2xl border border-ink/10 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-3xl font-extrabold tracking-tight">
                  {loading ? '—' : counts[stat.key]}
                </p>
                <p className="mt-1 text-xs font-semibold text-ink/45">{stat.label}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-semibold">Your listings</h2>
              <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-sand/70 p-1">
                {TABS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTab(item.value)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      tab === item.value
                        ? 'bg-white text-ink shadow-sm'
                        : 'text-ink/45 hover:text-ink'
                    }`}
                  >
                    {item.label}
                    <span className="ml-1.5 text-[10px] opacity-50">{counts[item.value]}</span>
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <div className="mt-5">
              {loading ? (
                <TableSkeleton rows={4} />
              ) : filtered.length === 0 ? (
                <EmptyState
                  title={
                    dogs.length === 0
                      ? 'You have not listed a dog yet'
                      : `No ${tab === 'all' ? '' : tab} listings`
                  }
                  description={
                    dogs.length === 0
                      ? 'Create your first listing with clear photos, honest details, and a video tour if you have one.'
                      : 'Try another tab to see the rest of your listings.'
                  }
                  action={
                    dogs.length === 0 ? (
                      <Link to="/dashboard/listings/new" className="btn-primary">
                        <PlusCircle className="h-4 w-4" />
                        Create a listing
                      </Link>
                    ) : null
                  }
                />
              ) : (
                <div className="space-y-3">
                  {filtered.map((dog) => (
                    <div
                      key={dog.id}
                      className="rounded-2xl border border-ink/10 bg-white p-3.5 transition hover:border-ink/20 sm:p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3.5">
                          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                            {dog.image_urls?.[0] ? (
                              <img
                                src={optimizeImage(dog.image_urls[0], 240)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-ink/25">
                                <PawPrint className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-extrabold text-ink">{dog.name}</p>
                            <p className="truncate text-xs text-ink/45">
                              {dog.breed || 'Mixed breed'} · {dog.location || 'Location not set'}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <StatusBadge status={dog.status} />
                              <span className="text-xs font-bold text-pine-900">
                                {formatPrice(dog.price_rwf)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-ink/5 pt-3 sm:border-0 sm:pt-0">
                          <p className="text-[11px] text-ink/35">
                            Added {formatDate(dog.created_at)}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {dog.status === 'approved' ? (
                              <Link
                                to={`/dogs/${dog.id}`}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-pine-50 text-pine-700 transition hover:bg-pine-100"
                                aria-label={`View ${dog.name}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            ) : null}
                            <Link
                              to={`/dashboard/listings/${dog.id}/edit`}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-sand text-ink/60 transition hover:bg-sand/70 hover:text-ink"
                              aria-label={`Edit ${dog.name}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(dog)}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                              aria-label={`Delete ${dog.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {dog.status === 'rejected' && dog.rejection_reason ? (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            <strong>Admin note:</strong> {dog.rejection_reason}
                          </span>
                        </div>
                      ) : null}

                      {dog.status === 'pending' ? (
                        <p className="mt-3 text-[11px] text-ink/35">
                          This listing is waiting for admin review. Only approved listings are
                          public.
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <h3 className="text-lg font-semibold">Seller profile</h3>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pine-100 text-sm font-extrabold text-pine-800">
                  {(profile?.full_name || 'S').slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{profile?.full_name}</p>
                  <p className="text-xs capitalize text-ink/40">{profile?.role}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5 text-xs text-ink/55">
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-ink/30" />
                  <span className="truncate">{profile?.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-ink/30" />
                  {profile?.phone || 'Add a phone number via support'}
                </p>
              </div>
              <p className="mt-4 rounded-xl bg-cream p-3 text-[11px] leading-5 text-ink/45">
                Your contact details are only shared with buyers when they request seller contact.
              </p>
            </div>

            <div className="rounded-3xl bg-sand p-5">
              <h3 className="font-sans text-sm font-extrabold text-ink">Tips for faster approval</h3>
              <ul className="mt-3 space-y-2.5 text-xs leading-5 text-ink/55">
                <li>Use clear, recent photos of the actual dog.</li>
                <li>Describe health, temperament, and vaccinations honestly.</li>
                <li>Set a realistic price and accurate location.</li>
                <li>Respond to buyer enquiries promptly.</li>
              </ul>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-extrabold">Need help?</h3>
              <p className="mt-1.5 text-xs leading-5 text-ink/45">
                Our team can help with your listing or account.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <a href={`tel:${SUPPORT_PHONE}`} className="btn-outline btn-sm">
                  <Phone className="h-3.5 w-3.5" />
                  {SUPPORT_PHONE}
                </a>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="btn-outline btn-sm">
                  <Mail className="h-3.5 w-3.5" />
                  Email support
                </a>
              </div>
            </div>

            <Link
              to="/dogs"
              className="flex items-center justify-between rounded-2xl bg-pine-950 p-4 text-cream transition hover:bg-pine-900"
            >
              <span className="text-sm font-bold">Browse the marketplace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete ${deleteTarget?.name || 'listing'}?`}
        description="This permanently removes the listing, photos, and video reference. This action cannot be undone."
        confirmLabel="Delete listing"
      />
    </>
  )
}
