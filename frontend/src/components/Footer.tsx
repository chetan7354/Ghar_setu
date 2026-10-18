import { Link } from 'react-router-dom'
import { BRAND } from '../brand'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="mt-16 bg-brand-900 text-brand-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-3 text-sm text-brand-200">{BRAND.tagline}. Talk to the person who owns the home. No brokerage.</p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/search" className="hover:text-white">Properties in Gwalior</Link></li>
            <li><Link to="/search?category=LAND" className="hover:text-white">Plots & land</Link></li>
            <li><Link to="/search?category=COMMERCIAL" className="hover:text-white">Shops & offices</Link></li>
            <li><Link to="/projects" className="hover:text-white">Builder projects</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white">For owners</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/sell" className="hover:text-white">Post property free</Link></li>
            <li><Link to="/pricing" className="hover:text-white">Featured listings</Link></li>
            <li><Link to="/guidelines" className="hover:text-white">Listing & verification rules</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white">Company</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-white">About us</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-white">Privacy policy</Link></li>
            <li><Link to="/terms" className="hover:text-white">Terms & conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-800 py-4 text-center text-xs text-brand-200">
        © {new Date().getFullYear()} {BRAND.name}. Listings are posted by owners; always check documents before paying.
      </div>
    </footer>
  )
}
