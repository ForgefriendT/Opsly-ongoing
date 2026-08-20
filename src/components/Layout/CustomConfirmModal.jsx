import { motion } from 'framer-motion'

export default function CustomConfirmModal({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, isDanger = false }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0e0d]/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-opsly-card border border-opsly-border rounded-xl shadow-2xl p-5 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
            isDanger 
              ? 'bg-red-950/20 text-red-400 border-red-800/20' 
              : 'bg-opsly-accent-soft text-opsly-accent border-opsly-accent/20'
          }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isDanger ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-opsly-text">{title}</h3>
            <p className="text-xs text-opsly-secondary mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] duration-150"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] duration-150 ${
              isDanger 
                ? 'bg-red-650 hover:bg-red-750 text-white shadow-lg shadow-red-500/10' 
                : 'bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text shadow-lg shadow-opsly-accent/10'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
