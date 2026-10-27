import { useEffect, useState } from 'react'
import { Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../lib/constants'
import { getInitials } from '../lib/utils'
import { Modal } from './Modal'
import { Spinner } from './Loading'

function toWhatsApp(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('250')) return digits
  if (digits.startsWith('0')) return `250${digits.slice(1)}`
  return digits
}

export function ContactSellerModal({ open, onClose, dog }) {
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    let active = true

    const loadContact = async () => {
      if (!dog?.seller_id || !isSupabaseConfigured) {
        setSeller(null)
        return
      }

      setLoading(true)
      const { data } = await supabase.rpc('get_seller_contact', { target_id: dog.seller_id })
      if (active) {
        setSeller(Array.isArray(data) ? data[0] || null : data || null)
        setLoading(false)
      }
    }

    loadContact()
    return () => {
      active = false
    }
  }, [open, dog?.seller_id])

  const phone = seller?.phone || SUPPORT_PHONE
  const email = seller?.email || SUPPORT_EMAIL
  const isSupport = !seller?.phone && !seller?.email
  const contactName =
    seller?.full_name || (isSupport ? 'PawMarket support' : 'This seller')
  const whatsApp = toWhatsApp(phone)
  const message = encodeURIComponent(
    `Hi ${contactName}, I'm interested in ${dog?.name || 'the dog'} listed on PawMarket.`,
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Contact the seller"
      description={`Ask about ${dog?.name || 'this dog'} and arrange a safe visit.`}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <Spinner className="h-6 w-6 text-pine-700" />
          <p className="text-sm text-ink/50">Loading contact details...</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-4 rounded-2xl bg-pine-50 p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pine-950 text-sm font-extrabold text-cream">
              {getInitials(contactName)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-ink">{contactName}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-pine-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {seller ? 'Seller on PawMarket' : 'PawMarket support'}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-ink/10 bg-cream p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink/35">
              {dog?.name || 'Dog'} · {dog?.breed || 'Dog'}
            </p>
            <p className="mt-1 text-sm font-bold text-ink">
              {isSupport
                ? 'The seller has not added contact details. Our team can help you connect.'
                : 'Reach out directly using the options below.'}
            </p>
          </div>

          <div className="mt-5 grid gap-2.5">
            <a href={`tel:${phone}`} className="btn-primary w-full">
              <Phone className="h-4 w-4" />
              Call {phone}
            </a>
            {whatsApp ? (
              <a
                href={`https://wa.me/${whatsApp}?text=${message}`}
                target="_blank"
                rel="noreferrer"
                className="btn-accent w-full"
              >
                <MessageCircle className="h-4 w-4" />
                Message on WhatsApp
              </a>
            ) : null}
            <a href={`mailto:${email}?subject=${encodeURIComponent(`Enquiry about ${dog?.name || 'a dog'} on PawMarket`)}`} className="btn-outline w-full">
              <Mail className="h-4 w-4" />
              {email}
            </a>
          </div>

          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-900 ring-1 ring-amber-200">
            <strong>Safety first:</strong> visit the dog in person, ask for health records, and
            never send a full payment before meeting the dog and seller.
          </div>

          {isSupport ? (
            <p className="mt-3 text-center text-xs text-ink/40">
              PawMarket support: {SUPPORT_PHONE} · {SUPPORT_EMAIL}
            </p>
          ) : null}
        </div>
      )}
    </Modal>
  )
}
