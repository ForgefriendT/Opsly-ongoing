import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function CustomerReviews({ currentPlan, currentClient, onShowUpgradeModal, onShowToast }) {
  const clientId = currentClient?.id
  const currencySymbol = currentClient?.currency_symbol || '$'
  const storageKey = `opsly_reviews_${clientId}`
  const settingsKey = `opsly_review_settings_${clientId}`

  const [reviews, setReviews] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [googleReviewLink, setGoogleReviewLink] = useState('')
  const [filterStars, setFilterStars] = useState(0) // 0 = all

  // Form states
  const [formName, setFormName] = useState('')
  const [formRating, setFormRating] = useState(5)
  const [formComment, setFormComment] = useState('')
  const [formSource, setFormSource] = useState('google')

  useEffect(() => {
    if (!clientId) return
    fetchReviews()
  }, [clientId])

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        const mapped = data.map(r => ({
          id: r.id,
          customerName: r.customer_name || r.name,
          rating: r.rating || 5,
          comment: r.comment || r.message,
          source: r.source || 'google',
          date: r.created_at || new Date().toISOString()
        }))
        setReviews(mapped)
        localStorage.setItem(storageKey, JSON.stringify(mapped))
      } else {
        const saved = JSON.parse(localStorage.getItem(storageKey)) || []
        setReviews(saved)
      }

      const settings = JSON.parse(localStorage.getItem(settingsKey)) || {}
      setGoogleReviewLink(settings.googleReviewLink || '')
    } catch {
      const saved = JSON.parse(localStorage.getItem(storageKey)) || []
      setReviews(saved)
    }
  }

  const saveReviews = (updated) => {
    setReviews(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const saveSettings = (link) => {
    setGoogleReviewLink(link)
    localStorage.setItem(settingsKey, JSON.stringify({ googleReviewLink: link }))
  }

  const handleAddReview = async () => {
    if (!formName.trim()) {
      onShowToast?.('Customer name is required.')
      return
    }
    const newReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      customerName: formName.trim(),
      rating: formRating,
      comment: formComment.trim(),
      source: formSource,
      date: new Date().toISOString(),
    }

    try {
      await supabase.from('reviews').insert({
        client_id: clientId,
        customer_name: formName.trim(),
        rating: formRating,
        comment: formComment.trim(),
        source: formSource
      })
    } catch (e) {
      console.warn('Supabase reviews save fallback:', e)
    }

    saveReviews([newReview, ...reviews])
    setFormName('')
    setFormRating(5)
    setFormComment('')
    setFormSource('google')
    setShowAddModal(false)
    onShowToast?.('Review added successfully!')
  }

  const handleDeleteReview = (id) => {
    saveReviews(reviews.filter(r => r.id !== id))
    onShowToast?.('Review removed.')
  }

  // Stats
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'
  const totalReviews = reviews.length
  const fiveStarCount = reviews.filter(r => r.rating === 5).length
  const fiveStarPercent = totalReviews > 0 ? ((fiveStarCount / totalReviews) * 100).toFixed(0) : 0

  const filtered = filterStars > 0 ? reviews.filter(r => r.rating === filterStars) : reviews

  const renderStars = (count, size = 'w-3.5 h-3.5') => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`${size} ${i <= count ? 'text-amber-400' : 'text-opsly-muted/30'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )

  const renderClickableStars = (current, setter) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => setter(i)}
          className="cursor-pointer focus:outline-none"
        >
          <svg className={`w-6 h-6 transition-colors ${i <= current ? 'text-amber-400' : 'text-opsly-muted/30 hover:text-amber-300/50'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return '' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-opsly-text tracking-tight">Customer Reviews</h1>
          <p className="text-xs text-opsly-secondary mt-1">Track feedback from your clients and request new reviews.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-opsly-accent/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
        >
          Add Review
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-opsly-card border border-opsly-border rounded-xl p-5">
          <span className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Average Rating</span>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl font-extrabold text-amber-400">{avgRating}</span>
            {renderStars(Math.round(Number(avgRating)), 'w-4 h-4')}
          </div>
        </div>
        <div className="bg-opsly-card border border-opsly-border rounded-xl p-5">
          <span className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Total Reviews</span>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-opsly-text">{totalReviews}</span>
            <p className="text-[10px] text-opsly-muted mt-1">{totalReviews === 0 ? 'No reviews yet' : 'Across all sources'}</p>
          </div>
        </div>
        <div className="bg-opsly-card border border-opsly-border rounded-xl p-5">
          <span className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">5-Star Rate</span>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-opsly-success">{fiveStarPercent}%</span>
            <div className="w-full bg-opsly-input rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="h-full bg-opsly-success transition-all" style={{ width: `${fiveStarPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Google Review Link Settings Card */}
      <div className="bg-opsly-card border border-opsly-border rounded-xl p-5">
        <h3 className="text-xs font-bold text-opsly-text uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-opsly-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Google Review Link
        </h3>
        <p className="text-[10px] text-opsly-muted mb-3">Paste your Google Business review link below. This link will be included in post-job review request emails sent to your clients.</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={googleReviewLink}
            onChange={(e) => setGoogleReviewLink(e.target.value)}
            placeholder="https://g.page/r/your-business/review"
            className="flex-1 bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
          />
          <button
            onClick={() => { saveSettings(googleReviewLink); onShowToast?.('Google Review link saved!') }}
            className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Filter:</span>
        {[0, 5, 4, 3, 2, 1].map(s => (
          <button
            key={s}
            onClick={() => setFilterStars(s)}
            className={`px-3 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${
              filterStars === s
                ? 'bg-opsly-accent text-opsly-text'
                : 'bg-opsly-input border border-opsly-border text-opsly-secondary hover:bg-opsly-hover'
            }`}
          >
            {s === 0 ? 'All' : `${s} Star${s !== 1 ? 's' : ''}`}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {filtered.length === 0 ? (
        <div className="bg-opsly-card border border-opsly-border rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-opsly-input border border-opsly-border flex items-center justify-center mb-4 text-opsly-muted">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-opsly-text">No reviews yet</h3>
          <p className="text-xs text-opsly-secondary max-w-xs mt-1.5 leading-relaxed">
            Add your first customer review manually or set up your Google Review link to start collecting feedback after completed jobs.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-opsly-card border border-opsly-border rounded-xl p-5 hover:border-opsly-accent/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-opsly-accent/30 to-opsly-accent/10 border border-opsly-border flex items-center justify-center text-xs font-bold text-opsly-accent uppercase">
                    {review.customerName.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-opsly-text">{review.customerName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {renderStars(review.rating)}
                      <span className="text-[10px] text-opsly-muted">{formatDate(review.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    review.source === 'google' ? 'bg-blue-950/20 text-blue-400 border border-blue-800/25' :
                    review.source === 'yelp' ? 'bg-red-950/20 text-red-400 border border-red-800/25' :
                    'bg-opsly-input text-opsly-secondary border border-opsly-border'
                  }`}>
                    {review.source}
                  </span>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="text-opsly-muted hover:text-opsly-error transition-colors cursor-pointer p-1"
                    title="Remove review"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              {review.comment && (
                <p className="text-xs text-opsly-secondary mt-3 leading-relaxed pl-12">"{review.comment}"</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Review Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0e0d]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1917] border border-[#2a2825] rounded-xl w-full max-w-md p-6 relative shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#2a2825]">
                <h3 className="text-sm font-bold text-opsly-text">Add Customer Review</h3>
                <button onClick={() => setShowAddModal(false)} className="text-opsly-muted hover:text-opsly-text cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Customer Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sarah Johnson"
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Rating</label>
                  {renderClickableStars(formRating, setFormRating)}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Source</label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                  >
                    <option value="google">Google</option>
                    <option value="yelp">Yelp</option>
                    <option value="facebook">Facebook</option>
                    <option value="direct">Direct / In-Person</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Comment (Optional)</label>
                  <textarea
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    rows={3}
                    placeholder="What did the customer say?"
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="border border-opsly-border bg-opsly-input text-opsly-secondary hover:bg-opsly-hover px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReview}
                  className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
