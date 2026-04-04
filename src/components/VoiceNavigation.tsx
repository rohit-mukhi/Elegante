import { useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  const { transcript, clearTranscript } = useVoice()
  const lastProcessedRef = useRef('')

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

  const processCommand = useCallback((text: string) => {
    const cmd = text.toLowerCase().trim()
    console.log('🎯 Processing:', cmd)

    // Navigation
    if (cmd.includes('home') || cmd.includes('homepage')) {
      navigate('/home')
      speak('Home')
      return true
    }
    
    if (cmd.includes('mirror') || cmd.includes('try on')) {
      navigate('/mirror')
      speak('Mirror')
      return true
    }
    
    if (cmd.includes('stylist') || cmd.includes('style') || cmd.includes('color')) {
      navigate('/stylist')
      speak('Stylist')
      return true
    }
    
    if (cmd.includes('back')) {
      navigate(-1)
      speak('Back')
      return true
    }

    // Categories (only on home page)
    if (location.pathname === '/home' && onCategoryChange) {
      if (cmd.includes('men') && !cmd.includes('women')) {
        onCategoryChange('mens')
        speak('Mens')
        return true
      }
      if (cmd.includes('women') || cmd.includes('ladies')) {
        onCategoryChange('womens')
        speak('Womens')
        return true
      }
      if (cmd.includes('kid') || cmd.includes('children')) {
        onCategoryChange('kids')
        speak('Kids')
        return true
      }
      if (cmd.includes('ethnic') || cmd.includes('traditional')) {
        onCategoryChange('ethnic')
        speak('Ethnic')
        return true
      }
      if (cmd.includes('casual')) {
        onCategoryChange('casuals')
        speak('Casuals')
        return true
      }
      if (cmd.includes('formal')) {
        onCategoryChange('formal')
        speak('Formal')
        return true
      }
      if (cmd.includes('sport')) {
        onCategoryChange('sports')
        speak('Sports')
        return true
      }
    }

    // Camera controls
    if ((location.pathname === '/mirror' || location.pathname === '/stylist')) {
      if ((cmd.includes('start') || cmd.includes('open') || cmd.includes('turn on')) && cmd.includes('camera')) {
        onCameraStart?.()
        speak('Starting camera')
        return true
      }
      if ((cmd.includes('stop') || cmd.includes('close')) && cmd.includes('camera')) {
        onCameraStop?.()
        speak('Stopping camera')
        return true
      }
    }

    // Analyze (stylist page only)
    if (location.pathname === '/stylist') {
      if (cmd.includes('analyze') || cmd.includes('scan') || cmd.includes('detect')) {
        onAnalyze?.()
        speak('Analyzing')
        return true
      }
    }

    // Help
    if (cmd.includes('help')) {
      speak('Say: go to mirror, show mens, start camera, or analyze')
      return true
    }

    return false
  }, [navigate, location, onCategoryChange, onCameraStart, onCameraStop, onAnalyze, speak])

  useEffect(() => {
    if (!isEnabled || !transcript || transcript.length < 3) return
    
    // Prevent duplicate processing
    if (transcript === lastProcessedRef.current) return
    
    lastProcessedRef.current = transcript
    const processed = processCommand(transcript)
    
    if (processed) {
      console.log('✅ Command executed')
    } else {
      console.log('❌ Command not recognized')
    }
    
    // Clear after processing
    setTimeout(() => clearTranscript(), 500)
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
