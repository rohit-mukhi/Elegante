import { createContext, useContext, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'

interface VoiceContextType {
  isVoiceEnabled: boolean
  setIsVoiceEnabled: (enabled: boolean) => void
  isListening: boolean
  isSupported: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
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

  return (
    <VoiceContext.Provider
      value={{
        isVoiceEnabled,
        setIsVoiceEnabled,
        isListening,
        isSupported,
        transcript,
        startListening,
        stopListening,
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
