import { PawPrint } from 'lucide-react'
import { cn } from '../lib/utils'

export function Spinner({ className }) {
  return (
    <span
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      aria-hidden="true"
    />
  )
}

export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-pine-950 text-cream">
        <PawPrint className="h-7 w-7" />
        <span className="absolute inset-0 animate-ping rounded-2xl border border-pine-900/30" />
      </div>
      <p className="text-sm font-semibold text-ink/50">{label}...</p>
    </div>
  )
}

export function DogCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-2xl bg-white p-4">
          <div className="skeleton h-14 w-14 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-3 w-1/4" />
          </div>
          <div className="skeleton h-8 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}
