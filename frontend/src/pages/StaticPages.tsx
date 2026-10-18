import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { BRAND } from '../brand'
import { Reference } from '../api/endpoints'
import { useAsync } from '../lib/useAsync'
import { formatPrice } from '../lib/format'

function Doc({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      {updated && <p className="mt-1 text-sm text-slate-500">Last updated {updated}</p>}
      <div className="mt-6 space-y-4 leading-relaxed text-slate-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </article>
  )
}

const DRAFT = (
  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
    Draft text for review. Have a lawyer check this page before launch.
  </p>
)

export function About() {
  return (
    <Doc title={`About ${BRAND.name}`}>
      <p>{BRAND.name} is a property marketplace that starts in Gwalior. Owners list homes, plots and shops for free, and buyers talk to them directly.</p>
      <p>We are building it because buying a home should not mean paying a middleman just to get a phone number. Our job is to make listings trustworthy, conversations easy, and site visits simple to arrange.</p>
      <h2>What we do</h2>
      <ul><li>Review every listing before it goes live</li><li>Keep owner phone numbers private until a real buyer enquires</li><li>Let buyers book and track site visits</li><li>Label every paid placement as sponsored</li></ul>
      <h2>What we don't do</h2>
      <ul><li>We do not act as your broker or take brokerage</li><li>We do not certify legal title. Always get documents checked by a lawyer before you pay.</li></ul>
    </Doc>
  )
}

export function Contact() {
  return (
    <Doc title="Contact us">
      <p>Questions, feedback or a problem with a listing? Write to us at <a className="font-semibold text-brand-700" href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.</p>
      <p>To flag a specific listing, use the <strong>Report this listing</strong> link on its page so our team sees the property straight away.</p>
      <p className="text-sm text-slate-500">Office address and phone line will be added before launch.</p>
    </Doc>
  )
}

export function Privacy() {
  return (
    <Doc title="Privacy policy" updated="October 2026">
      {DRAFT}
      <h2>What we collect</h2>
      <ul><li>Account details: name, email, mobile number, and a securely hashed password</li><li>Listings you post, including photos and location</li><li>Enquiries and visit requests you send or receive</li><li>Technical data such as IP address, used for security and abuse prevention</li></ul>
      <h2>Who sees your phone number</h2>
      <p>An owner's number is shown only to logged-in buyers who have sent an enquiry, and only if the owner allowed it. A buyer's number is shared with an owner only when the buyer ticks "share my phone number", or once a site visit is confirmed.</p>
      <h2>Verification documents</h2>
      <p>Documents you upload for verification are stored privately, seen only by our review team, and never shown on your listing.</p>
      <h2>Your choices</h2>
      <p>You can edit or delete your listings at any time and ask us to delete your account by writing to {BRAND.supportEmail}.</p>
    </Doc>
  )
}

export function Terms() {
  return (
    <Doc title="Terms & conditions" updated="October 2026">
      {DRAFT}
      <h2>Using {BRAND.name}</h2>
      <p>{BRAND.name} is a platform that connects property owners and buyers. We are not a party to any sale and do not act as a real estate agent.</p>
      <h2>Listings</h2>
      <ul><li>Only the owner, or someone the owner has authorised in writing, may list a property</li><li>Listings must be accurate and must not be duplicates</li><li>We may pause or remove any listing that breaks our guidelines</li></ul>
      <h2>Paid services</h2>
      <p>Featured placements and marketing services are optional. Prices are shown before purchase and promoted listings are labelled as sponsored. Online payment is not live yet.</p>
      <h2>Your responsibility</h2>
      <p>Check title documents, approvals and encumbrances independently before paying any money. Never pay a token amount without a written agreement.</p>
    </Doc>
  )
}

export function Guidelines() {
  return (
    <Doc title="Listing & verification guidelines">
      <h2>What our badges mean</h2>
      <ul>
        <li><strong>Direct owner</strong>: the listing was posted by an account that says it is the owner. Report it if a broker is posing as an owner.</li>
        <li><strong>Contact verified</strong>: our team confirmed the owner's phone number. This says nothing about who legally owns the property.</li>
        <li><strong>Documents reviewed</strong>: the owner shared ownership papers and our team looked at them. This is not a legal title search.</li>
      </ul>
      <p>We will never label a property "legally verified" unless a qualified legal verification has actually been carried out.</p>
      <h2>Listing rules</h2>
      <ul><li>Use real photos of the property you are selling</li><li>State the real asking price</li><li>One listing per property</li><li>Mark the property as sold when it is sold</li></ul>
      <h2>Review process</h2>
      <p>Every new listing, and every edit to an existing listing, is checked by a person before it appears in search. Listings that look like duplicates are flagged for a closer look.</p>
    </Doc>
  )
}

export function Pricing() {
  const pkgs = useAsync(() => Reference.packages(), [])
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Pricing for owners</h1>
      <p className="mt-2 text-slate-600">Basic listings are free. Promote your listing when you want more buyers to see it.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="card p-6">
          <p className="font-semibold text-slate-500">Basic listing</p>
          <p className="mt-2 text-3xl font-extrabold text-brand-800">Free</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700"><li>✓ Up to 20 photos</li><li>✓ Buyer enquiries & site visits</li><li>✓ Listing performance in your dashboard</li></ul>
          <Link to="/sell" className="btn-primary mt-6 w-full">Post for free</Link>
        </div>
        {pkgs.data?.map(p => (
          <div key={p.id} className="card border-saffron-400 p-6 ring-1 ring-saffron-400">
            <p className="font-semibold text-saffron-600">{p.name}</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-800">{formatPrice(Number(p.price))}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700"><li>✓ Top of search results for {p.durationDays} days</li><li>✓ Shown on the homepage</li><li>✓ "Featured · Sponsored" label</li></ul>
            <a href={`mailto:${BRAND.supportEmail}?subject=${encodeURIComponent(p.name)}`} className="btn-accent mt-6 w-full">Contact us to activate</a>
          </div>
        ))}
      </div>
      <p className="mt-6 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">Online payment is not available yet. Our team activates featured listings manually for now.</p>
      <h2 className="mt-12 text-xl font-bold">Coming later</h2>
      <p className="mt-2 text-slate-600">Professional photography, video walkthroughs, assisted listing and builder project packages.</p>
    </div>
  )
}

export function Projects() {
  return (
    <Doc title="Builder & developer projects">
      <p>Project pages for builders, with multiple units, enquiry management and analytics, are planned for a later phase.</p>
      <p>Builders who want early access can write to <a className="font-semibold text-brand-700" href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.</p>
    </Doc>
  )
}

export function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </div>
  )
}
