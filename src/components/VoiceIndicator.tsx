interface VoiceIndicatorProps {
  isListening: boolean
  isProcessing: boolean
}

export function VoiceIndicator({ isListening, isProcessing }: VoiceIndicatorProps) {
  if (!isListening && !isProcessing) {
    return null
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative">
        {/* Pulsing animation */}
        {isListening && (
          <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75"></div>
        )}
        
        {/* Main indicator */}
        <div className={`relative flex items-center gap-3 px-6 py-4 rounded-full backdrop-blur-md border-2 shadow-2xl transition-all ${
          isListening 
            ? 'bg-yellow-400/90 border-yellow-500 shadow-yellow-400/50' 
            : 'bg-purple-900/90 border-purple-500 shadow-purple-500/50'
        }`}>
          {/* Microphone icon */}
          <div className="relative">
            {isListening && (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-purple-950 rounded-full animate-pulse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-purple-950 rounded-full animate-pulse animation-delay-150"></div>
                </div>
              </>
            )}
            <span className="relative text-3xl">
              {isListening ? '🎤' : '⏳'}
            </span>
          </div>
          
          {/* Status text */}
          <div className="flex flex-col">
            <span className={`font-bold text-sm ${isListening ? 'text-purple-950' : 'text-yellow-400'}`}>
              {isListening ? 'Listening...' : 'Processing...'}
            </span>
            <span className={`text-xs ${isListening ? 'text-purple-900' : 'text-purple-300'}`}>
              {isListening ? 'Speak your command' : 'Analyzing intent'}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  )
}
