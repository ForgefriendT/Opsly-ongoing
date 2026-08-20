import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function CsvImportModal({ isOpen, onClose, onImportSuccess, currentPlan, clientId, handleUpgrade }) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState([])
  const [error, setError] = useState(null)
  const [importing, setImporting] = useState(false)

  if (!isOpen) return null

  const isFree = currentPlan === 'free'

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (isFree) return

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (isFree) return
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (file) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.')
      return
    }
    setFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const rows = parseCSV(text)
        if (rows.length === 0) {
          setError('No contacts found in the CSV file.')
          return
        }
        setParsedData(rows)
      } catch (err) {
        console.error(err)
        setError('Failed to parse CSV file. Please check its formatting.')
      }
    }
    reader.readAsText(file)
  }

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/)
    if (lines.length === 0) return []
    
    // Find headers
    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
    
    const results = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = []
      let current = ''
      let inQuotes = false
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      
      // Match headers case-insensitively
      const row = {
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        status: 'active'
      }

      rawHeaders.forEach((header, idx) => {
        const cleanHeader = header.toLowerCase()
        let val = values[idx] || ''
        val = val.replace(/^["']|["']$/g, '').trim()

        if (cleanHeader.includes('name')) {
          row.name = val
        } else if (cleanHeader.includes('email')) {
          row.email = val
        } else if (cleanHeader.includes('phone') || cleanHeader.includes('tel') || cleanHeader.includes('mobile')) {
          row.phone = val
        } else if (cleanHeader.includes('address') || cleanHeader.includes('location') || cleanHeader.includes('street')) {
          row.address = val
        } else if (cleanHeader.includes('note') || cleanHeader.includes('desc') || cleanHeader.includes('comment')) {
          row.notes = val
        } else if (cleanHeader.includes('status')) {
          row.status = val.toLowerCase() || 'active'
        }
      })

      if (row.name) {
        results.push(row)
      }
    }
    return results
  }

  const handleImport = async () => {
    if (isFree) return
    if (!clientId) {
      setError('Missing client context.')
      return
    }
    if (parsedData.length === 0) return

    setImporting(true)
    setError(null)

    try {
      const contactsToInsert = parsedData.map(contact => ({
        client_id: clientId,
        name: contact.name,
        email: contact.email || null,
        phone: contact.phone || null,
        address: contact.address || null,
        notes: contact.notes || null,
        status: ['active', 'lead', 'dormant'].includes(contact.status) ? contact.status : 'active'
      }))

      // Insert in chunks of 50 to prevent size limits
      const chunkSize = 50
      for (let i = 0; i < contactsToInsert.length; i += chunkSize) {
        const chunk = contactsToInsert.slice(i, i + chunkSize)
        const { error: insertError } = await supabase
          .from('contacts')
          .insert(chunk)

        if (insertError) throw insertError
      }

      // Success
      onImportSuccess(`Successfully imported ${contactsToInsert.length} contacts.`)
      resetModal()
    } catch (err) {
      console.error('Import failed:', err)
      setError(err.message || 'Database insert failed. Please check your data.')
    } finally {
      setImporting(false)
    }
  }

  const resetModal = () => {
    setFile(null)
    setParsedData([])
    setError(null)
    setDragActive(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetModal} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-opsly-card border border-opsly-border rounded-2xl w-full max-w-lg p-6 overflow-hidden relative shadow-2xl z-10"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-opsly-text">Import Contacts via CSV</h2>
          <button onClick={resetModal} className="p-1 rounded bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isFree ? (
          <div className="text-center py-6 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-opsly-accent/15 flex items-center justify-center mb-4 text-opsly-accent border border-opsly-accent/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-opsly-text mb-2">CSV Importer is Gated</h3>
            <p className="text-xs text-opsly-secondary max-w-sm mb-6 leading-relaxed">
              Paid plans include bulk contact importing. Upgrade your business portal to the Starter plan (or higher) to import your client list in seconds.
            </p>
            <button
              onClick={() => {
                handleUpgrade('starter')
                resetModal()
              }}
              className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text font-semibold py-2 px-5 rounded-lg text-xs cursor-pointer shadow-md"
            >
              Upgrade to Starter Plan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3.5 bg-opsly-error/10 border border-opsly-error/20 text-opsly-error rounded-xl text-xs flex gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive ? 'border-opsly-accent bg-opsly-accent-soft' : 'border-opsly-border bg-opsly-input/30 hover:bg-opsly-input/50'
                }`}
              >
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="csvFile" className="cursor-pointer block">
                  <div className="w-10 h-10 rounded-full bg-opsly-input border border-opsly-border flex items-center justify-center mx-auto mb-3 text-opsly-secondary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="text-xs text-opsly-text font-medium">Click to upload or drag &amp; drop</p>
                  <p className="text-[10px] text-opsly-muted mt-1">Accepts CSV files with headers (e.g. Name, Email, Phone, Address, Notes)</p>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-opsly-input/40 border border-opsly-border rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <svg className="w-5 h-5 text-opsly-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-opsly-text truncate">{file.name}</p>
                      <p className="text-[10px] text-opsly-muted">{(file.size / 1024).toFixed(1)} KB • {parsedData.length} records parsed</p>
                    </div>
                  </div>
                  <button onClick={() => { setFile(null); setParsedData([]); }} className="text-[10px] text-opsly-error hover:underline cursor-pointer">
                    Remove
                  </button>
                </div>

                {parsedData.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-opsly-secondary uppercase tracking-wider">Data Preview (First 3 rows)</p>
                    <div className="border border-opsly-border rounded-xl overflow-hidden bg-opsly-input/20">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-opsly-input/50 border-b border-opsly-border text-opsly-secondary font-medium">
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Email</th>
                            <th className="p-2.5">Phone</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-opsly-border text-opsly-text">
                          {parsedData.slice(0, 3).map((row, i) => (
                            <tr key={i}>
                              <td className="p-2.5 font-medium">{row.name}</td>
                              <td className="p-2.5 text-opsly-secondary">{row.email || '—'}</td>
                              <td className="p-2.5 text-opsly-secondary">{row.phone || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-3">
                  <button
                    onClick={() => { setFile(null); setParsedData([]); }}
                    disabled={importing}
                    className="px-4 py-2 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || parsedData.length === 0}
                    className="px-5 py-2 bg-opsly-accent hover:bg-opsly-accent-hover disabled:bg-opsly-accent/40 text-opsly-text rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {importing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-opsly-text" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Importing...
                      </>
                    ) : (
                      'Start Import'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
