import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, HashRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { IS_DEMO } from './api/client'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import Home from './pages/Home'
import Search from './pages/Search'
import PropertyDetail from './pages/PropertyDetail'
import { Login, Register } from './pages/AuthPages'
import { About, Contact, Guidelines, NotFound, Pricing, Privacy, Projects, Terms } from './pages/StaticPages'
import ReportListing from './pages/ReportListing'

const Sell = lazy(() => import('./pages/Sell'))
const BuyerDashboard = lazy(() => import('./pages/BuyerDashboard'))
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

// The static preview runs inside a sandboxed frame that ignores URL changes, so it keeps routes in memory.
// Preview builds have no server routing: GitHub Pages uses #/ URLs (so new tab, back and reload work); the single-file artifact keeps routes in memory.
const Router = !IS_DEMO ? BrowserRouter : import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : MemoryRouter

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollTop />
        <div className="flex min-h-screen flex-col">
          {IS_DEMO && (
            <div className="bg-saffron-500 px-4 py-1.5 text-center text-xs font-semibold text-brand-900">
              Preview with sample data, running in your browser. Changes reset on reload. Logins: buyer@demo.in, seller@demo.in, admin@demo.in (password demo1234).
            </div>
          )}
          <Header />
          <main className="flex-1">
            <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading…</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/sell/:id/edit" element={<RequireAuth role="SELLER"><Sell /></RequireAuth>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<RequireAuth><BuyerDashboard /></RequireAuth>} />
                <Route path="/dashboard/seller" element={<RequireAuth role="SELLER"><SellerDashboard /></RequireAuth>} />
                <Route path="/admin" element={<RequireAuth role="ADMIN"><AdminDashboard /></RequireAuth>} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/guidelines" element={<Guidelines />} />
                <Route path="/report/:id" element={<ReportListing />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  )
}
