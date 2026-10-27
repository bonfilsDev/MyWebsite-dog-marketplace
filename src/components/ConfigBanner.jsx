import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase'

export function ConfigBanner() {
  const [visible, setVisible] = useState(true)

  if (isSupabaseConfigured || !visible) return null

  return (
    <div className="bg-amber-100 px-4 py-2.5 text-amber-950">
      <div className="container-page flex items-center justify-center gap-3 text-center">
        <AlertCircle className="hidden h-4 w-4 shrink-0 sm:block" />
        <p className="text-xs font-semibold leading-5 sm:text-sm">
          Supabase is not connected yet. Add your credentials to{' '}
          <code className="rounded bg-amber-950/10 px-1.5 py-0.5">.env</code> and restart the app.
          See <code className="rounded bg-amber-950/10 px-1.5 py-0.5">README.md</code> for setup.
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="ml-2 rounded-full p-1 transition hover:bg-amber-950/10"
          aria-label="Dismiss setup notice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
