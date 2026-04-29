import type { GeneratedOutfit } from '../hooks/useOutfitGenerator'

interface OutfitCardProps {
  outfit: GeneratedOutfit
  index: number
  onTryOutfit: (outfit: GeneratedOutfit) => void
}

export function OutfitCard({ outfit, index, onTryOutfit }: OutfitCardProps) {
  const { combination, topItems, bottomItems } = outfit

  return (
    <div 
      className="rounded-xl border border-violet-900/50 bg-black/30 p-4 backdrop-blur-sm hover:border-yellow-400/50 transition"
      data-aos="fade-up"
      data-aos-delay={index * 100}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-violet-50">Outfit {index + 1}</h4>
        <div className="flex gap-2">
          <span className="rounded-full bg-purple-600/30 px-2 py-1 text-xs text-purple-200">
            {combination.occasion}
          </span>
          <span className="rounded-full bg-blue-600/30 px-2 py-1 text-xs text-blue-200">
            {combination.season}
          </span>
        </div>
      </div>

      {/* Combination Description */}
      <div className="mb-3 rounded-lg bg-black/40 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="h-4 w-4 rounded-full border border-violet-500/50"
            style={{ backgroundColor: topItems[0]?.metadata?.color || combination.top.color }}
          />
          <span className="text-xs text-violet-50/80">
            {combination.top.color} {combination.top.item}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="h-4 w-4 rounded-full border border-violet-500/50"
            style={{ backgroundColor: bottomItems[0]?.metadata?.color || combination.bottom.color }}
          />
          <span className="text-xs text-violet-50/80">
            {combination.bottom.color} {combination.bottom.item}
          </span>
        </div>
      </div>

      {/* Score & Reason */}
      <div className="mb-3 rounded-lg bg-yellow-400/10 border border-yellow-400/30 p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-yellow-400 font-medium">Fashion Score</span>
          <span className="text-xs text-yellow-400 font-bold">{combination.score}/10</span>
        </div>
        <p className="text-xs text-violet-50/70">{combination.reason}</p>
      </div>

      {/* Items Preview */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        {/* Top Item */}
        <div className="rounded-lg bg-black/40 p-2">
          <p className="text-xs text-violet-50/60 mb-1">Top</p>
          {topItems[0] ? (
            <div>
              <div className="aspect-square rounded bg-gradient-to-br from-purple-900 to-purple-950 mb-1 flex items-center justify-center text-2xl">
                👔
              </div>
              <p className="text-xs text-violet-50 truncate">{topItems[0].name}</p>
            </div>
          ) : (
            <div className="aspect-square rounded bg-black/60 flex items-center justify-center">
              <span className="text-xs text-violet-50/40">No items</span>
            </div>
          )}
        </div>

        {/* Bottom Item */}
        <div className="rounded-lg bg-black/40 p-2">
          <p className="text-xs text-violet-50/60 mb-1">Bottom</p>
          {bottomItems[0] ? (
            <div>
              <div className="aspect-square rounded bg-gradient-to-br from-purple-900 to-purple-950 mb-1 flex items-center justify-center text-2xl">
                👖
              </div>
              <p className="text-xs text-violet-50 truncate">{bottomItems[0].name}</p>
            </div>
          ) : (
            <div className="aspect-square rounded bg-black/60 flex items-center justify-center">
              <span className="text-xs text-violet-50/40">No items</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onTryOutfit(outfit)}
        className="w-full rounded-full bg-gradient-to-r from-yellow-400 via-gray-300 to-purple-600 px-4 py-2 text-xs font-medium text-purple-950 transition hover:brightness-110"
      >
        Try This Outfit
      </button>
    </div>
  )
}
