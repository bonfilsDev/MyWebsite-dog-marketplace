import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Info, PawPrint } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getErrorMessage } from '../lib/utils'
import { DogForm } from '../components/DogForm'
import { EmptyState } from '../components/EmptyState'
import { PageLoader } from '../components/Loading'
import { usePageTitle } from '../hooks/usePageTitle'

export function ListingFormPage({ adminMode = false }) {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  usePageTitle(isEdit ? 'Edit listing' : 'Create a listing')
  const [initialData, setInitialData] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let active = true

    if (!isEdit) {
      setLoading(false)
      return undefined
    }

    if (!isSupabaseConfigured) {
      setLoadError('Supabase is not connected. Add your credentials to manage listings.')
      setLoading(false)
      return undefined
    }

    const loadListing = async () => {
      const { data, error } = await supabase.from('dogs').select('*').eq('id', id).maybeSingle()
      if (!active) return

      if (error) {
        setLoadError('We could not load this listing. Please try again.')
      } else if (!data) {
        setLoadError('This listing could not be found, or you do not have permission to edit it.')
      } else if (data.seller_id !== user?.id && !isAdmin) {
        setLoadError('You can only edit your own listings.')
      } else {
        setInitialData(data)
      }
      setLoading(false)
    }

    loadListing()
    return () => {
      active = false
    }
  }, [id, isEdit, user, isAdmin])

  const handleSubmit = async (payload) => {
    setSubmitError('')
    setBusy(true)

    try {
      if (!user) throw new Error('You must be signed in to save a listing.')

      if (isEdit) {
        const { error } = await supabase.from('dogs').update(payload).eq('id', id)
        if (error) throw error
        addToast({
          title: 'Listing updated',
          message: adminMode
            ? 'The changes are now live.'
            : 'Your changes were saved and the listing was sent back for review.',
        })
        navigate(adminMode ? '/admin' : '/dashboard')
      } else {
        const { error } = await supabase.from('dogs').insert({
          ...payload,
          seller_id: user.id,
          status: 'pending',
        })
        if (error) throw error
        addToast({
          title: 'Listing submitted',
          message: 'Our team will review it before it appears publicly.',
        })
        navigate('/dashboard')
      }
    } catch (error) {
      const message = getErrorMessage(error)
      setSubmitError(
        message.toLowerCase().includes('row-level security')
          ? 'You do not have permission to make this change. Make sure your seller account is active.'
          : message,
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <PageLoader label="Loading listing" />
  }

  if (isEdit && loadError) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={AlertCircle}
          title="Listing unavailable"
          description={loadError}
          action={
            <Link to={adminMode ? '/admin' : '/dashboard'} className="btn-primary">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <>
      <section className="border-b border-ink/5 bg-sand/60">
        <div className="container-page py-9">
          <Link
            to={adminMode ? '/admin' : '/dashboard'}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/45 transition hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {adminMode ? 'Back to admin dashboard' : 'Back to dashboard'}
          </Link>
          <div className="mt-4 flex items-start gap-3">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine-950 text-cream">
              <PawPrint className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {isEdit ? `Edit ${initialData?.name || 'listing'}` : 'List a dog for sale'}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink/50">
                {isEdit
                  ? 'Update the details below. Seller edits are re-reviewed before the listing becomes public again.'
                  : 'Tell buyers what makes this dog special. Complete, honest listings are approved faster.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-10">
        <div className="mx-auto max-w-3xl">
          {submitError ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {submitError}
            </div>
          ) : null}

          {!isEdit ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-pine-50 p-4 text-sm text-pine-800 ring-1 ring-pine-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                New listings start as <strong>pending</strong>. An admin will review the details
                and media before it appears in search.
              </p>
            </div>
          ) : null}

          {isAdmin && !adminMode ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              You are signed in as an admin. Seller edits still require admin approval.
            </div>
          ) : null}

          <DogForm
            key={id || 'new'}
            initialData={initialData}
            onSubmit={handleSubmit}
            busy={busy}
            submitLabel={isEdit ? 'Save changes' : 'Submit for review'}
            cancelTo={adminMode ? '/admin' : '/dashboard'}
            isAdmin={adminMode}
          />
        </div>
      </div>
    </>
  )
}
