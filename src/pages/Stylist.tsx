import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppearanceDetection } from '../hooks/useAppearanceDetection'
// TODO: CNN - Will be used later with better dataset
// import { useColorRecommendation } from '../hooks/useColorRecommendation'
import { useBackendRecommendation } from '../hooks/useBackendRecommendation'
// TODO: CNN - Will be used later with better dataset
// import { getColorRgba } from '../utils/colorPalette'
// import { expandColors } from '../utils/colorPalette'
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
  const { isLoading, isAnalyzing, features, loadingProgress, analyzeFeatures, dispose: disposeAppearance } = useAppearanceDetection(videoRef)
  // TODO: CNN - Will be used later with better dataset
  // const { getRecommendations, isModelLoading, isRecommending, colorProgress } = useColorRecommendation()
  const { getRecommendations, loading: isRecommending, error: backendError } = useBackendRecommendation()
  const [colorRecommendations, setColorRecommendations] = useState<Array<{name: string, hex: string}> | null>(null)
  // const [debugInfo, setDebugInfo] = useState<string>('') // Disabled for production
  const { isVoiceEnabled, setIsVoiceEnabled, isSupported } = useVoice()

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

      // Log camera capabilities and settings
      const videoTrack = stream.getVideoTracks()[0]
      const capabilities = videoTrack.getCapabilities()
      const settings = videoTrack.getSettings()
      
      console.log('📷 Camera Capabilities:', capabilities)
      console.log('📷 Camera Settings:', settings)
      
      // Check if exposure control is available
      if (capabilities.exposureMode) {
        console.log('✅ Exposure modes available:', capabilities.exposureMode)
      }
      if (capabilities.exposureCompensation) {
        console.log('✅ Exposure compensation range:', capabilities.exposureCompensation)
      }
      if (capabilities.exposureTime) {
        console.log('✅ Exposure time range:', capabilities.exposureTime)
      }
      if (settings.exposureMode) {
        console.log('📊 Current exposure mode:', settings.exposureMode)
      }
      if (settings.exposureCompensation !== undefined) {
        console.log('📊 Current exposure compensation:', settings.exposureCompensation)
      }
      if (settings.exposureTime !== undefined) {
        console.log('📊 Current exposure time:', settings.exposureTime, 'μs')
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
      console.log('🎯 Features detected, triggering color recommendations...')
      console.log('Features:', features)
      handleGetRecommendations()
    }
  }, [features, isAnalyzing])

  const handleGetRecommendations = async () => {
    if (!features) {
      console.log('❌ No features available')
      return
    }

    console.log('✅ Features detected:', features)

    // Show loading state
    setColorRecommendations(null)

    try {
      // Call backend API with features
      const colors = await getRecommendations({
        hairColor: features.hairColor,
        eyeColor: features.eyeColor,
        skinTone: features.skinTone,
        underTone: features.underTone,
        bodyType: features.bodyType
      })

      console.log('🎨 Colors received from backend:', colors)

      if (colors && colors.length > 0) {
        setColorRecommendations(colors)
        console.log('✅ Color recommendations set successfully!')
      } else {
        console.error('❌ No colors returned from backend')
        alert('Failed to generate color recommendations. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error in handleGetRecommendations:', error)
      alert(`Error generating colors: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // TODO: CNN - Will be used later with better dataset
    // const torsoLength = 'Balanced' // Default, could be calculated from pose data
    // try {
    //   const recommendations = await getRecommendations(
    //     features.hairColor,
    //     features.eyeColor,
    //     features.skinTone,
    //     features.underTone,
    //     torsoLength,
    //     features.bodyType
    //   )
    //   if (recommendations) {
    //     const expandedColors = expandColors(recommendations.topColors, 6)
    //     if (expandedColors && expandedColors.length > 0) {
    //       setColorRecommendations(expandedColors)
    //     }
    //   }
    // } catch (error) {
    //   console.error('❌ Error with CNN model:', error)
    // }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-violet-950 to-purple-900 text-zinc-50">
      {/* Voice Navigation */}
      <VoiceNavigation 
        isEnabled={isVoiceEnabled}
        onCameraStart={startCamera}
        onCameraStop={stopCamera}
        onAnalyze={analyzeFeatures}
      />
      
      {/* Voice Indicator */}
      <VoiceIndicator />
      
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
                onClick={() => {
                  navigate('/profile')
                  setMenuOpen(false)
                }}
                className="w-full mb-2 rounded-full border border-violet-500/70 bg-black/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-violet-50 transition hover:border-yellow-400 hover:text-yellow-400"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  navigate('/add-dress')
                  setMenuOpen(false)
                }}
                className="w-full mb-2 rounded-full border border-violet-500/70 bg-black/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-violet-50 transition hover:border-yellow-400 hover:text-yellow-400"
              >
                Add Dress
              </button>
              <button
                onClick={() => {
                  navigate('/')
                  setMenuOpen(false)
                }}
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
              {(isLoading || isAnalyzing) && cameraActive && (
                <div className="absolute inset-0 flex h-full flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm z-10">
                  <div className="flex h-16 w-16 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
                  </div>
                  {loadingProgress.stage !== 'idle' && (
                    <>
                      <p className="text-lg font-medium text-violet-50">{loadingProgress.message}</p>
                      <div className="w-64 bg-black/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-400 to-purple-600 transition-all duration-300"
                          style={{ width: `${loadingProgress.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-violet-50/70">{loadingProgress.progress}%</p>
                    </>
                  )}
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
                  disabled={isLoading || isAnalyzing || isRecommending}
                  className="flex-1 rounded-full border border-violet-500/70 bg-black/20 px-3 py-2 text-xs font-medium text-violet-50 transition hover:border-yellow-400 hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed sm:px-4 sm:text-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
                      Loading Models...
                    </>
                  ) : isAnalyzing ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
                      Analyzing...
                    </>
                  ) : isRecommending ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
                      Getting Colors...
                    </>
                  ) : (
                    'Analyze Features'
                  )}
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
                <div>
                  <p className="text-sm text-violet-50/50 mb-3">Click Analyze Features button</p>
                  <div className="p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                    <p className="text-xs text-yellow-400">💡 Tip: For accurate body type detection, step back to show your full body from head to toe</p>
                  </div>
                </div>
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
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-yellow-400">{features.skinTone}</span>
                      <span className="text-xs text-violet-50/40">ITA: {features.skinToneITA.toFixed(1)}°</span>
                    </div>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Skin Undertone</span>
                    <span className="text-sm font-medium text-yellow-400">{features.underTone}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Body Type</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-yellow-400">{features.bodyType}</span>
                      {features.bodyType === 'Rectangle' && (
                        <span className="text-xs text-violet-50/50" title="Body not fully visible in frame">
                          (default)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Color Palette */}
            <div data-aos="fade-up" data-aos-delay="200" className="rounded-2xl border border-violet-900/50 bg-black/35 p-6 backdrop-blur-md">
              <h3 className="mb-3 text-lg font-semibold text-violet-50">Your Color Palette</h3>
              <p className="text-sm text-violet-50/70 mb-4">Colors that complement your features</p>
              
              {/* Debug Info - Removed for production */}
              {/* {debugInfo && (
                <div className="mb-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                  <p className="text-xs font-mono text-yellow-400">{debugInfo}</p>
                </div>
              )} */}
              
              {/* Backend Loading */}
              {isRecommending && (
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
                    <p className="text-xs text-violet-50/70">Getting color recommendations from AI...</p>
                  </div>
                </div>
              )}
              
              {/* Backend Error */}
              {backendError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-xs text-red-400">❌ {backendError}</p>
                </div>
              )}
              
              {!isRecommending && !colorRecommendations && (
                <p className="text-xs text-violet-50/50 mb-4">Analyze your features first to see recommendations</p>
              )}
              
              {!isRecommending && colorRecommendations && colorRecommendations.length > 0 && (
                <div className="space-y-3">
                  {colorRecommendations.map((color, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg bg-black/30 p-3 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div 
                        className="h-10 w-10 rounded-lg border border-violet-500/50 flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-sm font-medium text-yellow-400">{color.name}</span>
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

<style>{`
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
    opacity: 0;
  }
`}</style>
