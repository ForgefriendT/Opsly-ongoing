/**
 * Opsly Image Processor
 * - Auto background removal (white/light backgrounds → transparent)
 * - Smart resize to invoice-ready dimensions
 * - Output as PNG with transparency
 */

const LOGO_MAX_WIDTH = 400
const LOGO_MAX_HEIGHT = 200
const SIGNATURE_MAX_WIDTH = 300
const SIGNATURE_MAX_HEIGHT = 100
const STAMP_MAX_WIDTH = 200
const STAMP_MAX_HEIGHT = 200

// How aggressively to remove backgrounds (0-255, higher = more aggressive)
const BG_THRESHOLD = 240  // Pixels with R, G, B all above this are considered "background"
const EDGE_BLUR_RADIUS = 1 // Pixel radius for edge smoothing

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Detect if the image has a predominantly white/light background
 * by sampling pixels along the edges
 */
function detectLightBackground(imageData, width, height) {
  const data = imageData.data
  let lightPixels = 0
  let totalSampled = 0

  // Sample edges: top row, bottom row, left column, right column
  const samplePositions = []

  // Top and bottom rows
  for (let x = 0; x < width; x += 2) {
    samplePositions.push(x * 4) // top row
    samplePositions.push(((height - 1) * width + x) * 4) // bottom row
  }

  // Left and right columns
  for (let y = 0; y < height; y += 2) {
    samplePositions.push((y * width) * 4) // left column
    samplePositions.push((y * width + width - 1) * 4) // right column
  }

  for (const pos of samplePositions) {
    if (pos < data.length - 3) {
      const r = data[pos]
      const g = data[pos + 1]
      const b = data[pos + 2]
      totalSampled++
      if (r > BG_THRESHOLD && g > BG_THRESHOLD && b > BG_THRESHOLD) {
        lightPixels++
      }
    }
  }

  // If more than 60% of edge pixels are light, it's a light background
  return totalSampled > 0 && (lightPixels / totalSampled) > 0.6
}

/**
 * Remove light/white background from image data
 * Uses color distance from sampled background color
 */
function removeBackground(imageData, width, height) {
  const data = imageData.data

  // Sample the average background color from corners
  const cornerSamples = []
  const sampleSize = Math.min(10, Math.floor(width * 0.05))

  for (let y = 0; y < sampleSize; y++) {
    for (let x = 0; x < sampleSize; x++) {
      // Top-left
      const tl = (y * width + x) * 4
      cornerSamples.push([data[tl], data[tl + 1], data[tl + 2]])

      // Top-right
      const tr = (y * width + (width - 1 - x)) * 4
      cornerSamples.push([data[tr], data[tr + 1], data[tr + 2]])

      // Bottom-left
      const bl = ((height - 1 - y) * width + x) * 4
      cornerSamples.push([data[bl], data[bl + 1], data[bl + 2]])

      // Bottom-right
      const br = ((height - 1 - y) * width + (width - 1 - x)) * 4
      cornerSamples.push([data[br], data[br + 1], data[br + 2]])
    }
  }

  // Calculate average background color
  const avgBg = cornerSamples.reduce(
    (acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b],
    [0, 0, 0]
  ).map(v => v / cornerSamples.length)

  // Remove pixels close to the background color
  const tolerance = 35 // Color distance tolerance

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Calculate color distance from background
    const dist = Math.sqrt(
      Math.pow(r - avgBg[0], 2) +
      Math.pow(g - avgBg[1], 2) +
      Math.pow(b - avgBg[2], 2)
    )

    if (dist < tolerance) {
      // Fully transparent
      data[i + 3] = 0
    } else if (dist < tolerance + 20) {
      // Soft edge — partial transparency for smooth edges
      const alpha = Math.round(((dist - tolerance) / 20) * 255)
      data[i + 3] = Math.min(data[i + 3], alpha)
    }
  }

  return imageData
}

/**
 * Resize image to fit within max dimensions while maintaining aspect ratio
 */
function resizeToFit(canvas, ctx, img, maxWidth, maxHeight) {
  let width = img.width
  let height = img.height

  // Calculate scale to fit within bounds
  const scale = Math.min(maxWidth / width, maxHeight / height, 1) // Never upscale

  width = Math.round(width * scale)
  height = Math.round(height * scale)

  canvas.width = width
  canvas.height = height

  // Use high-quality rendering
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  return { width, height }
}

/**
 * Auto-trim transparent pixels from edges to get tight crop
 */
function autoTrim(canvas, ctx) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data, width, height } = imageData

  let top = height, bottom = 0, left = width, right = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 10) { // Non-transparent pixel
        if (y < top) top = y
        if (y > bottom) bottom = y
        if (x < left) left = x
        if (x > right) right = x
      }
    }
  }

  // Add 4px padding
  const pad = 4
  top = Math.max(0, top - pad)
  bottom = Math.min(height - 1, bottom + pad)
  left = Math.max(0, left - pad)
  right = Math.min(width - 1, right + pad)

  const trimWidth = right - left + 1
  const trimHeight = bottom - top + 1

  if (trimWidth <= 0 || trimHeight <= 0) return // Nothing to trim

  const trimmedData = ctx.getImageData(left, top, trimWidth, trimHeight)

  canvas.width = trimWidth
  canvas.height = trimHeight
  ctx.putImageData(trimmedData, 0, 0)
}

/**
 * Process an image file:
 * 1. Resize to fit max dimensions
 * 2. Auto-detect and remove light background
 * 3. Auto-trim transparent edges
 * 4. Return as PNG Blob
 *
 * @param {File} file - Input image file
 * @param {'logo'|'signature'|'stamp'} type - Image type for sizing
 * @returns {Promise<{blob: Blob, previewUrl: string}>}
 */
export async function processImage(file, type = 'logo') {
  const img = await loadImage(file)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Determine max dimensions by type
  let maxW, maxH
  switch (type) {
    case 'signature':
      maxW = SIGNATURE_MAX_WIDTH
      maxH = SIGNATURE_MAX_HEIGHT
      break
    case 'stamp':
      maxW = STAMP_MAX_WIDTH
      maxH = STAMP_MAX_HEIGHT
      break
    case 'logo':
    default:
      maxW = LOGO_MAX_WIDTH
      maxH = LOGO_MAX_HEIGHT
      break
  }

  // Step 1: Resize
  resizeToFit(canvas, ctx, img, maxW, maxH)

  // Step 2: Detect and remove background
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const hasLightBg = detectLightBackground(imageData, canvas.width, canvas.height)

  if (hasLightBg) {
    const processed = removeBackground(imageData, canvas.width, canvas.height)
    ctx.putImageData(processed, 0, 0)

    // Step 3: Auto-trim transparent edges
    autoTrim(canvas, ctx)
  }

  // Step 4: Export as PNG blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const previewUrl = URL.createObjectURL(blob)
      resolve({ blob, previewUrl })
    }, 'image/png', 1.0)
  })
}
