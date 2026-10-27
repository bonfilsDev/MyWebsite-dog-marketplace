import { Link } from 'react-router-dom'
import { PawPrint } from 'lucide-react'
import { cn } from '../lib/utils'

export function Logo({ light = false, className }) {
  return (
    <Link
      to="/"
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="PawMarket home"
    >
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-2xl transition group-hover:-rotate-6',
          light ? 'bg-cream text-pine-950' : 'bg-pine-950 text-cream',
        )}
      >
        <PawPrint className="h-5 w-5" />
      </span>
      <span
        className={cn(
          'text-[19px] font-extrabold tracking-tight',
          light ? 'text-cream' : 'text-ink',
        )}
      >
        Paw<span className={light ? 'text-clay-300' : 'text-clay-500'}>Market</span>
      </span>
    </Link>
  )
}
