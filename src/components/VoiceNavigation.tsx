import { useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useVoice } from '../contexts/VoiceContext'
import { useIntentDetection } from '../hooks/useIntentDetection'

interface VoiceNavigationProps {
  isEnabled: boolean
  onCategoryChange?: (category: string) => void
  onCameraStart?: () => void
  onCameraStop?: () => void
  onAnalyze?: () => void
}

export function VoiceNavigation({ 
  isEnabled,
  // onCategoryChange, // Not used with MiniLM intent detection
  onCameraStart,
  onCameraStop,
  onAnalyze
}: VoiceNavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { transcript, clearTranscript } = useVoice()
  const { initialize, detectIntent, isLoading, progress } = useIntentDetection()
  const lastProcessedRef = useRef('')
  const isInitializingRef = useRef(false)

  // Initialize MiniLM model when voice is enabled
  useEffect(() => {
    if (isEnabled && !isLoading && !isInitializingRef.current) {
      isInitializingRef.current = true
      initialize().then(() => {
        console.log('✅ MiniLM intent detection ready')
      })
    }
  }, [isEnabled, initialize, isLoading])

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.1
      utterance.pitch = 1.0
      utterance.volume = 0.7
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const executeIntent = useCallback((intent: string, confidence: number) => {
    console.log(`🎯 Executing intent: ${intent} (confidence: ${confidence.toFixed(2)})`)

    switch (intent) {
      case 'back':
        navigate(-1)
        speak('Going back')
        return true
      
      case 'home':
        navigate('/home')
        speak('Home')
        return true
      
      case 'open_mirror':
        navigate('/mirror')
        speak('Opening mirror')
        return true
      
      case 'open_stylist':
        navigate('/stylist')
        speak('Opening stylist')
        return true
      
      case 'start_camera':
        if (location.pathname === '/mirror' || location.pathname === '/stylist') {
          onCameraStart?.()
          speak('Starting camera')
          return true
        }
        break
      
      case 'stop_camera':
        if (location.pathname === '/mirror' || location.pathname === '/stylist') {
          onCameraStop?.()
          speak('Stopping camera')
          return true
        }
        break
      
      case 'analyze':
        if (location.pathname === '/stylist') {
          onAnalyze?.()
          speak('Analyzing your features')
          return true
        }
        break
      
      case 'search_outfit':
        // TODO: Extract keywords and send to backend
        console.log('🔍 Search outfit intent detected - backend integration needed')
        speak('Outfit search coming soon')
        return true
      
      default:
        console.log('❓ Unknown intent:', intent)
        return false
    }

    return false
  }, [navigate, location, onCameraStart, onCameraStop, onAnalyze, speak])

  const processCommand = useCallback(async (text: string) => {
    console.log('🎤 Voice input:', text)

    // Show loading state if model is still loading
    if (isLoading) {
      console.log('⏳ Model still loading...', progress.message)
      return false
    }

    // Detect intent using MiniLM
    const result = await detectIntent(text.toLowerCase().trim())
    
    if (!result) {
      console.log('❌ No intent detected')
      speak('Sorry, I did not understand that')
      return false
    }

    console.log(`✅ Intent detected: ${result.intent} (${(result.confidence * 100).toFixed(0)}% confident)`)
    
    // Execute the detected intent
    return executeIntent(result.intent, result.confidence)
  }, [detectIntent, executeIntent, isLoading, progress, speak])

  useEffect(() => {
    if (!isEnabled || !transcript || transcript.length < 3) return
    
    // Prevent duplicate processing
    if (transcript === lastProcessedRef.current) return
    
    lastProcessedRef.current = transcript
    
    // Process command asynchronously
    processCommand(transcript).then((processed) => {
      if (processed) {
        console.log('✅ Command executed successfully')
      } else {
        console.log('⚠️ Command not executed')
      }
    })
    
    // Clear after processing (with delay for intent detection)
    setTimeout(() => clearTranscript(), 1500)
  }, [transcript, isEnabled, processCommand, clearTranscript])

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return null
}
