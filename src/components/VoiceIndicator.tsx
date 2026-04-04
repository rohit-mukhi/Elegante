import { useVoice } from '../contexts/VoiceContext'

export function VoiceIndicator() {
  const { isVoiceEnabled, isListening, transcript } = useVoice()

  if (!isVoiceEnabled) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-black/90 backdrop-blur-md border border-yellow-400/50 rounded-full px-6 py-3 shadow-2xl">
        <div className="flex items-center gap-3">
          {/* Listening indicator */}
          <div className="relative">
            {isListening ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              </>
            ) : (
              <div className="w-3 h-3 bg-gray-500 rounded-full" />
            )}
          </div>

          {/* Status text */}
          <div className="text-sm">
            {transcript ? (
              <span className="text-yellow-400 font-medium">"{transcript}"</span>
            ) : isListening ? (
              <span className="text-white">Listening...</span>
            ) : (
              <span className="text-gray-400">Voice Ready</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
