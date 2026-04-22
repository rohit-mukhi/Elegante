import { motion } from 'framer-motion'

interface LoadingModalProps {
  isOpen: boolean
  message?: string
}

export function LoadingModal({ isOpen, message = 'Searching for dresses...' }: LoadingModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="relative w-16 h-16">
            <motion.div
              className="absolute inset-0 border-4 border-purple-200 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Message */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {message}
            </h3>
            <p className="text-sm text-gray-500">
              Please wait a moment...
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
