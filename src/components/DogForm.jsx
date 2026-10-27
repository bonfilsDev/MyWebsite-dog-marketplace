import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Check, Save } from 'lucide-react'
import { GENDERS, DOG_STATUSES } from '../lib/constants'
import { Spinner } from './Loading'
import { MediaUploader } from './MediaUploader'

const emptyForm = {
  name: '',
  breed: '',
  age_years: '',
  gender: 'male',
  price_rwf: '',
  weight_kg: '',
  height_cm: '',
  description: '',
  location: 'Kigali',
  status: 'pending',
}

export function DogForm({ initialData, onSubmit, busy, submitLabel, cancelTo, isAdmin }) {
  const [form, setForm] = useState({
    ...emptyForm,
    ...(initialData
      ? {
          name: initialData.name || '',
          breed: initialData.breed || '',
          age_years: initialData.age_years ?? '',
          gender: initialData.gender || 'male',
          price_rwf: initialData.price_rwf ?? '',
          weight_kg: initialData.weight_kg ?? '',
          height_cm: initialData.height_cm ?? '',
          description: initialData.description || '',
          location: initialData.location || '',
          status: initialData.status || 'pending',
        }
      : {}),
  })
  const [images, setImages] = useState(initialData?.image_urls || [])
  const [videoUrl, setVideoUrl] = useState(initialData?.video_url || '')
  const [errors, setErrors] = useState({})
  const [mediaUploading, setMediaUploading] = useState(false)

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validate = () => {
    const next = {}

    if (!form.name.trim()) next.name = 'Give your dog a name.'
    if (!form.breed.trim()) next.breed = 'Please enter the breed.'
    if (form.age_years === '' || Number(form.age_years) < 0) {
      next.age_years = 'Enter a valid age in years.'
    } else if (Number(form.age_years) > 30) {
      next.age_years = 'Age seems too high. Please check it.'
    }
    if (!form.gender) next.gender = 'Choose a gender.'
    if (form.price_rwf === '' || Number(form.price_rwf) < 0) {
      next.price_rwf = 'Enter a valid price in RWF.'
    }
    if (form.weight_kg === '' || Number(form.weight_kg) <= 0) {
      next.weight_kg = 'Enter a valid weight.'
    }
    if (form.height_cm === '' || Number(form.height_cm) <= 0) {
      next.height_cm = 'Enter a valid height.'
    }
    if (!form.location.trim()) next.location = 'Where is the dog located?'
    if (!form.description.trim() || form.description.trim().length < 20) {
      next.description = 'Write at least 20 characters about your dog.'
    }
    if (images.length === 0) next.images = 'Add at least one photo.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (mediaUploading) return
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const payload = {
      name: form.name.trim(),
      breed: form.breed.trim(),
      age_years: Number(form.age_years),
      gender: form.gender,
      price_rwf: Number(form.price_rwf),
      weight_kg: Number(form.weight_kg),
      height_cm: Number(form.height_cm),
      description: form.description.trim(),
      location: form.location.trim(),
      image_urls: images,
      video_url: videoUrl || null,
    }

    if (isAdmin) payload.status = form.status

    onSubmit(payload)
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {hasErrors ? (
        <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Please fix the highlighted fields before saving this listing.</p>
        </div>
      ) : null}

      <section className="card p-5 sm:p-7">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Dog details</h2>
          <p className="mt-1 text-sm text-ink/45">
            Clear, honest details help buyers find the right match.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              Name <span className="text-clay-600">*</span>
            </label>
            <input
              id="name"
              className="input"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="e.g. Bruno"
              maxLength={80}
            />
            {errors.name ? <p className="field-error">{errors.name}</p> : null}
          </div>

          <div>
            <label className="label" htmlFor="breed">
              Breed <span className="text-clay-600">*</span>
            </label>
            <input
              id="breed"
              className="input"
              value={form.breed}
              onChange={(event) => setField('breed', event.target.value)}
              placeholder="e.g. Boerboel"
              list="dog-breeds"
              maxLength={80}
            />
            <datalist id="dog-breeds">
              <option value="Boerboel" />
              <option value="German Shepherd" />
              <option value="Golden Retriever" />
              <option value="Labrador Retriever" />
              <option value="Rottweiler" />
              <option value="Doberman" />
              <option value="Siberian Husky" />
              <option value="Pit Bull Terrier" />
              <option value="Belgian Malinois" />
              <option value="Mixed breed" />
            </datalist>
            {errors.breed ? <p className="field-error">{errors.breed}</p> : null}
          </div>

          <div>
            <label className="label" htmlFor="age">
              Age (years) <span className="text-clay-600">*</span>
            </label>
            <input
              id="age"
              type="number"
              min="0"
              max="30"
              step="0.5"
              className="input"
              value={form.age_years}
              onChange={(event) => setField('age_years', event.target.value)}
              placeholder="e.g. 2"
            />
            {errors.age_years ? <p className="field-error">{errors.age_years}</p> : null}
          </div>

          <div>
            <span className="label">
              Gender <span className="text-clay-600">*</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {GENDERS.map((gender) => (
                <button
                  key={gender.value}
                  type="button"
                  onClick={() => setField('gender', gender.value)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    form.gender === gender.value
                      ? 'border-pine-900 bg-pine-950 text-cream'
                      : 'border-ink/15 bg-white text-ink/60 hover:border-pine-500'
                  }`}
                >
                  {form.gender === gender.value ? <Check className="h-4 w-4" /> : null}
                  {gender.label}
                </button>
              ))}
            </div>
            {errors.gender ? <p className="field-error">{errors.gender}</p> : null}
          </div>

          <div>
            <label className="label" htmlFor="price">
              Price (RWF) <span className="text-clay-600">*</span>
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="1000"
              className="input"
              value={form.price_rwf}
              onChange={(event) => setField('price_rwf', event.target.value)}
              placeholder="e.g. 250000"
            />
            {errors.price_rwf ? <p className="field-error">{errors.price_rwf}</p> : null}
          </div>

          <div>
            <label className="label" htmlFor="location">
              Location <span className="text-clay-600">*</span>
            </label>
            <input
              id="location"
              className="input"
              value={form.location}
              onChange={(event) => setField('location', event.target.value)}
              placeholder="e.g. Kigali, Gasabo"
              maxLength={120}
            />
            {errors.location ? <p className="field-error">{errors.location}</p> : null}
          </div>

          <div>
            <label className="label" htmlFor="weight">
              Weight (kg) <span className="text-clay-600">*</span>
            </label>
            <input
              id="weight"
              type="number"
              min="0.1"
              max="200"
              step="0.1"
              className="input"
              value={form.weight_kg}
              onChange={(event) => setField('weight_kg', event.target.value)}
              placeholder="e.g. 28"
            />
            {errors.weight_kg ? <p className="field-error">{errors.weight_kg}</p> : null}
          </div>

          <div>
            <label className="label" htmlFor="height">
              Height (cm) <span className="text-clay-600">*</span>
            </label>
            <input
              id="height"
              type="number"
              min="1"
              max="250"
              step="0.1"
              className="input"
              value={form.height_cm}
              onChange={(event) => setField('height_cm', event.target.value)}
              placeholder="e.g. 65"
            />
            {errors.height_cm ? <p className="field-error">{errors.height_cm}</p> : null}
          </div>

          {isAdmin ? (
            <div className="sm:col-span-2">
              <label className="label" htmlFor="status">
                Listing status
              </label>
              <select
                id="status"
                className="input"
                value={form.status}
                onChange={(event) => setField('status', event.target.value)}
              >
                {DOG_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="label mb-0" htmlFor="description">
                Description <span className="text-clay-600">*</span>
              </label>
              <span className="text-xs text-ink/35">{form.description.length}/1200</span>
            </div>
            <textarea
              id="description"
              rows={6}
              className="input mt-2 resize-y"
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder="Tell buyers about your dog's temperament, health, vaccinations, diet, and what kind of home they would thrive in."
              maxLength={1200}
            />
            {errors.description ? <p className="field-error">{errors.description}</p> : null}
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-7">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Photos & video</h2>
          <p className="mt-1 text-sm text-ink/45">
            Listings with real photos get more genuine enquiries.
          </p>
        </div>
        <MediaUploader
          images={images}
          setImages={setImages}
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          onUploadingChange={setMediaUploading}
        />
        {errors.images ? <p className="field-error">{errors.images}</p> : null}
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Link to={cancelTo} className="btn-outline">
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>
        <button type="submit" disabled={busy || mediaUploading} className="btn-primary">
          {busy ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {mediaUploading ? 'Uploading media...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
