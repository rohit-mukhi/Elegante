import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'

interface VoiceContextType {
  isVoiceEnabled: boolean
  setIsVoiceEnabled: (enabled: boolean) => void
  isListening: boolean
  isSupported: boolean
  transcript: string
  clearTranscript: () => void
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const { isListening, isSupported, transcript, startListening, stopListening, clearTranscript } = useVoiceRecognition()

  useEffect(() => {
    if (isVoiceEnabled && isSupported) {
      console.log('🎤 Voice enabled')
      startListening()
    } else if (!isVoiceEnabled) {
      console.log('🔇 Voice disabled')
      stopListening()
    }
  }, [isVoiceEnabled, isSupported, startListening, stopListening])

  return (
    <VoiceContext.Provider
      value={{
        isVoiceEnabled,
        setIsVoiceEnabled,
        isListening,
        isSupported,
        transcript,
        clearTranscript
      }}
    >
      {children}
    </VoiceContext.Provider>
  )
}

export function useVoice() {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoice must be used within VoiceProvider')
  }
  return context
}
