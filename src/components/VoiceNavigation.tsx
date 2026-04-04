import { useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useIntentionDetection } from '../hooks/useIntentionDetection'

interface VoiceNavigationProps {
  isEnabled: boolean
  transcript: string
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  onCategoryChange?: (category: string) => void
  onCameraStart?: () => void
  onCameraStop?: () => void
  onAnalyze?: () => void
  onTranscriptProcessed?: () => void
}

export function VoiceNavigation({ 
  isEnabled,
  transcript,
  isSupported,
  startListening,
  stopListening,
  onCategoryChange,
  onCameraStart,
  onCameraStop,
  onAnalyze,
  onTranscriptProcessed
}: VoiceNavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { detectIntention, isProcessing } = useIntentionDetection()
  const lastProcessedRef = useRef('')

  const handleVoiceCommand = useCallback(async (text: string) => {
    console.log('Voice command received:', text)
    
    const result = await detectIntention(text)
    
    if (!result) {
      console.log('No intention detected')
      return
    }

    console.log('Detected intention:', result.intent, 'Confidence:', result.confidence)

    // Execute action based on detected intention
    switch (result.intent) {
      // Navigation intents
      case 'navigate_home':
        navigate('/home')
        speak('Navigating to home page')
        break
      
      case 'navigate_mirror':
        navigate('/mirror')
        speak('Opening virtual try-on mirror')
        break
      
      case 'navigate_stylist':
        navigate('/stylist')
        speak('Opening AI stylist')
        break
      
      case 'navigate_profile':
        navigate('/profile')
        speak('Opening profile')
        break
      
      case 'navigate_back':
        window.history.back()
        speak('Going back')
        break
      
      // Category selection (only on home page)
      case 'select_category_mens':
        if (location.pathname === '/home' && onCategoryChange) {
          onCategoryChange('mens')
          speak('Showing mens collection')
        }
        break
      
      case 'select_category_womens':
        if (location.pathname === '/home' && onCategoryChange) {
          onCategoryChange('womens')
          speak('Showing womens collection')
        }
        break
      
      case 'select_category_kids':
        if (location.pathname === '/home' && onCategoryChange) {
          onCategoryChange('kids')
          speak('Showing kids collection')
        }
        break
      
      case 'select_category_ethnic':
        if (location.pathname === '/home' && onCategoryChange) {
          onCategoryChange('ethnic')
          speak('Showing ethnic collection')
        }
        break
      
      case 'select_category_casuals':
        if (location.pathname === '/home' && onCategoryChange) {
          onCategoryChange('casuals')
          speak('Showing casuals collection')
        }
        break
      
      case 'select_category_formal':
        if (location.pathname === '/home' && onCategoryChange) {
          onCategoryChange('formal')
          speak('Showing formal collection')
        }
        break
      
      case 'select_category_sports':
        if (location.pathname === '/home' && onCategoryChange) {
          onCategoryChange('sports')
          speak('Showing sports collection')
        }
        break
      
      // Camera controls (mirror and stylist pages)
      case 'camera_start':
        if ((location.pathname === '/mirror' || location.pathname === '/stylist') && onCameraStart) {
          onCameraStart()
          speak('Starting camera')
        }
        break
      
      case 'camera_stop':
        if ((location.pathname === '/mirror' || location.pathname === '/stylist') && onCameraStop) {
          onCameraStop()
          speak('Stopping camera')
        }
        break
      
      case 'analyze_features':
        if (location.pathname === '/stylist' && onAnalyze) {
          onAnalyze()
          speak('Analyzing your features')
        }
        break
      
      case 'show_help':
        speak('You can say commands like: go to mirror, show mens collection, start camera, analyze features, or go back')
        break
      
      default:
        console.log('Unknown intention:', result.intent)
    }
  }, [navigate, location, onCategoryChange, onCameraStart, onCameraStop, onAnalyze, detectIntention])

  // Text-to-speech feedback
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  // Start/stop listening based on isEnabled
  useEffect(() => {
    if (isEnabled && isSupported) {
      startListening()
    } else {
      stopListening()
    }
  }, [isEnabled, isSupported, startListening, stopListening])

  // Process transcript when it changes
  useEffect(() => {
    if (isEnabled && transcript && !isProcessing && transcript !== lastProcessedRef.current) {
      console.log('Processing transcript:', transcript)
      lastProcessedRef.current = transcript
      handleVoiceCommand(transcript).then(() => {
        if (onTranscriptProcessed) {
          onTranscriptProcessed()
        }
      })
    }
  }, [transcript, isProcessing, handleVoiceCommand, isEnabled, onTranscriptProcessed])

  return null // This component doesn't render anything, it just handles voice logic
}
