import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { cn, getInitials } from '../lib/utils'
import { Logo } from './Logo'
import { Spinner } from './Loading'

function navClass({ isActive }) {
  return cn('nav-link', isActive && 'nav-link-active')
}

export function Navbar() {
  const { user, profile, loading, isAdmin, isSeller, signOut } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      addToast({ title: 'Signed out', message: 'See you again soon.' })
      navigate('/')
    } catch (error) {
      addToast({ title: 'Could not sign out', message: error.message, type: 'error' })
    } finally {
      setSigningOut(false)
    }
  }

  const sellLink = !user || isSeller ? '/dashboard/listings/new' : '/dogs'

  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-cream/90 backdrop-blur-xl">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          <NavLink to="/dogs" className={navClass}>
            Browse dogs
          </NavLink>
          <a href="/#how-it-works" className="nav-link">
            How it works
          </a>
          <a href="/#contact" className="nav-link">
            Contact
          </a>
          {user ? (
            <NavLink to={isAdmin ? '/admin' : '/dashboard'} className={navClass}>
              {isAdmin ? 'Admin' : 'Dashboard'}
            </NavLink>
          ) : null}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {loading ? (
            <Spinner className="h-5 w-5 text-pine-800" />
          ) : user ? (
            <>
              {isSeller ? (
                <Link to="/dashboard/listings/new" className="btn-primary btn-sm">
                  <PlusCircle className="h-4 w-4" />
                  List a dog
                </Link>
              ) : null}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-full border border-ink/10 bg-white py-1.5 pl-1.5 pr-3 text-sm font-semibold text-ink transition hover:border-ink/20"
                  aria-expanded={menuOpen}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pine-100 text-xs font-extrabold text-pine-800">
                    {getInitials(profile?.full_name)}
                  </span>
                  <span className="max-w-[110px] truncate">{profile?.full_name || 'Account'}</span>
                  <ChevronDown
                    className={cn('h-4 w-4 text-ink/40 transition', menuOpen && 'rotate-180')}
                  />
                </button>

                {menuOpen ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 cursor-default"
                      onClick={() => setMenuOpen(false)}
                      aria-label="Close account menu"
                    />
                    <div className="absolute right-0 top-12 z-10 w-60 animate-fade-up rounded-2xl border border-ink/10 bg-white p-2 shadow-lift">
                      <div className="border-b border-ink/5 px-3 pb-3 pt-2">
                        <p className="truncate text-sm font-bold text-ink">{profile?.full_name}</p>
                        <p className="mt-0.5 text-xs capitalize text-ink/45">{profile?.role}</p>
                      </div>
                      <Link
                        to={isAdmin ? '/admin' : '/dashboard'}
                        className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-pine-50 hover:text-ink"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {isAdmin ? 'Admin dashboard' : 'Seller dashboard'}
                      </Link>
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-pine-50 hover:text-ink"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Manage approvals
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm">
                Sign in
              </Link>
              <Link to="/register?role=seller" className="btn-primary btn-sm">
                Sell a dog
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 bg-white text-ink lg:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-ink/5 bg-cream px-4 pb-6 pt-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            <NavLink to="/dogs" className={navClass}>
              Browse dogs
            </NavLink>
            <a href="/#how-it-works" className="nav-link">
              How it works
            </a>
            <a href="/#contact" className="nav-link">
              Contact
            </a>
            {user ? (
              <NavLink to={isAdmin ? '/admin' : '/dashboard'} className={navClass}>
                {isAdmin ? 'Admin dashboard' : 'Seller dashboard'}
              </NavLink>
            ) : null}
          </nav>

          <div className="mt-4 border-t border-ink/10 pt-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine-100 text-sm font-extrabold text-pine-800">
                    {getInitials(profile?.full_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{profile?.full_name}</p>
                    <p className="text-xs capitalize text-ink/45">{profile?.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link to={isAdmin ? '/admin' : '/dashboard'} className="btn-outline btn-sm">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  {isSeller ? (
                    <Link to="/dashboard/listings/new" className="btn-primary btn-sm">
                      <PlusCircle className="h-4 w-4" />
                      List a dog
                    </Link>
                  ) : (
                    <Link to="/dogs" className="btn-primary btn-sm">
                      <UserRound className="h-4 w-4" />
                      Browse
                    </Link>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className="btn-outline btn-sm">
                  Sign in
                </Link>
                <Link to={sellLink} className="btn-primary btn-sm">
                  Sell a dog
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
