import { createContext, useContext, useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'

interface VoiceContextType {
  isVoiceEnabled: boolean
  setIsVoiceEnabled: (enabled: boolean) => void
  isListening: boolean
  isSupported: boolean
  transcript: string
  clearTranscript: () => void
  lastProcessedTranscript: string
  setLastProcessedTranscript: (transcript: string) => void
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const lastProcessedRef = useRef('')
  const { isListening, isSupported, transcript, startListening, stopListening, clearTranscript } = useVoiceRecognition()

  const setLastProcessedTranscript = (transcript: string) => {
    lastProcessedRef.current = transcript
  }

  // Handle start/stop listening based on isVoiceEnabled
  useEffect(() => {
    if (isVoiceEnabled && isSupported) {
      console.log('🎤 Starting voice recognition from context')
      startListening()
    } else if (!isVoiceEnabled) {
      console.log('🔇 Stopping voice recognition from context')
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
        clearTranscript,
        lastProcessedTranscript: lastProcessedRef.current,
        setLastProcessedTranscript
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
