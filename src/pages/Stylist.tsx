import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppearanceDetection } from '../hooks/useAppearanceDetection'
import { useColorRecommendation } from '../hooks/useColorRecommendation'
import { getColorRgba, expandColors } from '../utils/colorPalette'
import { VoiceNavigation } from '../components/VoiceNavigation'
import { VoiceIndicator } from '../components/VoiceIndicator'
import { useVoice } from '../contexts/VoiceContext'
import AOS from 'aos'
import 'aos/dist/aos.css'

export default function Stylist() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { isLoading, isAnalyzing, features, analyzeFeatures, dispose: disposeAppearance } = useAppearanceDetection(videoRef)
  const { getRecommendations } = useColorRecommendation()
  const [colorRecommendations, setColorRecommendations] = useState<string[] | null>(null)
  const { isVoiceEnabled, setIsVoiceEnabled, isListening, isSupported, transcript, startListening, stopListening, clearTranscript } = useVoice()

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setCameraActive(true)
    } catch (err) {
      console.error('Camera access denied:', err)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  useEffect(() => {
    AOS.init({ duration: 800, once: false, mirror: true })
    return () => {
      stopCamera()
      // Dispose models when component unmounts
      disposeAppearance()
    }
  }, [])

  useEffect(() => {
    // Automatically get color recommendations when features are analyzed
    if (features && !isAnalyzing) {
      handleGetRecommendations()
    }
  }, [features, isAnalyzing])

  const handleGetRecommendations = async () => {
    if (!features) {
      console.log('No features available')
      return
    }

    console.log('Features detected:', features)

    // Determine torso length based on measurements
    const torsoLength = 'Balanced' // Default, could be calculated from pose data

    console.log('Calling getRecommendations with:', {
      hairColor: features.hairColor,
      eyeColor: features.eyeColor,
      skinTone: features.skinTone,
      underTone: features.underTone,
      torsoLength,
      bodyType: features.bodyType
    })

    const recommendations = await getRecommendations(
      features.hairColor,
      features.eyeColor,
      features.skinTone,
      features.underTone,
      torsoLength,
      features.bodyType
    )

    console.log('Recommendations received:', recommendations)

    if (recommendations) {
      // Expand base colors into specific shades with randomization
      const expandedColors = expandColors(recommendations.topColors, 6)
      setColorRecommendations(expandedColors)
      console.log('Expanded colors set:', expandedColors)
    } else {
      console.log('No recommendations returned')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-violet-950 to-purple-900 text-zinc-50">
      {/* Voice Navigation */}
      <VoiceNavigation 
        isEnabled={isVoiceEnabled}
        transcript={transcript}
        isSupported={isSupported}
        startListening={startListening}
        stopListening={stopListening}
        clearTranscript={clearTranscript}
        onCameraStart={startCamera}
        onCameraStop={stopCamera}
        onAnalyze={analyzeFeatures}
      />
      
      {/* Voice Indicator */}
      {isVoiceEnabled && <VoiceIndicator isListening={isListening} isProcessing={isAnalyzing} />}
      
      <div className="mx-auto max-w-7xl px-6 py-8 pb-20">
        {/* Header */}
        <header className="relative flex items-center justify-between border-b border-violet-900/50 pb-6">
          <button onClick={() => navigate('/home')} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 via-gray-300 to-purple-600" />
            <span className="text-sm font-medium tracking-[0.3em] text-violet-50">ELEGANTE</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!isSupported) {
                  alert('Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.')
                  return
                }
                setIsVoiceEnabled(!isVoiceEnabled)
              }}
              disabled={!isSupported}
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isVoiceEnabled
                  ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                  : 'border-violet-500/70 bg-black/20 text-violet-50 hover:border-yellow-400 hover:text-yellow-400'
              }`}
              title={!isSupported ? 'Voice recognition not supported' : isVoiceEnabled ? 'Disable voice control' : 'Enable voice control'}
            >
              <span className="text-lg">{isVoiceEnabled ? '🎤' : '🔇'}</span>
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-500/70 bg-black/20 text-violet-50 transition hover:border-yellow-400 hover:text-yellow-400"
            >
              <span className="text-lg">{menuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-violet-900/70 bg-black/90 p-4 shadow-lg backdrop-blur-md">
              <p className="mb-3 text-sm text-violet-50/80">Welcome, Stylist</p>
              <button
                onClick={() => navigate('/profile')}
                className="w-full mb-2 rounded-full border border-violet-500/70 bg-black/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-violet-50 transition hover:border-yellow-400 hover:text-yellow-400"
              >
                Profile
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full rounded-full border border-violet-500/70 bg-black/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-violet-50 transition hover:border-yellow-400 hover:text-yellow-400"
              >
                Sign Out
              </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_400px]">
          {/* Camera/Preview Area */}
          <div data-aos="fade-right" className="rounded-2xl border border-violet-900/50 bg-black/35 p-4 backdrop-blur-md sm:p-6">
            <h2 className="mb-3 text-lg font-semibold text-violet-50 sm:mb-4 sm:text-xl">AI Style Analysis</h2>
            <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-gradient-to-b from-purple-900 via-violet-950 to-purple-950">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ transform: 'scaleX(-1)', display: cameraActive ? 'block' : 'none' }}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {isLoading && cameraActive && (
                <div className="absolute inset-0 flex h-full flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm z-10">
                  <div className="flex h-16 w-16 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
                  </div>
                  <p className="text-lg font-medium text-violet-50">Loading AI Models...</p>
                  <p className="text-sm text-violet-50/70">Preparing appearance analysis</p>
                </div>
              )}
              {isAnalyzing && cameraActive && !isLoading && (
                <div className="absolute inset-0 flex h-full flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm z-10">
                  <div className="flex h-16 w-16 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
                  </div>
                  <p className="text-lg font-medium text-violet-50">Analyzing Features...</p>
                  <p className="text-sm text-violet-50/70">Please hold still</p>
                </div>
              )}
              {!cameraActive && (
                <div className="absolute inset-0 flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400/20 to-purple-600/20">
                    <span className="text-4xl">✨</span>
                  </div>
                  <p className="text-lg text-violet-50">Start your camera for AI style analysis</p>
                  <button
                    onClick={startCamera}
                    className="rounded-full bg-gradient-to-r from-yellow-400 via-gray-300 to-purple-600 px-6 py-3 text-sm font-medium text-purple-950 transition hover:brightness-110"
                  >
                    Activate Camera
                  </button>
                </div>
              )}
            </div>
            {cameraActive && (
              <div className="mt-3 flex gap-2 sm:mt-4 sm:gap-3">
                <button
                  onClick={analyzeFeatures}
                  disabled={isLoading || isAnalyzing}
                  className="flex-1 rounded-full border border-violet-500/70 bg-black/20 px-3 py-2 text-xs font-medium text-violet-50 transition hover:border-yellow-400 hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed sm:px-4 sm:text-sm"
                >
                  {isLoading ? 'Loading Models...' : isAnalyzing ? 'Analyzing...' : 'Analyze Features'}
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 rounded-full border border-violet-500/70 bg-black/20 px-3 py-2 text-xs font-medium text-violet-50 transition hover:border-red-500 hover:text-red-400 sm:px-4 sm:text-sm"
                >
                  Stop Camera
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div data-aos="fade-left" className="space-y-6">
            {/* Appearance Features Card */}
            <div data-aos="fade-up" data-aos-delay="100" className="rounded-2xl border border-violet-900/50 bg-black/35 p-6 backdrop-blur-md">
              <h3 className="mb-4 text-lg font-semibold text-violet-50">Your Features</h3>
              {!cameraActive && (
                <p className="text-sm text-violet-50/50">Activate camera to analyze features</p>
              )}
              {cameraActive && isLoading && (
                <p className="text-sm text-violet-50/50">Loading models...</p>
              )}
              {cameraActive && !isLoading && !features && (
                <p className="text-sm text-violet-50/50">Click Analyze Features button</p>
              )}
              {cameraActive && features && (
                <div className="space-y-3">
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Hair Color</span>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border border-violet-500/50" style={{ backgroundColor: features.hairColorHex }} />
                      <span className="text-sm font-medium text-yellow-400">{features.hairColor}</span>
                    </div>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Eye Color</span>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border border-violet-500/50" style={{ backgroundColor: features.eyeColorHex }} />
                      <span className="text-sm font-medium text-yellow-400">{features.eyeColor}</span>
                    </div>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Skin Tone</span>
                    <span className="text-sm font-medium text-yellow-400">{features.skinTone}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Skin Undertone</span>
                    <span className="text-sm font-medium text-yellow-400">{features.underTone}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Body Type</span>
                    <span className="text-sm font-medium text-yellow-400">{features.bodyType}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Color Palette */}
            <div data-aos="fade-up" data-aos-delay="200" className="rounded-2xl border border-violet-900/50 bg-black/35 p-6 backdrop-blur-md">
              <h3 className="mb-3 text-lg font-semibold text-violet-50">Your Color Palette</h3>
              <p className="text-sm text-violet-50/70 mb-4">Colors that complement your features</p>
              {!colorRecommendations && (
                <p className="text-xs text-violet-50/50 mb-4">Analyze your features first to see recommendations</p>
              )}
              {colorRecommendations && colorRecommendations.length > 0 && (
                <div className="space-y-3">
                  {colorRecommendations.map((color, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg bg-black/30 p-3"
                    >
                      <div 
                        className="h-10 w-10 rounded-lg border border-violet-500/50 flex-shrink-0"
                        style={{ backgroundColor: getColorRgba(color) }}
                      />
                      <span className="text-sm font-medium text-yellow-400">{color}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
