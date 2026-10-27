const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const isCloudinaryConfigured = Boolean(cloudName && uploadPreset)

export const MAX_IMAGE_SIZE = 8 * 1024 * 1024
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024
export const MAX_IMAGES = 6

export function uploadToCloudinary(file, onProgress) {
  if (!isCloudinaryConfigured) {
    return Promise.reject(
      new Error('Cloudinary is not configured. Add your cloud name and upload preset to .env.'),
    )
  }

  const isVideo = file.type.startsWith('video/')
  const resourceType = isVideo ? 'video' : 'image'
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`

  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    const request = new XMLHttpRequest()
    request.open('POST', endpoint)

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    request.onload = () => {
      let response = {}
      try {
        response = JSON.parse(request.responseText || '{}')
      } catch {
        response = {}
      }

      if (request.status >= 200 && request.status < 300 && response.secure_url) {
        resolve(response.secure_url)
      } else {
        reject(
          new Error(
            response.error?.message || 'Upload failed. Please check your Cloudinary settings.',
          ),
        )
      }
    }

    request.onerror = () =>
      reject(new Error('Upload failed. Check your internet connection and try again.'))

    request.send(formData)
  })
}
