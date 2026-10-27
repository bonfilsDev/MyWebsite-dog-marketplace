import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import {
  SUPPORT_EMAIL,
  SUPPORT_LOCATION,
  SUPPORT_PHONE,
  SUPPORT_PHONE_INTL,
} from '../lib/constants'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer id="contact" className="mt-24 bg-pine-950 text-cream">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr_0.7fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-6 text-cream/60">
              A simpler, safer way to find a healthy, loved dog in Rwanda. Every public listing is
              reviewed by our team.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cream/40">
              <span className="h-2 w-2 rounded-full bg-clay-400" />
              Kigali, Rwanda
            </div>
          </div>

          <div>
            <h3 className="font-sans text-xs font-extrabold uppercase tracking-[0.18em] text-cream/40">
              Explore
            </h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-cream/70">
              <Link to="/" className="transition hover:text-cream">
                Home
              </Link>
              <Link to="/dogs" className="transition hover:text-cream">
                Browse dogs
              </Link>
              <a href="/#how-it-works" className="transition hover:text-cream">
                How it works
              </a>
              <a href="/#safety" className="transition hover:text-cream">
                Buying safely
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-sans text-xs font-extrabold uppercase tracking-[0.18em] text-cream/40">
              For sellers
            </h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-cream/70">
              <Link to="/register?role=seller" className="transition hover:text-cream">
                Become a seller
              </Link>
              <Link to="/login" className="transition hover:text-cream">
                Seller sign in
              </Link>
              <Link to="/dashboard" className="transition hover:text-cream">
                Seller dashboard
              </Link>
            </div>
          </div>

          <div id="contact-info">
            <h3 className="font-sans text-xs font-extrabold uppercase tracking-[0.18em] text-cream/40">
              Talk to us
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <a
                href={`tel:${SUPPORT_PHONE_INTL}`}
                className="flex items-center gap-3 text-cream/70 transition hover:text-cream"
              >
                <Phone className="h-4 w-4 shrink-0 text-clay-300" />
                {SUPPORT_PHONE}
              </a>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center gap-3 break-all text-cream/70 transition hover:text-cream"
              >
                <Mail className="h-4 w-4 shrink-0 text-clay-300" />
                {SUPPORT_EMAIL}
              </a>
              <p className="flex items-center gap-3 text-cream/70">
                <MapPin className="h-4 w-4 shrink-0 text-clay-300" />
                {SUPPORT_LOCATION}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-cream/10 pt-6 text-xs text-cream/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PawMarket. Made for dog lovers in Rwanda.</p>
          <p>Buy responsibly. Meet the dog before you pay.</p>
        </div>
      </div>
    </footer>
  )
}
