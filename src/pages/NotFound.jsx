import { Link } from 'react-router-dom'
import { ArrowLeft, Home, PawPrint } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

export function NotFound() {
  usePageTitle('Page not found')

  return (
    <div className="container-page flex min-h-[65vh] items-center justify-center py-16">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-pine-950 text-cream">
          <PawPrint className="h-9 w-9" />
        </div>
        <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.2em] text-clay-600">
          Error 404
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          This trail went cold.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink/50">
          The page you are looking for may have moved or no longer exists. Let&apos;s get you back
          to the dogs.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn-primary">
            <Home className="h-4 w-4" />
            Back home
          </Link>
          <Link to="/dogs" className="btn-outline">
            <ArrowLeft className="h-4 w-4" />
            Browse dogs
          </Link>
        </div>
      </div>
    </div>
  )
}
