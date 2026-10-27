import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  PawPrint,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  formatDate,
  formatPrice,
  getErrorMessage,
  getInitials,
  optimizeImage,
} from '../lib/utils'
import { StatusBadge } from '../components/StatusBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import { Spinner, TableSkeleton } from '../components/Loading'
import { usePageTitle } from '../hooks/usePageTitle'

const TABS = [
  { value: 'all', label: 'All listings' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const QUICK_REASONS = [
  'Photos are unclear or missing.',
  'Listing details are incomplete.',
  'Please confirm the dog is still available.',
  'Price or location needs clarification.',
]

export function AdminDashboard() {
  usePageTitle('Admin dashboard')
  const { profile } = useAuth()
  const { addToast } = useToast()
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [reload, setReload] = useState(0)
  const [actionId, setActionId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    let active = true

    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }

    const loadDogs = async () => {
      setLoading(true)
      setError('')

      const { data, error: queryError } = await supabase
        .from('dogs')
        .select('*')
        .order('created_at', { ascending: false })

      if (!active) return

      if (queryError) {
        setError('We could not load listings. Check your admin access and try again.')
        setLoading(false)
        return
      }

      const sellerIds = [...new Set((data || []).map((dog) => dog.seller_id))]
      let sellerMap = {}

      if (sellerIds.length > 0) {
        const { data: sellers } = await supabase
          .from('profiles')
          .select('id,full_name,email,phone')
          .in('id', sellerIds)

        if (!active) return
        sellerMap = Object.fromEntries((sellers || []).map((seller) => [seller.id, seller]))
      }

      setDogs((data || []).map((dog) => ({ ...dog, seller: sellerMap[dog.seller_id] || null })))
      setLoading(false)
    }

    loadDogs()
    return () => {
      active = false
    }
  }, [reload])

  const counts = useMemo(
    () => ({
      all: dogs.length,
      pending: dogs.filter((dog) => dog.status === 'pending').length,
      approved: dogs.filter((dog) => dog.status === 'approved').length,
      rejected: dogs.filter((dog) => dog.status === 'rejected').length,
    }),
    [dogs],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return dogs.filter((dog) => {
      const statusMatch = tab === 'all' || dog.status === tab
      const text = [
        dog.name,
        dog.breed,
        dog.location,
        dog.seller?.full_name,
        dog.seller?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return statusMatch && (!term || text.includes(term))
    })
  }, [dogs, tab, search])

  const updateDog = async (dogId, updates, successTitle, successMessage) => {
    setActionId(dogId)
    try {
      const { error: updateError } = await supabase.from('dogs').update(updates).eq('id', dogId)
      if (updateError) throw updateError
      setDogs((current) =>
        current.map((dog) => (dog.id === dogId ? { ...dog, ...updates } : dog)),
      )
      addToast({ title: successTitle, message: successMessage })
      return true
    } catch (updateError) {
      addToast({
        title: 'Action failed',
        message: getErrorMessage(updateError),
        type: 'error',
      })
      return false
    } finally {
      setActionId(null)
    }
  }

  const approveDog = (dog) =>
    updateDog(
      dog.id,
      { status: 'approved', rejection_reason: null },
      'Listing approved',
      `${dog.name} is now visible to buyers.`,
    )

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    const success = await updateDog(
      rejectTarget.id,
      { status: 'rejected', rejection_reason: rejectReason.trim() },
      'Listing rejected',
      'The seller will see your note on their dashboard.',
    )
    if (success) {
      setRejectTarget(null)
      setRejectReason('')
    }
  }

  const toggleFeatured = (dog) =>
    updateDog(
      dog.id,
      { is_featured: !dog.is_featured },
      dog.is_featured ? 'Removed from featured' : 'Added to featured',
      dog.is_featured
        ? `${dog.name} will no longer be prioritised on the homepage.`
        : `${dog.name} will be prioritised on the homepage.`,
    )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionId(deleteTarget.id)
    try {
      const { error: deleteError } = await supabase
        .from('dogs')
        .delete()
        .eq('id', deleteTarget.id)
      if (deleteError) throw deleteError
      setDogs((current) => current.filter((dog) => dog.id !== deleteTarget.id))
      addToast({ title: 'Listing deleted', message: `${deleteTarget.name} was permanently removed.` })
      setDeleteTarget(null)
    } catch (deleteError) {
      addToast({
        title: 'Could not delete listing',
        message: getErrorMessage(deleteError),
        type: 'error',
      })
    } finally {
      setActionId(null)
    }
  }

  const renderActions = (dog, compact = false) => {
    const busy = actionId === dog.id
    const base = compact
      ? 'flex h-9 w-9 items-center justify-center rounded-full transition'
      : 'flex h-8 w-8 items-center justify-center rounded-full transition'

    return (
      <div className="flex items-center gap-1.5">
        {dog.status !== 'approved' ? (
          <button
            type="button"
            onClick={() => approveDog(dog)}
            disabled={busy}
            className={`${base} bg-pine-50 text-pine-700 hover:bg-pine-100 disabled:opacity-50`}
            title="Approve listing"
            aria-label={`Approve ${dog.name}`}
          >
            {busy ? <Spinner className="h-3.5 w-3.5" /> : <Check className="h-4 w-4" />}
          </button>
        ) : null}
        {dog.status !== 'rejected' ? (
          <button
            type="button"
            onClick={() => {
              setRejectTarget(dog)
              setRejectReason('')
            }}
            disabled={busy}
            className={`${base} bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50`}
            title="Reject listing"
            aria-label={`Reject ${dog.name}`}
          >
            <XCircle className="h-4 w-4" />
          </button>
        ) : null}
        {dog.status === 'approved' ? (
          <button
            type="button"
            onClick={() => toggleFeatured(dog)}
            disabled={busy}
            className={`${base} ${
              dog.is_featured
                ? 'bg-clay-100 text-clay-700 hover:bg-clay-200'
                : 'bg-sand text-ink/50 hover:bg-sand/70 hover:text-ink'
            } disabled:opacity-50`}
            title={dog.is_featured ? 'Remove from featured' : 'Feature listing'}
            aria-label={dog.is_featured ? 'Remove from featured' : 'Feature listing'}
          >
            <Star className={`h-4 w-4 ${dog.is_featured ? 'fill-current' : ''}`} />
          </button>
        ) : null}
        <Link
          to={`/admin/listings/${dog.id}/edit`}
          className={`${base} bg-sand text-ink/55 hover:bg-sand/70 hover:text-ink`}
          title="Edit listing"
          aria-label={`Edit ${dog.name}`}
        >
          <Edit3 className="h-4 w-4" />
        </Link>
        {dog.status === 'approved' ? (
          <Link
            to={`/dogs/${dog.id}`}
            className={`${base} bg-sand text-ink/55 hover:bg-sand/70 hover:text-ink`}
            title="View public page"
            aria-label={`View ${dog.name}`}
          >
            <Eye className="h-4 w-4" />
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => setDeleteTarget(dog)}
          disabled={busy}
          className={`${base} bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50`}
          title="Delete listing"
          aria-label={`Delete ${dog.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <>
      <section className="bg-pine-950 text-cream">
        <div className="container-page py-10 sm:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-clay-300">
                <ShieldCheck className="h-4 w-4" />
                Admin control
              </span>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                Listing moderation
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-cream/55">
                Review submissions, keep the marketplace accurate, and feature the best dogs.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-cream/10 bg-white/5 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-xs font-extrabold text-pine-950">
                {getInitials(profile?.full_name)}
              </span>
              <div>
                <p className="text-sm font-bold">{profile?.full_name}</p>
                <p className="text-[11px] text-cream/45">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-10">
        {counts.pending > 0 ? (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  {counts.pending} listing{counts.pending === 1 ? '' : 's'} waiting for review
                </p>
                <p className="mt-0.5 text-xs text-amber-800">
                  Approve accurate listings so buyers can discover them.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTab('pending')}
              className="btn btn-sm bg-amber-900 text-white hover:bg-amber-950"
            >
              Review now
            </button>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { key: 'all', label: 'All listings', icon: PawPrint, tone: 'bg-sand text-ink' },
            {
              key: 'pending',
              label: 'Pending review',
              icon: Clock3,
              tone: 'bg-amber-50 text-amber-700',
            },
            {
              key: 'approved',
              label: 'Live publicly',
              icon: CheckCircle2,
              tone: 'bg-pine-50 text-pine-700',
            },
            {
              key: 'rejected',
              label: 'Rejected',
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
                className={`rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
                  tab === stat.key ? 'border-pine-900/30 ring-1 ring-pine-900/10' : 'border-ink/10'
                }`}
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

        <div className="mt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-sand/70 p-1">
              {TABS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTab(item.value)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${
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

            <div className="flex gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-ink/10 bg-white px-3.5 py-2 lg:w-64">
                <Search className="h-4 w-4 shrink-0 text-ink/30" />
                <label htmlFor="admin-search" className="sr-only">
                  Search listings and sellers
                </label>
                <input
                  id="admin-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search dogs or sellers"
                  className="w-full bg-transparent text-xs outline-none placeholder:text-ink/35"
                />
              </div>
              <button
                type="button"
                onClick={() => setReload((value) => value + 1)}
                disabled={loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/50 transition hover:bg-sand hover:text-ink disabled:opacity-50"
                aria-label="Refresh listings"
                title="Refresh listings"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-3xl border border-ink/10 bg-white">
            {loading ? (
              <div className="p-4">
                <TableSkeleton rows={5} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title={search ? 'No matching listings' : 'Nothing here yet'}
                  description={
                    search
                      ? 'Try a different dog name, breed, or seller.'
                      : 'There are no listings in this category right now.'
                  }
                  action={
                    search ? (
                      <button type="button" onClick={() => setSearch('')} className="btn-outline">
                        Clear search
                      </button>
                    ) : null
                  }
                />
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] text-left">
                    <thead>
                      <tr className="border-b border-ink/5 bg-cream/50 text-[10px] font-extrabold uppercase tracking-wider text-ink/35">
                        <th className="px-5 py-3.5">Dog</th>
                        <th className="px-4 py-3.5">Seller</th>
                        <th className="px-4 py-3.5">Price</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5">Submitted</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((dog) => (
                        <tr
                          key={dog.id}
                          className="border-b border-ink/5 last:border-0 hover:bg-cream/35"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                                {dog.image_urls?.[0] ? (
                                  <img
                                    src={optimizeImage(dog.image_urls[0], 180)}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-ink/25">
                                    <PawPrint className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="max-w-[150px] truncate text-sm font-extrabold text-ink">
                                    {dog.name}
                                  </p>
                                  {dog.is_featured ? (
                                    <Star className="h-3 w-3 shrink-0 fill-clay-500 text-clay-500" />
                                  ) : null}
                                </div>
                                <p className="max-w-[150px] truncate text-[11px] text-ink/40">
                                  {dog.breed || 'Mixed breed'} · {dog.location || 'No location'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine-50 text-[9px] font-extrabold text-pine-700">
                                {getInitials(dog.seller?.full_name)}
                              </span>
                              <div className="min-w-0">
                                <p className="max-w-[130px] truncate text-xs font-bold text-ink/70">
                                  {dog.seller?.full_name || 'Unknown seller'}
                                </p>
                                <p className="max-w-[130px] truncate text-[10px] text-ink/35">
                                  {dog.seller?.phone || dog.seller?.email || 'No contact'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-bold text-pine-900">
                            {formatPrice(dog.price_rwf)}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={dog.status} />
                          </td>
                          <td className="px-4 py-3.5 text-[11px] text-ink/40">
                            {formatDate(dog.created_at)}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end">{renderActions(dog)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-ink/5 md:hidden">
                  {filtered.map((dog) => (
                    <div key={dog.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                          {dog.image_urls?.[0] ? (
                            <img
                              src={optimizeImage(dog.image_urls[0], 180)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-ink/25">
                              <PawPrint className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold">{dog.name}</p>
                              <p className="truncate text-[11px] text-ink/40">
                                {dog.breed || 'Mixed breed'}
                              </p>
                            </div>
                            <StatusBadge status={dog.status} />
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink/45">
                            <span className="font-bold text-pine-900">
                              {formatPrice(dog.price_rwf)}
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <UserRound className="h-3 w-3" />
                              <span className="max-w-[120px] truncate">
                                {dog.seller?.full_name || 'Seller'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {dog.status === 'rejected' && dog.rejection_reason ? (
                        <p className="mt-2.5 rounded-lg bg-red-50 px-2.5 py-2 text-[10px] leading-4 text-red-700">
                          <strong>Note:</strong> {dog.rejection_reason}
                        </p>
                      ) : null}

                      <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-3">
                        <span className="text-[10px] text-ink/35">{formatDate(dog.created_at)}</span>
                        {renderActions(dog, true)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => {
          if (!actionId) {
            setRejectTarget(null)
            setRejectReason('')
          }
        }}
        title={`Reject ${rejectTarget?.name || 'listing'}?`}
        description="The seller will see this note on their dashboard and can update the listing."
      >
        <div>
          <label htmlFor="rejection-reason" className="label">
            Reason for rejection
          </label>
          <textarea
            id="rejection-reason"
            rows={4}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Explain what needs to change..."
            className="input resize-y"
            maxLength={500}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setRejectReason(reason)}
                className="rounded-full border border-ink/10 bg-cream px-3 py-1.5 text-[10px] font-semibold text-ink/55 transition hover:border-pine-500 hover:text-ink"
              >
                {reason}
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setRejectTarget(null)
                setRejectReason('')
              }}
              disabled={Boolean(actionId)}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={!rejectReason.trim() || Boolean(actionId)}
              className="btn bg-amber-600 text-white hover:bg-amber-700"
            >
              {actionId === rejectTarget?.id ? <Spinner className="h-4 w-4" /> : null}
              Reject listing
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={actionId === deleteTarget?.id}
        title={`Delete ${deleteTarget?.name || 'listing'}?`}
        description="This permanently removes the listing from PawMarket. The seller's account will not be affected."
        confirmLabel="Delete listing"
      />
    </>
  )
}
