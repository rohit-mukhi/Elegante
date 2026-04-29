import { useEffect, useCallback, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useVoice } from '../contexts/VoiceContext'
import { useSearch } from '../contexts/SearchContext'
import { useIntentDetection } from '../hooks/useIntentDetection'
import { useFashionSearch } from '../hooks/useFashionSearch'

interface VoiceNavigationProps {
  isEnabled: boolean
  onCameraStart?: () => void
  onCameraStop?: () => void
  onAnalyze?: () => void
}

export function VoiceNavigation({ 
  isEnabled,
  onCameraStart,
  onCameraStop,
  onAnalyze
}: VoiceNavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { transcript, clearTranscript } = useVoice()
  const { setSearchResults, setIsSearching, searchResults, selectedDress, setSelectedDress, setShowNoResults, setPendingSearch, pendingSearch } = useSearch()
  const { initialize, detectIntent, generateEmbedding, isLoading, progress } = useIntentDetection()
  const { search } = useFashionSearch()
  const lastProcessedRef = useRef('')
  const isInitializingRef = useRef(false)
  const [awaitingPermission, setAwaitingPermission] = useState(false)

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

  const extractSearchQuery = useCallback((transcript: string): string => {
    const commandWords = ['show me', 'find', 'search', 'look for', 'get me', 'i want', 'i need']
    let query = transcript.toLowerCase()
    
    for (const cmd of commandWords) {
      query = query.replace(cmd, '')
    }
    
    return query.trim()
  }, [])

  const executeIntent = useCallback((intent: string, confidence: number, transcript: string) => {
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
        const searchQuery = extractSearchQuery(transcript)
        console.log('🔍 Original transcript:', transcript)
        console.log('🔍 Extracted search query:', searchQuery)
        
        setShowNoResults(false)
        
        generateEmbedding(searchQuery).then(async (embedding) => {
          if (embedding) {
            console.log('🔍 Generated embedding')
            
            // Store pending search
            setPendingSearch({ query: searchQuery, embedding })
            setAwaitingPermission(true)
            
            // Ask for permission to analyze features
            speak('Would you like me to analyze your features for personalized recommendations? Say yes or no')
          } else {
            setShowNoResults(true)
            speak('Failed to generate search')
          }
        })
        return true
      
      case 'try_dress':
        if (location.pathname === '/mirror' && searchResults.length > 0) {
          const dressName = transcript.toLowerCase()
          const foundDress = searchResults.find(dress => 
            dressName.includes(dress.name.toLowerCase())
          )
          
          if (foundDress) {
            setSelectedDress(foundDress)
            speak(`Trying ${foundDress.name}`)
            return true
          } else {
            speak('Dress not found')
          }
        }
        break
      
      case 'next_dress':
        if (location.pathname === '/mirror' && searchResults.length > 0) {
          const currentIndex = selectedDress 
            ? searchResults.findIndex(d => d._id === selectedDress._id)
            : -1
          const nextIndex = (currentIndex + 1) % searchResults.length
          setSelectedDress(searchResults[nextIndex])
          speak(`Showing ${searchResults[nextIndex].name}`)
          return true
        }
        break
      
      case 'previous_dress':
        if (location.pathname === '/mirror' && searchResults.length > 0) {
          const currentIndex = selectedDress 
            ? searchResults.findIndex(d => d._id === selectedDress._id)
            : -1
          const prevIndex = currentIndex <= 0 ? searchResults.length - 1 : currentIndex - 1
          setSelectedDress(searchResults[prevIndex])
          speak(`Showing ${searchResults[prevIndex].name}`)
          return true
        }
        break
      
      case 'permission_yes':
        if (awaitingPermission && pendingSearch) {
          console.log('✅ User granted permission for feature analysis')
          setAwaitingPermission(false)
          speak('Great! Starting camera and analyzing your features')
          
          // Navigate to stylist if not already there
          if (location.pathname !== '/stylist') {
            navigate('/stylist')
          }
          
          // Wait for navigation and then trigger camera + analysis
          setTimeout(() => {
            onCameraStart?.()
            
            // Wait for camera initialization
            setTimeout(() => {
              onAnalyze?.()
            }, 2000)
          }, location.pathname !== '/stylist' ? 500 : 100)
          
          return true
        }
        break
      
      case 'permission_no':
        if (awaitingPermission && pendingSearch) {
          console.log('❌ User declined feature analysis')
          setAwaitingPermission(false)
          speak('No problem! Searching without personalization')
          
          // Proceed with search without features
          setIsSearching(true)
          search(pendingSearch.embedding).then((result) => {
            setIsSearching(false)
            
            if (result.success && result.items.length > 0) {
              console.log(`✅ Found ${result.items.length} items`)
              setSearchResults(result.items)
              speak(`Found ${result.items.length} dresses`)
              navigate('/mirror')
            } else {
              console.log('❌ No items found')
              setShowNoResults(true)
              speak('No dresses found')
            }
          })
          
          setPendingSearch(null)
          return true
        }
        break
      
      default:
        console.log('❓ Unknown intent:', intent)
        return false
    }

    return false
  }, [navigate, location, onCameraStart, onCameraStop, onAnalyze, speak, extractSearchQuery, generateEmbedding, search, setSearchResults, setIsSearching, searchResults, selectedDress, setSelectedDress, setShowNoResults, transcript])

  const processCommand = useCallback(async (text: string) => {
    console.log('🎤 Voice input:', text)

    if (isLoading) {
      console.log('⏳ Model still loading...', progress.message)
      return false
    }

    const result = await detectIntent(text.toLowerCase().trim())
    
    if (!result) {
      console.log('❌ No intent detected')
      speak('Sorry, I did not understand that')
      return false
    }

    console.log(`✅ Intent detected: ${result.intent} (${(result.confidence * 100).toFixed(0)}% confident)`)
    
    return executeIntent(result.intent, result.confidence, text)
  }, [detectIntent, executeIntent, isLoading, progress, speak])

  useEffect(() => {
    if (!isEnabled || !transcript || transcript.length < 3) return
    
    if (transcript === lastProcessedRef.current) return
    
    lastProcessedRef.current = transcript
    
    processCommand(transcript).then((processed) => {
      if (processed) {
        console.log('✅ Command executed successfully')
      } else {
        console.log('⚠️ Command not executed')
      }
    })
    
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
