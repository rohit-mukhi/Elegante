import { motion } from 'framer-motion'

interface NoResultsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NoResultsModal({ isOpen, onClose }: NoResultsModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-4xl">😔</span>
          </div>

          {/* Message */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Matches Found
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We couldn't find any dresses matching your search. Try a different query.
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full rounded-full bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 text-sm font-medium text-white transition hover:brightness-110"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    </div>
  )
}
