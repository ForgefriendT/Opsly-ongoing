import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { processImage } from '../../lib/imageProcessor'

export default function Step1LogoUpload({ clientId, onComplete }) {
  const [logoProcessed, setLogoProcessed] = useState(null) // { blob, previewUrl }
  const [logoOriginalPreview, setLogoOriginalPreview] = useState(null)
  const [signatureProcessed, setSignatureProcessed] = useState(null)
  const [signatureOriginalPreview, setSignatureOriginalPreview] = useState(null)
  const [stampProcessed, setStampProcessed] = useState(null)
  const [stampOriginalPreview, setStampOriginalPreview] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [processingLabel, setProcessingLabel] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const logoRef = useRef(null)
  const signatureRef = useRef(null)
  const stampRef = useRef(null)

  const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

  const handleFile = async (file, type) => {
    if (!file) return

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setError('Please upload a PNG or JPG image.')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be under 2MB.')
      return
    }

    setError('')
    setProcessing(true)
    setProcessingLabel(type === 'logo' ? 'Processing logo...' : type === 'signature' ? 'Processing signature...' : 'Processing stamp...')

    try {
      // Store original preview
      const originalUrl = URL.createObjectURL(file)

      // Process: resize + background removal + trim
      const result = await processImage(file, type)

      if (type === 'logo') {
        setLogoOriginalPreview(originalUrl)
        setLogoProcessed(result)
      } else if (type === 'signature') {
        setSignatureOriginalPreview(originalUrl)
        setSignatureProcessed(result)
      } else if (type === 'stamp') {
        setStampOriginalPreview(originalUrl)
        setStampProcessed(result)
      }
    } catch (err) {
      console.error('Image processing failed:', err)
      setError('Could not process that image. Please try a different file.')
    } finally {
      setProcessing(false)
      setProcessingLabel('')
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0], 'logo')
    }
  }

  const clearFile = (type) => {
    if (type === 'logo') {
      if (logoOriginalPreview) URL.revokeObjectURL(logoOriginalPreview)
      if (logoProcessed?.previewUrl) URL.revokeObjectURL(logoProcessed.previewUrl)
      setLogoProcessed(null)
      setLogoOriginalPreview(null)
    } else if (type === 'signature') {
      if (signatureOriginalPreview) URL.revokeObjectURL(signatureOriginalPreview)
      if (signatureProcessed?.previewUrl) URL.revokeObjectURL(signatureProcessed.previewUrl)
      setSignatureProcessed(null)
      setSignatureOriginalPreview(null)
    } else {
      if (stampOriginalPreview) URL.revokeObjectURL(stampOriginalPreview)
      if (stampProcessed?.previewUrl) URL.revokeObjectURL(stampProcessed.previewUrl)
      setStampProcessed(null)
      setStampOriginalPreview(null)
    }
  }

  const uploadBlob = async (blob, path) => {
    const { error: uploadErr } = await supabase.storage
      .from('client-assets')
      .upload(path, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      })
    if (uploadErr) throw uploadErr

    const { data: urlData } = supabase.storage
      .from('client-assets')
      .getPublicUrl(path)

    return urlData.publicUrl
  }

  const handleSubmit = async () => {
    if (!logoProcessed) {
      setError('Please upload your business logo to continue.')
      return
    }

    setUploading(true)
    setError('')

    try {
      const updates = {}
      const fileId = crypto.randomUUID()

      // Upload processed logo PNG
      const logoPath = `${clientId}/${fileId}-logo.png`
      updates.logo_url = await uploadBlob(logoProcessed.blob, logoPath)

      // Upload processed signature PNG (optional)
      if (signatureProcessed) {
        const sigPath = `${clientId}/${fileId}-signature.png`
        updates.signature_url = await uploadBlob(signatureProcessed.blob, sigPath)
      }

      // Upload processed stamp PNG (optional)
      if (stampProcessed) {
        const stampPath = `${clientId}/${fileId}-stamp.png`
        updates.stamp_url = await uploadBlob(stampProcessed.blob, stampPath)
      }

      // Update client record
      updates.onboarding_step_completed = 2
      const { error: updateErr } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)

      if (updateErr) throw updateErr

      onComplete(updates)
    } catch (err) {
      console.error('Upload failed:', err)
      setError('Something went wrong uploading your files. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const UploadZone = ({ label, type, processedData, originalPreview, inputRef, isRequired }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-opsly-secondary uppercase tracking-wider">
          {label}
        </span>
        {isRequired ? (
          <span className="text-[10px] font-medium text-opsly-accent bg-opsly-accent-soft px-1.5 py-0.5 rounded">Required</span>
        ) : (
          <span className="text-[10px] font-medium text-opsly-muted">Optional</span>
        )}
      </div>

      {processedData ? (
        <div className="relative group">
          {/* Processed result on checkerboard background */}
          <div
            className="w-full h-28 rounded-xl flex items-center justify-center overflow-hidden border border-opsly-border"
            style={{
              backgroundImage: 'linear-gradient(45deg, #2a2a27 25%, transparent 25%), linear-gradient(-45deg, #2a2a27 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a27 75%), linear-gradient(-45deg, transparent 75%, #2a2a27 75%)',
              backgroundSize: '12px 12px',
              backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
              backgroundColor: '#1e1e1c'
            }}
          >
            <img src={processedData.previewUrl} alt={label} className="max-h-24 max-w-[90%] object-contain" />
          </div>

          {/* Badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-opsly-success/90 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            BG removed &amp; resized
          </div>

          {/* Remove button */}
          <button
            onClick={() => clearFile(type)}
            className="absolute top-2 right-2 w-6 h-6 bg-opsly-error/80 hover:bg-opsly-error text-white rounded-full flex items-center justify-center text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className={`w-full h-28 border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 group ${
            dragActive && type === 'logo'
              ? 'bg-opsly-accent-soft border-opsly-accent'
              : 'bg-opsly-input border-opsly-border hover:border-opsly-accent/50'
          } ${processing ? 'opacity-60 cursor-wait' : ''}`}
        >
          {processing && processingLabel.includes(type) ? (
            <>
              <span className="w-5 h-5 border-2 border-opsly-accent border-t-transparent rounded-full animate-spin"></span>
              <span className="text-xs text-opsly-accent font-medium">Removing background...</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6 text-opsly-muted group-hover:text-opsly-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-opsly-muted group-hover:text-opsly-secondary transition-colors">
                {type === 'logo' ? 'Drop PNG or JPG here, or click to browse' : 'Click to upload'}
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0], type)
          e.target.value = '' // Reset so same file can be re-selected
        }}
      />
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-opsly-text tracking-tight">Upload Your Brand</h2>
        <p className="text-xs text-opsly-secondary mt-1.5">
          Your logo appears on invoices, estimates, and contracts. We'll auto-remove backgrounds and resize for you.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-lg bg-opsly-error/15 border border-opsly-error/30 text-opsly-error text-xs font-medium text-center"
        >
          {error}
        </motion.div>
      )}

      {/* Logo Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadZone
          label="Business Logo"
          type="logo"
          processedData={logoProcessed}
          originalPreview={logoOriginalPreview}
          inputRef={logoRef}
          isRequired={true}
        />
      </div>

      {/* Signature & Stamp side by side */}
      <div className="grid grid-cols-2 gap-4">
        <UploadZone
          label="Signature"
          type="signature"
          processedData={signatureProcessed}
          originalPreview={signatureOriginalPreview}
          inputRef={signatureRef}
          isRequired={false}
        />
        <UploadZone
          label="Stamp"
          type="stamp"
          processedData={stampProcessed}
          originalPreview={stampOriginalPreview}
          inputRef={stampRef}
          isRequired={false}
        />
      </div>

      <p className="text-[10px] text-opsly-muted text-center leading-relaxed">
        White and light backgrounds are automatically removed. Images are resized to fit invoices perfectly.
      </p>

      <motion.button
        onClick={handleSubmit}
        disabled={uploading || processing}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text font-medium py-3 px-4 rounded-lg text-sm shadow-md cursor-pointer transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            Uploading...
          </>
        ) : (
          'Continue'
        )}
      </motion.button>
    </motion.div>
  )
}
