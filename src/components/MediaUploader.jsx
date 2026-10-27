import { useEffect, useRef, useState } from 'react'
import { CloudUpload, Film, ImagePlus, Trash2, UploadCloud, Video, X } from 'lucide-react'
import {
  MAX_IMAGES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  isCloudinaryConfigured,
  uploadToCloudinary,
} from '../lib/cloudinary'
import { useToast } from '../context/ToastContext'
import { optimizeImage } from '../lib/utils'
import { Spinner } from './Loading'

export function MediaUploader({
  images,
  setImages,
  videoUrl,
  setVideoUrl,
  onUploadingChange,
}) {
  const { addToast } = useToast()
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const [uploads, setUploads] = useState([])
  const [videoUpload, setVideoUpload] = useState(null)
  const [dragging, setDragging] = useState(false)

  const uploading = uploads.length > 0 || Boolean(videoUpload)

  useEffect(() => {
    onUploadingChange?.(uploading)
  }, [uploading, onUploadingChange])

  const removeImage = (url) => {
    setImages((current) => current.filter((item) => item !== url))
  }

  const processImages = async (fileList) => {
    const files = Array.from(fileList)
    if (!files.length) return

    if (!isCloudinaryConfigured) {
      addToast({
        title: 'Cloudinary is not configured',
        message: 'Add your cloud name and upload preset to .env first.',
        type: 'error',
      })
      return
    }

    const remaining = MAX_IMAGES - images.length - uploads.length
    if (remaining <= 0) {
      addToast({
        title: 'Photo limit reached',
        message: `You can upload up to ${MAX_IMAGES} photos per listing.`,
        type: 'error',
      })
      return
    }

    const accepted = []
    files.slice(0, remaining).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        addToast({ title: 'Invalid file', message: `${file.name} is not an image.`, type: 'error' })
      } else if (file.size > MAX_IMAGE_SIZE) {
        addToast({
          title: 'Image too large',
          message: `${file.name} is larger than 8 MB.`,
          type: 'error',
        })
      } else {
        accepted.push(file)
      }
    })

    if (files.length > remaining) {
      addToast({
        title: 'Some photos were skipped',
        message: `You can add ${remaining} more photo${remaining === 1 ? '' : 's'}.`,
        type: 'info',
      })
    }

    for (const file of accepted) {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      setUploads((current) => [...current, { id, name: file.name, progress: 0 }])

      try {
        const url = await uploadToCloudinary(file, (progress) => {
          setUploads((current) =>
            current.map((item) => (item.id === id ? { ...item, progress } : item)),
          )
        })
        setImages((current) => (current.length < MAX_IMAGES ? [...current, url] : current))
      } catch (error) {
        addToast({ title: 'Photo upload failed', message: error.message, type: 'error' })
      } finally {
        setUploads((current) => current.filter((item) => item.id !== id))
      }
    }
  }

  const processVideo = async (file) => {
    if (!file) return
    if (!isCloudinaryConfigured) {
      addToast({
        title: 'Cloudinary is not configured',
        message: 'Add your cloud name and upload preset to .env first.',
        type: 'error',
      })
      return
    }
    if (!file.type.startsWith('video/')) {
      addToast({ title: 'Invalid file', message: 'Please choose a video file.', type: 'error' })
      return
    }
    if (file.size > MAX_VIDEO_SIZE) {
      addToast({ title: 'Video too large', message: 'Videos must be 50 MB or smaller.', type: 'error' })
      return
    }

    setVideoUpload({ name: file.name, progress: 0 })
    try {
      const url = await uploadToCloudinary(file, (progress) => {
        setVideoUpload((current) => (current ? { ...current, progress } : current))
      })
      setVideoUrl(url)
      addToast({ title: 'Video uploaded', message: 'Your video is ready for the listing.' })
    } catch (error) {
      addToast({ title: 'Video upload failed', message: error.message, type: 'error' })
    } finally {
      setVideoUpload(null)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {!isCloudinaryConfigured ? (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <CloudUpload className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Cloudinary is not configured. Add <strong>VITE_CLOUDINARY_CLOUD_NAME</strong> and{' '}
            <strong>VITE_CLOUDINARY_UPLOAD_PRESET</strong> to your .env file to enable uploads.
          </p>
        </div>
      ) : null}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-ink">Photos</p>
            <p className="mt-0.5 text-xs text-ink/45">
              Up to {MAX_IMAGES} photos, 8 MB each. The first photo is your cover image.
            </p>
          </div>
          <span className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-bold text-ink/50">
            {images.length}/{MAX_IMAGES}
          </span>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            processImages(event.target.files)
            event.target.value = ''
          }}
        />

        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            processImages(event.dataTransfer.files)
          }}
          onClick={() => {
            if (!uploading && images.length < MAX_IMAGES) imageInputRef.current?.click()
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') imageInputRef.current?.click()
          }}
          className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${
            dragging
              ? 'border-pine-600 bg-pine-50'
              : 'border-ink/15 bg-cream/60 hover:border-pine-600/50 hover:bg-pine-50/50'
          } ${uploading || images.length >= MAX_IMAGES ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-pine-700 shadow-sm">
            <ImagePlus className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-bold text-ink">
            Drop photos here or <span className="text-clay-600">browse</span>
          </p>
          <p className="mt-1 text-xs text-ink/40">JPG, PNG, WEBP</p>
        </div>

        {images.length > 0 || uploads.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((url, index) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-xl bg-sand ring-1 ring-ink/10"
              >
                <img
                  src={optimizeImage(url, 300)}
                  alt={`Listing preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {index === 0 ? (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-pine-950/85 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-cream">
                    Cover
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white opacity-100 transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="relative aspect-square overflow-hidden rounded-xl bg-pine-950 p-3 text-cream"
              >
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Spinner className="h-5 w-5" />
                  <p className="mt-2 line-clamp-1 text-[10px] font-semibold text-cream/70">
                    {upload.name}
                  </p>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-clay-400 transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[9px] font-bold text-cream/50">{upload.progress}%</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-t border-ink/10 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-ink">Video tour</p>
            <p className="mt-0.5 text-xs text-ink/45">Optional. One video, up to 50 MB.</p>
          </div>
        </div>

        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => processVideo(event.target.files?.[0])}
        />

        {videoUpload ? (
          <div className="mt-3 flex items-center gap-4 rounded-2xl bg-pine-950 p-4 text-cream">
            <Film className="h-6 w-6 shrink-0 text-clay-300" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{videoUpload.name}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-clay-400 transition-all"
                  style={{ width: `${videoUpload.progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-bold text-cream/60">{videoUpload.progress}%</span>
          </div>
        ) : videoUrl ? (
          <div className="mt-3 flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-3">
            <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl bg-pine-950 text-cream">
              <Video className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">Video attached</p>
              <p className="truncate text-xs text-ink/45">{videoUrl}</p>
            </div>
            <button
              type="button"
              onClick={() => setVideoUrl('')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
              aria-label="Remove video"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/15 bg-cream/60 px-4 py-4 text-sm font-bold text-ink/60 transition hover:border-pine-600/50 hover:bg-pine-50/50 hover:text-ink"
          >
            <UploadCloud className="h-4 w-4" />
            Upload a video
          </button>
        )}
      </div>
    </div>
  )
}
