import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'

const styles = {
  pending: {
    className: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: Clock3,
    label: 'Pending review',
  },
  approved: {
    className: 'bg-pine-50 text-pine-700 ring-pine-200',
    icon: CheckCircle2,
    label: 'Approved',
  },
  rejected: {
    className: 'bg-red-50 text-red-700 ring-red-200',
    icon: XCircle,
    label: 'Rejected',
  },
}

export function StatusBadge({ status }) {
  const config = styles[status] || styles.pending
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1',
        config.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  )
}
