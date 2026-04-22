import { motion } from 'framer-motion'
import type { DressItem } from '../contexts/SearchContext'

interface DressCardProps {
  dress: DressItem
  isSelected: boolean
  onClick: () => void
}

export function DressCard({ dress, isSelected, onClick }: DressCardProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full rounded-xl border p-4 text-left transition ${
        isSelected
          ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20'
          : 'border-violet-900/50 bg-black/20 hover:border-yellow-400/50'
      }`}
    >
      <div className="flex gap-3">
        {/* Color Preview */}
        <div 
          className="h-20 w-20 rounded-lg flex-shrink-0"
          style={{ backgroundColor: dress.metadata.color }}
        />
        
        {/* Dress Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-violet-50 truncate">{dress.name}</h4>
          <p className="text-xs text-violet-50/60 mt-1">{dress.category}</p>
          <p className="text-xs text-violet-50/50 mt-1">{dress.metadata.season}</p>
          {isSelected && (
            <p className="text-xs text-yellow-400 mt-2 font-medium">✓ Selected</p>
          )}
        </div>
      </div>
    </motion.button>
  )
}
