import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  MailCheck,
  ShoppingBag,
  Store,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { usePageTitle } from '../hooks/usePageTitle'
import { Logo } from '../components/Logo'
import { Spinner } from '../components/Loading'

export function Register() {
  usePageTitle('Create an account')
  const [searchParams] = useSearchParams()
  const { user, loading, isAdmin, isSeller, signUp } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [role, setRole] = useState(searchParams.get('role') === 'seller' ? 'seller' : 'buyer')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [awaitingEmail, setAwaitingEmail] = useState(false)
  const [errors, setErrors] = useState({})

  if (!loading && user && !awaitingEmail) {
    return <Navigate to={isAdmin ? '/admin' : isSeller ? '/dashboard' : '/'} replace />
  }

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setError('')
  }

  const validate = () => {
    const next = {}
    if (form.fullName.trim().length < 2) next.fullName = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address.'
    }
    if (role === 'seller') {
      const digits = form.phone.replace(/\D/g, '')
      if (digits.length < 9) next.phone = 'Sellers must provide a valid phone number.'
    }
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!validate()) return

    setBusy(true)
    try {
      const data = await signUp({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        role,
      })

      if (data.session) {
        addToast({ title: 'Account created', message: 'Welcome to PawMarket.' })
        navigate(role === 'seller' ? '/dashboard' : '/')
      } else {
        setAwaitingEmail(true)
      }
    } catch (submitError) {
      setError(
        submitError.message.toLowerCase().includes('already registered')
          ? 'An account with this email already exists. Try signing in instead.'
          : submitError.message,
      )
    } finally {
      setBusy(false)
    }
  }

  if (awaitingEmail) {
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="card w-full max-w-lg p-8 text-center sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pine-50 text-pine-700">
            <MailCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-6 text-3xl font-semibold">Check your inbox</h1>
          <p className="mt-3 text-sm leading-6 text-ink/55">
            We sent a confirmation link to <strong className="text-ink">{form.email}</strong>. Click
            the link to activate your PawMarket account.
          </p>
          <Link to="/login" className="btn-primary mt-7">
            Go to sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-5 text-xs text-ink/35">
            Did not get the email? Check spam or try registering again in a few minutes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-12 sm:py-20">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[36px] border border-ink/10 bg-white shadow-soft lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-6 sm:p-10 lg:p-12">
          <Logo />
          <div className="mt-8">
            <span className="eyebrow">Join PawMarket</span>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              A new home starts here.
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink/50">
              Create a buyer account to explore dogs, or a seller account to list dogs for sale.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`relative rounded-2xl border p-4 text-left transition ${
                role === 'buyer'
                  ? 'border-pine-900 bg-pine-50 ring-2 ring-pine-900/10'
                  : 'border-ink/10 hover:border-pine-300'
              }`}
            >
              {role === 'buyer' ? (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-pine-950 text-cream">
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
              <ShoppingBag className="h-5 w-5 text-clay-600" />
              <p className="mt-2 text-sm font-extrabold">I&apos;m buying</p>
              <p className="mt-1 text-[11px] leading-4 text-ink/45">Browse and contact sellers</p>
            </button>
            <button
              type="button"
              onClick={() => setRole('seller')}
              className={`relative rounded-2xl border p-4 text-left transition ${
                role === 'seller'
                  ? 'border-pine-900 bg-pine-50 ring-2 ring-pine-900/10'
                  : 'border-ink/10 hover:border-pine-300'
              }`}
            >
              {role === 'seller' ? (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-pine-950 text-cream">
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
              <Store className="h-5 w-5 text-clay-600" />
              <p className="mt-2 text-sm font-extrabold">I&apos;m selling</p>
              <p className="mt-1 text-[11px] leading-4 text-ink/45">List dogs for sale</p>
            </button>
          </div>

          {!isSupabaseConfigured ? (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-xs leading-5 text-amber-900 ring-1 ring-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Registration is unavailable until Supabase credentials are added to your .env file.
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-red-50 p-3.5 text-sm text-red-700 ring-1 ring-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="fullName" className="label">
                Full name
              </label>
              <input
                id="fullName"
                autoComplete="name"
                value={form.fullName}
                onChange={(event) => setField('fullName', event.target.value)}
                placeholder="Your full name"
                className="input"
              />
              {errors.fullName ? <p className="field-error">{errors.fullName}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="label">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  placeholder="you@example.com"
                  className="input"
                />
                {errors.email ? <p className="field-error">{errors.email}</p> : null}
              </div>
              <div>
                <label htmlFor="phone" className="label">
                  Phone {role === 'seller' ? <span className="text-clay-600">*</span> : null}
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                  placeholder="07XX XXX XXX"
                  className="input"
                />
                {errors.phone ? <p className="field-error">{errors.phone}</p> : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => setField('password', event.target.value)}
                    placeholder="Min. 8 characters"
                    className="input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((show) => !show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/35 hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? <p className="field-error">{errors.password}</p> : null}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => setField('confirmPassword', event.target.value)}
                  placeholder="Repeat password"
                  className="input"
                />
                {errors.confirmPassword ? (
                  <p className="field-error">{errors.confirmPassword}</p>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !isSupabaseConfigured}
              className="btn-primary mt-2 w-full"
            >
              {busy ? <Spinner className="h-4 w-4" /> : null}
              Create {role} account
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-ink/50">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-pine-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="relative hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=85"
            alt="Two dogs running together"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-pine-950/85 via-pine-950/15 to-transparent" />
          <div className="absolute inset-x-8 bottom-8">
            <p className="font-display text-3xl font-semibold leading-tight text-cream">
              Good matches start with honest listings.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Reviewed listings', 'Secure accounts', 'Direct contact'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-cream/20 bg-cream/10 px-3 py-1.5 text-[11px] font-bold text-cream/80 backdrop-blur"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
