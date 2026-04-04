import { useState, useEffect, useRef, useCallback } from 'react'

interface VoiceRecognitionHook {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  isSupported: boolean
  clearTranscript: () => void
}

export function useVoiceRecognition(): VoiceRecognitionHook {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)
  const isListeningRef = useRef(false)
  const isStartingRef = useRef(false)
  const networkErrorCountRef = useRef(0)

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true  // Keep listening continuously
      recognition.interimResults = false  // Only process final results
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        console.log('Recognition started event fired')
        networkErrorCountRef.current = 0  // Reset error count on successful start
        isStartingRef.current = false
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1
        const transcript = event.results[last][0].transcript
        
        if (event.results[last].isFinal) {
          console.log('🎤 Final transcript:', transcript)
          setTranscript(transcript.trim())
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error, event)
        
        // Handle different error types
        switch (event.error) {
          case 'not-allowed':
            alert('Microphone access denied. Please allow microphone access in your browser settings.')
            isListeningRef.current = false
            isStartingRef.current = false
            setIsListening(false)
            break
          case 'no-speech':
            console.log('No speech detected, will auto-restart...')
            // Don't stop, let onend handle restart
            break
          case 'aborted':
            console.log('Recognition aborted - likely stopped manually')
            isStartingRef.current = false
            // Don't change listening state, let onend handle it
            break
          case 'audio-capture':
            alert('No microphone found. Please connect a microphone.')
            isListeningRef.current = false
            isStartingRef.current = false
            setIsListening(false)
            break
          case 'network':
            networkErrorCountRef.current += 1
            console.error('Network error - Speech recognition service unavailable')
            console.error('Attempt:', networkErrorCountRef.current)
            
            if (networkErrorCountRef.current === 1) {
              alert(
                '⚠️ Voice Recognition Network Error\n\n' +
                'Cannot connect to speech recognition service.\n\n' +
                'Possible causes:\n' +
                '• Network blocking Google Web Speech API\n' +
                '• No internet connection\n' +
                '• Firewall restrictions\n\n' +
                'Try:\n' +
                '• Mobile hotspot\n' +
                '• Different WiFi network\n' +
                '• VPN connection'
              )
            }
            
            isListeningRef.current = false
            isStartingRef.current = false
            setIsListening(false)
            break
          default:
            console.error('Unknown error:', event.error)
            isListeningRef.current = false
            isStartingRef.current = false
            setIsListening(false)
        }
      }

      recognition.onend = () => {
        console.log('🔊 Recognition ended, isListeningRef:', isListeningRef.current)
        
        if (isListeningRef.current && !isStartingRef.current) {
          // Auto-restart for continuous listening
          isStartingRef.current = true
          
          setTimeout(() => {
            if (isListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start()
                console.log('🔄 Recognition restarted')
              } catch (error: any) {
                console.error('Failed to restart:', error.message)
                isListeningRef.current = false
                isStartingRef.current = false
                setIsListening(false)
              }
            }
          }, 300)
        } else {
          setIsListening(false)
        }
      }

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
      console.warn('Speech recognition not supported in this browser')
    }

    return () => {
      if (recognitionRef.current) {
        isListeningRef.current = false
        try {
          recognitionRef.current.stop()
        } catch (error) {
          // Ignore errors on cleanup
        }
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.log('Recognition not initialized')
      return
    }
    
    if (isListeningRef.current || isStartingRef.current) {
      console.log('Recognition already running or starting')
      return
    }
    
    setTranscript('')
    try {
      isListeningRef.current = true
      isStartingRef.current = true
      recognitionRef.current.start()
      console.log('Voice recognition start initiated')
    } catch (error: any) {
      console.error('Failed to start recognition:', error)
      isListeningRef.current = false
      isStartingRef.current = false
      setIsListening(false)
      alert(`Failed to start voice recognition: ${error.message || error}`)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        console.log('Stopping voice recognition...')
        isListeningRef.current = false
        isStartingRef.current = false
        recognitionRef.current.stop()
        setIsListening(false)
        setTranscript('')
        console.log('Voice recognition stop initiated')
      } catch (error) {
        console.error('Failed to stop recognition:', error)
      }
    }
  }, [])

  const clearTranscript = useCallback(() => {
    console.log('Clearing transcript for next command')
    setTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
    clearTranscript
  }
}
