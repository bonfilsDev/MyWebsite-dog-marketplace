import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Loading'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  loading = false,
  tone = 'danger',
}) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title} className="sm:max-w-md">
      <div className="flex gap-4">
        <div
          className={
            tone === 'danger'
              ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600'
              : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine-50 text-pine-700'
          }
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="pt-1 text-sm leading-6 text-ink/60">{description}</p>
      </div>
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="btn-outline" disabled={loading}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={
            tone === 'danger'
              ? 'btn bg-red-600 text-white hover:bg-red-700'
              : 'btn-primary'
          }
        >
          {loading ? <Spinner className="h-4 w-4" /> : null}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
