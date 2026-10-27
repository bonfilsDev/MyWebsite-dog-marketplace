import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { safeRedirect } from '../lib/utils'
import { SUPPORT_EMAIL } from '../lib/constants'
import { usePageTitle } from '../hooks/usePageTitle'
import { Logo } from '../components/Logo'
import { Spinner } from '../components/Loading'

export function Login() {
  usePageTitle('Sign in')
  const { user, loading, isAdmin, isSeller, signIn } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from
    ? safeRedirect(location.state.from, '')
    : ''

  if (!loading && user) {
    const destination = from || (isAdmin ? '/admin' : isSeller ? '/dashboard' : '/')
    return <Navigate to={destination} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.')
      return
    }

    setBusy(true)
    try {
      await signIn(email.trim(), password)
      addToast({ title: 'Welcome back', message: 'You are signed in.' })
      navigate(from || '/', { replace: true })
    } catch (submitError) {
      setError(
        submitError.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : submitError.message,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-page py-12 sm:py-20">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[36px] border border-ink/10 bg-white shadow-soft lg:grid-cols-2">
        <div className="p-6 sm:p-10 lg:p-14">
          <Logo />
          <div className="mt-10">
            <span className="eyebrow">Welcome back</span>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Sign in to your account.
            </h1>
            <p className="mt-4 text-sm leading-6 text-ink/50">
              Manage your listings, review enquiries, or continue your search for a new companion.
            </p>
          </div>

          {!isSupabaseConfigured ? (
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-xs leading-5 text-amber-900 ring-1 ring-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Authentication is unavailable until Supabase credentials are added to your .env file.
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-red-50 p-3.5 text-sm text-red-700 ring-1 ring-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="label">
                  Password
                </label>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Password%20help%20for%20PawMarket`}
                  className="mb-2 text-xs font-bold text-pine-700 hover:text-pine-900"
                >
                  Need help?
                </a>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  className="input pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/35 transition hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !isSupabaseConfigured}
              className="btn-primary w-full"
            >
              {busy ? <Spinner className="h-4 w-4" /> : null}
              Sign in
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/50">
            New to PawMarket?{' '}
            <Link to="/register" className="font-bold text-pine-900 hover:underline">
              Create an account
            </Link>
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-ink/5 pt-5 text-xs text-ink/35">
            <ShieldCheck className="h-4 w-4" />
            Protected by Supabase secure authentication
          </div>
        </div>

        <div className="relative hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=85"
            alt="A corgi looking at the camera"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-pine-950/80 via-pine-950/10 to-transparent" />
          <div className="absolute inset-x-8 bottom-8 rounded-2xl bg-cream/95 p-5 backdrop-blur">
            <p className="text-sm font-extrabold text-ink">
              &ldquo;Every listing is reviewed before it goes live.&rdquo;
            </p>
            <p className="mt-2 text-xs leading-5 text-ink/50">
              PawMarket is built around trust, transparency, and healthier outcomes for dogs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
