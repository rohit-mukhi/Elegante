import { useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useIntentionDetection } from '../hooks/useIntentionDetection'
import { useVoice } from '../contexts/VoiceContext'

interface VoiceNavigationProps {
  isEnabled: boolean
  onCategoryChange?: (category: string) => void
  onCameraStart?: () => void
  onCameraStop?: () => void
  onAnalyze?: () => void
}

export function VoiceNavigation({ 
  isEnabled,
  onCategoryChange,
  onCameraStart,
  onCameraStop,
  onAnalyze
}: VoiceNavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { detectIntention, isProcessing } = useIntentionDetection()
  const { transcript, clearTranscript, lastProcessedTranscript, setLastProcessedTranscript } = useVoice()
  const processingRef = useRef(false)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

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
        console.log('Going back to previous page')
        navigate(-1)
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

  // Text-to-speech feedback (only speak once)
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 0.8
      speechRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  // Process transcript when it changes
  useEffect(() => {
    if (!isEnabled || !transcript || isProcessing || processingRef.current) return
    
    // Skip if already processed
    if (transcript === lastProcessedTranscript) {
      return
    }
    
    // Skip empty or very short transcripts
    if (transcript.trim().length < 3) {
      return
    }
    
    console.log('🎤 New command:', transcript)
    
    // Mark as processing immediately
    processingRef.current = true
    setLastProcessedTranscript(transcript)
    
    // Process the command
    handleVoiceCommand(transcript)
      .then(() => {
        console.log('✅ Done')
      })
      .catch((error) => {
        console.error('❌ Error:', error)
      })
      .finally(() => {
        // Clear and reset after delay
        setTimeout(() => {
          clearTranscript()
          processingRef.current = false
          console.log('📤 Ready for next command')
        }, 2000)
      })
  }, [transcript, isEnabled, isProcessing, lastProcessedTranscript, handleVoiceCommand, clearTranscript, setLastProcessedTranscript])

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return null // This component doesn't render anything, it just handles voice logic
}
