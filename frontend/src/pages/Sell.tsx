import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { Auth, Properties, Reference } from '../api/endpoints'
import type { PropertyDetail, PropertyRequest, PropertyType } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { ErrorNote, Field, Group, PageTitle, SuccessNote } from '../components/Ui'
import { HOME_TYPES, LAND_TYPES, TYPE_LABEL } from '../lib/format'
import { useAsync } from '../lib/useAsync'

const STEPS = ['Basics', 'Location', 'Details', 'Photos'] as const

const EMPTY: PropertyRequest = {
  title: '', propertyType: 'APARTMENT', price: 0, priceNegotiable: true, builtUpArea: null, plotArea: null,
  areaUnit: 'SQFT', bedrooms: 2, bathrooms: 2, furnishing: 'UNFURNISHED', propertyAgeYears: null, possession: 'READY',
  description: '', addressLine: '', localityId: 0, pinCode: '', latitude: null, longitude: null,
  contactPreference: 'BOTH', showPhone: true, amenityCodes: [],
}

function fromDetail(p: PropertyDetail): PropertyRequest {
  return {
    title: p.title, propertyType: p.propertyType, price: Number(p.price), priceNegotiable: p.priceNegotiable,
    builtUpArea: p.builtUpArea ?? null, plotArea: p.plotArea ?? null, areaUnit: p.areaUnit, bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null, furnishing: p.furnishing ?? null, propertyAgeYears: p.propertyAgeYears ?? null,
    possession: p.possession, description: p.description, addressLine: p.addressLine, localityId: p.locality.id,
    pinCode: p.pinCode, latitude: p.latitude ?? null, longitude: p.longitude ?? null,
    contactPreference: p.owner?.contactPreference ?? 'BOTH', showPhone: !p.owner?.phoneHidden, amenityCodes: p.amenityCodes,
  }
}

export default function Sell() {
  const { user, hasRole, signIn } = useAuth()
  const params = useParams()
  const editId = params.id ? Number(params.id) : undefined
  const nav = useNavigate()
  const localities = useAsync(() => Reference.localities(), [])
  const amenities = useAsync(() => Reference.amenities(), [])
  const [form, setForm] = useState<PropertyRequest>(EMPTY)
  const [step, setStep] = useState(0)
  const [savedId, setSavedId] = useState<number | undefined>(editId)
  const [images, setImages] = useState<{ id: number; url: string }[]>([])
  const [err, setErr] = useState<unknown>()
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!editId) return
    Properties.get(editId).then(p => { setForm(fromDetail(p)); setImages(p.images) }).catch(setErr)
  }, [editId])

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 text-center">
        <h1 className="text-3xl font-bold">Sell your property for free</h1>
        <p className="mt-3 text-slate-600">Create a free owner account to post your listing. Buyers contact you directly.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/register?type=SELLER" className="btn-accent">Create owner account</Link>
          <Link to="/login?next=/sell" className="btn-ghost">I already have an account</Link>
        </div>
      </div>
    )
  }
  if (!hasRole('SELLER') && !hasRole('BUILDER')) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 text-center">
        <h1 className="text-2xl font-bold">Start selling</h1>
        <p className="mt-2 text-slate-600">Your account is set up for buying. Turn on selling to post a property.</p>
        <button className="btn-primary mt-6" onClick={async () => signIn(await Auth.becomeSeller())}>Enable selling on my account</button>
      </div>
    )
  }

  const isLand = LAND_TYPES.includes(form.propertyType)
  const isHome = HOME_TYPES.includes(form.propertyType)
  const up = <K extends keyof PropertyRequest>(k: K, v: PropertyRequest[K]) => setForm(f => ({ ...f, [k]: v }))
  const num = (v: string) => (v === '' ? null : Number(v))

  function payload(): PropertyRequest {
    return {
      ...form,
      builtUpArea: isLand ? null : form.builtUpArea,
      bedrooms: isHome ? form.bedrooms : null,
      bathrooms: isLand ? null : form.bathrooms,
      furnishing: isHome ? form.furnishing : null,
      propertyAgeYears: isLand ? null : form.propertyAgeYears,
    }
  }

  async function save() {
    setBusy(true); setErr(undefined); setFieldErr({})
    try {
      const res = savedId ? await Properties.update(savedId, payload()) : await Properties.create(payload())
      setSavedId(res.id)
      setStep(3)
    } catch (e) {
      setErr(e)
      if (e instanceof ApiError) setFieldErr(e.fieldErrors)
    } finally { setBusy(false) }
  }

  async function upload(files: FileList | null) {
    if (!files || !savedId) return
    setErr(undefined)
    for (const f of Array.from(files)) {
      try {
        const img = await Properties.uploadImage(savedId, f)
        setImages(list => [...list, img])
      } catch (e) { setErr(e) }
    }
  }

  async function removeImage(imageId: number) {
    if (!savedId) return
    await Properties.deleteImage(savedId, imageId)
    setImages(list => list.filter(i => i.id !== imageId))
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageTitle title={editId ? 'Edit your listing' : 'Post your property'} sub="Free for owners. Every listing is reviewed before it goes live." />
      <ol className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className={`rounded-lg px-2 py-2 text-center text-xs font-semibold sm:text-sm ${i === step ? 'bg-brand-700 text-white' : i < step ? 'bg-brand-100 text-brand-800' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <div className="card space-y-5 p-6">
        {step === 0 && (
          <>
            <Group label="What are you selling?">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(Object.keys(TYPE_LABEL) as PropertyType[]).map(t => (
                  <button type="button" key={t} onClick={() => up('propertyType', t)}
                    className={`rounded-lg border px-3 py-2 text-sm ${form.propertyType === t ? 'border-brand-700 bg-brand-50 font-semibold text-brand-800' : 'border-slate-300 bg-white'}`}>
                    {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </Group>
            <Field label="Listing title" error={fieldErr.title} hint="Example: 3 BHK independent house near Thatipur chauraha">
              <input className="input" maxLength={150} value={form.title} onChange={e => up('title', e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Asking price (₹)" error={fieldErr.price}>
                <input className="input" inputMode="numeric" value={form.price || ''} onChange={e => up('price', Number(e.target.value.replace(/\D/g, '')))} />
              </Field>
              <label className="mt-7 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.priceNegotiable} onChange={e => up('priceNegotiable', e.target.checked)} /> Price is negotiable
              </label>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Locality" error={fieldErr.localityId}>
              <select className="input" value={form.localityId || ''} onChange={e => {
                const l = localities.data?.find(x => x.id === Number(e.target.value))
                setForm(f => ({ ...f, localityId: Number(e.target.value), pinCode: f.pinCode || l?.pinCode || '' }))
              }}>
                <option value="">Choose locality</option>
                {localities.data?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
            <Field label="Address / landmark" error={fieldErr.addressLine} hint="House number is optional. Buyers see this line.">
              <input className="input" maxLength={255} value={form.addressLine} onChange={e => up('addressLine', e.target.value)} />
            </Field>
            <Field label="PIN code" error={fieldErr.pinCode}>
              <input className="input" inputMode="numeric" maxLength={6} value={form.pinCode} onChange={e => up('pinCode', e.target.value.replace(/\D/g, ''))} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Latitude (optional)" error={fieldErr.latitude}>
                <input className="input" value={form.latitude ?? ''} onChange={e => up('latitude', num(e.target.value))} />
              </Field>
              <Field label="Longitude (optional)" error={fieldErr.longitude}>
                <input className="input" value={form.longitude ?? ''} onChange={e => up('longitude', num(e.target.value))} />
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {!isLand && (
                <Field label="Built-up area" error={fieldErr.builtUpArea}>
                  <input className="input" inputMode="decimal" value={form.builtUpArea ?? ''} onChange={e => up('builtUpArea', num(e.target.value))} />
                </Field>
              )}
              <Field label={isLand ? 'Plot area' : 'Plot area (optional)'} error={fieldErr.plotArea}>
                <input className="input" inputMode="decimal" value={form.plotArea ?? ''} onChange={e => up('plotArea', num(e.target.value))} />
              </Field>
              <Field label="Unit">
                <select className="input" value={form.areaUnit} onChange={e => up('areaUnit', e.target.value as PropertyRequest['areaUnit'])}>
                  <option value="SQFT">sq ft</option><option value="SQYD">sq yd (gaj)</option><option value="SQM">sq m</option>
                </select>
              </Field>
            </div>
            {isHome && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Bedrooms" error={fieldErr.bedrooms}>
                  <input className="input" type="number" min={0} max={20} value={form.bedrooms ?? ''} onChange={e => up('bedrooms', num(e.target.value))} />
                </Field>
                <Field label="Bathrooms" error={fieldErr.bathrooms}>
                  <input className="input" type="number" min={0} max={20} value={form.bathrooms ?? ''} onChange={e => up('bathrooms', num(e.target.value))} />
                </Field>
                <Field label="Furnishing">
                  <select className="input" value={form.furnishing ?? ''} onChange={e => up('furnishing', e.target.value as PropertyRequest['furnishing'])}>
                    <option value="UNFURNISHED">Unfurnished</option><option value="SEMI_FURNISHED">Semi-furnished</option><option value="FULLY_FURNISHED">Fully furnished</option>
                  </select>
                </Field>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {!isLand && (
                <Field label="Property age (years)">
                  <input className="input" type="number" min={0} max={100} value={form.propertyAgeYears ?? ''} onChange={e => up('propertyAgeYears', num(e.target.value))} />
                </Field>
              )}
              <Field label="Possession">
                <select className="input" value={form.possession} onChange={e => up('possession', e.target.value as PropertyRequest['possession'])}>
                  <option value="READY">Ready to move</option><option value="UNDER_CONSTRUCTION">Under construction</option>
                </select>
              </Field>
            </div>
            <Field label="Description" error={fieldErr.description} hint="At least 30 characters. Mention road width, water supply, nearby schools or markets.">
              <textarea className="input min-h-32" maxLength={5000} value={form.description} onChange={e => up('description', e.target.value)} />
            </Field>
            <Group label="Amenities">
              <div className="flex flex-wrap gap-2">
                {amenities.data?.map(a => {
                  const on = form.amenityCodes.includes(a.code)
                  return (
                    <button type="button" key={a.code} onClick={() => up('amenityCodes', on ? form.amenityCodes.filter(c => c !== a.code) : [...form.amenityCodes, a.code])}
                      className={`rounded-full border px-3 py-1.5 text-sm ${on ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white'}`}>
                      {a.label}
                    </button>
                  )
                })}
              </div>
            </Group>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="How should buyers contact you?">
                <select className="input" value={form.contactPreference} onChange={e => up('contactPreference', e.target.value as PropertyRequest['contactPreference'])}>
                  <option value="BOTH">Calls and messages</option><option value="CALL">Calls</option><option value="CHAT">Messages only</option>
                </select>
              </Field>
              <label className="mt-7 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.showPhone} onChange={e => up('showPhone', e.target.checked)} /> Show my number to buyers who enquire
              </label>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {savedId ? (
              <SuccessNote>Listing saved and sent for review. Add photos now; listings with photos get far more enquiries.</SuccessNote>
            ) : (
              <p className="text-sm text-slate-600">Save your listing first, then add photos.</p>
            )}
            <label className={`block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center ${!savedId ? 'pointer-events-none opacity-50' : 'hover:border-brand-500'}`}>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e => upload(e.target.files)} />
              <span className="font-semibold text-brand-700">Choose photos</span>
              <span className="block text-xs text-slate-500">JPEG, PNG or WebP, up to 8 MB each, 20 photos max</span>
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((im, i) => (
                  <div key={im.id} className="relative overflow-hidden rounded-lg">
                    <img src={im.url} alt="" className="aspect-square w-full object-cover" />
                    {i === 0 && <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[10px] text-white">Cover</span>}
                    <button onClick={() => removeImage(im.id)} className="absolute right-1 top-1 rounded bg-white/90 px-1.5 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <ErrorNote error={err} />

        <div className="flex justify-between pt-2">
          <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>Back</button>
          {step < 2 && <button className="btn-primary" onClick={() => setStep(s => s + 1)}>Continue</button>}
          {step === 2 && <button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : savedId ? 'Save changes' : 'Save & continue'}</button>}
          {step === 3 && savedId && <button className="btn-accent" onClick={() => nav('/dashboard/seller')}>Done, go to my listings</button>}
        </div>
      </div>
    </div>
  )
}
