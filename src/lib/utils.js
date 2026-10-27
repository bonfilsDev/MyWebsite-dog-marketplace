import { IMAGE_PLACEHOLDER } from './constants'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return 'Price on request'
  return `RWF ${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number(value))}`
}

export function formatAge(value) {
  if (value === null || value === undefined || value === '') return '—'
  const age = Number(value)
  if (age < 1) {
    return `${Math.round(age * 12)} mo`
  }
  return `${Number.isInteger(age) ? age : age.toFixed(1)} yr${age === 1 ? '' : 's'}`
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getInitials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'PM'
  )
}

export function optimizeImage(url, width = 900) {
  if (!url) return IMAGE_PLACEHOLDER
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,c_fill,w_${width}/`)
  }
  return url
}

export function sanitizeSearch(value = '') {
  return value.replace(/[%,()]/g, '').trim()
}

export function safeRedirect(path, fallback = '/') {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    return fallback
  }
  return path
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback
  if (typeof error === 'string') return error
  return error.message || fallback
}
