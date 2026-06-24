import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMediaPipePose } from '../hooks/useMediaPipePose'
import { VoiceNavigation } from '../components/VoiceNavigation'
import { VoiceIndicator } from '../components/VoiceIndicator'
import { LoadingModal } from '../components/LoadingModal'
import { NoResultsModal } from '../components/NoResultsModal'
import { DressCard } from '../components/DressCard'
import { useVoice } from '../contexts/VoiceContext'
import { useSearch } from '../contexts/SearchContext'
import { useDeviceCapability } from '../contexts/DeviceCapabilityContext'
import AOS from 'aos'
import 'aos/dist/aos.css'

export default function Mirror() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { tier, isDetecting } = useDeviceCapability()
  const { isLoading: poseLoading, modelTier, measurements, startDetection, stopDetection, dispose: disposePose } = useMediaPipePose(videoRef, tier)
  const { isVoiceEnabled, setIsVoiceEnabled, isSupported } = useVoice()
  const { searchResults, selectedDress, setSelectedDress, isSearching, showNoResults, setShowNoResults } = useSearch()

  const outfits = [
    { name: 'Classic Shirt', icon: '👔', color: 'Blue' },
    { name: 'Denim Jacket', icon: '🧥', color: 'Indigo' },
    { name: 'Casual Tee', icon: '👕', color: 'White' },
    { name: 'Formal Blazer', icon: '🎩', color: 'Black' }
  ]

  const handleDressSelect = (dress: typeof searchResults[0]) => {
    setSelectedDress(dress)
    console.log('Selected dress:', dress.name)
    console.log('3D Model URL:', dress.cloudinaryUrl)
    // TODO: Load 3D model from dress.cloudinaryUrl
  }

  const startCamera = async () => {
    // Wait for device benchmark to complete before loading the model
    // so the correct model (full/lite) is selected, not the unknown default
    if (isDetecting) {
      console.log('⏳ Waiting for device benchmark to complete...')
      return
    }

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
        videoRef.current.onloadedmetadata = async () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
            console.log('Starting detection with canvas:', canvasRef.current.width, canvasRef.current.height)
            await startDetection(canvasRef.current)
          }
        }
      }

      setCameraActive(true)
    } catch (err) {
      console.error('Camera access denied:', err)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    stopDetection()
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
      disposePose()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-violet-950 to-purple-900 text-zinc-50">
      {/* Loading Modal */}
      <LoadingModal isOpen={isSearching} message="Searching for dresses..." />
      
      {/* No Results Modal */}
      <NoResultsModal isOpen={showNoResults} onClose={() => setShowNoResults(false)} />
      
      {/* Voice Navigation */}
      <VoiceNavigation 
        isEnabled={isVoiceEnabled}
        onCameraStart={startCamera}
        onCameraStop={stopCamera}
      />
      
      {/* Voice Indicator */}
      <VoiceIndicator />
      
      <div className="mx-auto max-w-7xl px-6 py-8">
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
            <h2 className="mb-3 text-lg font-semibold text-violet-50 sm:mb-4 sm:text-xl">Virtual Try-On</h2>
            <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-gradient-to-b from-purple-900 via-violet-950 to-purple-950">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  if (canvasRef.current && videoRef.current) {
                    canvasRef.current.width = videoRef.current.videoWidth
                    canvasRef.current.height = videoRef.current.videoHeight
                  }
                }}
                style={{ transform: 'scaleX(-1)', display: cameraActive ? 'block' : 'none' }}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <canvas
                ref={canvasRef}
                style={{ transform: 'scaleX(-1)', display: cameraActive ? 'block' : 'none' }}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {poseLoading && cameraActive && (
                <div className="absolute inset-0 flex h-full flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm">
                  <div className="flex h-16 w-16 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
                  </div>
                  <p className="text-lg font-medium text-violet-50">Loading AI Model...</p>
                  <p className="text-sm text-violet-50/70">This may take a few seconds</p>
                </div>
              )}
              {!cameraActive && (
                <div className="absolute inset-0 flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400/20 to-purple-600/20">
                    <span className="text-4xl">{isDetecting ? '⚡' : '📷'}</span>
                  </div>
                  <p className="text-lg text-violet-50">
                    {isDetecting ? 'Optimizing for your device...' : 'Start your camera to try on outfits'}
                  </p>
                  <button
                    onClick={startCamera}
                    disabled={isDetecting}
                    className="rounded-full bg-gradient-to-r from-yellow-400 via-gray-300 to-purple-600 px-6 py-3 text-sm font-medium text-purple-950 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDetecting ? 'Please wait...' : 'Activate Camera'}
                  </button>
                </div>
              )}
            </div>
            {cameraActive && (
              <div className="mt-3 flex gap-2 sm:mt-4 sm:gap-3">
                <button className="flex-1 rounded-full border border-violet-500/70 bg-black/20 px-3 py-2 text-xs font-medium text-violet-50 transition hover:border-yellow-400 hover:text-yellow-400 sm:px-4 sm:text-sm">
                  Capture
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
            {/* Body Measurements Card */}
            <div data-aos="fade-up" data-aos-delay="100" className="rounded-2xl border border-violet-900/50 bg-black/35 p-6 backdrop-blur-md">
              <h3 className="mb-4 text-lg font-semibold text-violet-50">Body Measurements</h3>
              <p className="mb-2 text-xs text-violet-50/40">Camera: {cameraActive ? 'ON' : 'OFF'} | Loading: {poseLoading ? 'YES' : 'NO'} | Data: {measurements ? 'YES' : 'NO'} | Model: {modelTier?.toUpperCase() ?? tier.toUpperCase()}</p>
              {!cameraActive && (
                <p className="text-sm text-violet-50/50">Activate camera to detect measurements</p>
              )}
              {cameraActive && poseLoading && (
                <p className="text-sm text-violet-50/50">Loading pose detection...</p>
              )}
              {cameraActive && !poseLoading && !measurements && (
                <p className="text-sm text-violet-50/50">Stand in front of camera</p>
              )}
              {cameraActive && measurements && (
                <div className="space-y-3">
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Shoulder Width</span>
                    <span className="text-sm font-medium text-yellow-400">{(measurements.shoulderWidth * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Hip Width</span>
                    <span className="text-sm font-medium text-yellow-400">{(measurements.hipWidth * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Torso Length</span>
                    <span className="text-sm font-medium text-yellow-400">{(measurements.torsoLength * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Left Arm</span>
                    <span className="text-sm font-medium text-yellow-400">{(measurements.leftArmLength * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Right Arm</span>
                    <span className="text-sm font-medium text-yellow-400">{(measurements.rightArmLength * 100).toFixed(1)}%</span>
                  </div>
                  <p className="mt-2 text-xs text-violet-50/40">Measurements updated in real-time</p>
                </div>
              )}
            </div>

            {/* Product Selection */}
            <div data-aos="fade-up" data-aos-delay="200" className="rounded-2xl border border-violet-900/50 bg-black/35 p-6 backdrop-blur-md">
              <h3 className="mb-4 text-lg font-semibold text-violet-50">
                {searchResults.length > 0 ? 'Search Results' : 'Select Outfit'}
              </h3>
              
              {searchResults.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {searchResults.map((dress) => (
                    <DressCard
                      key={dress._id}
                      dress={dress}
                      isSelected={selectedDress?._id === dress._id}
                      onClick={() => handleDressSelect(dress)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {outfits.map((item) => (
                    <button
                      key={item.name}
                      className="w-full rounded-xl border border-violet-900/50 bg-black/20 p-4 text-left transition hover:border-yellow-400/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-purple-900 to-purple-950 flex items-center justify-center text-3xl">
                          {item.icon}
                        </div>
                        <div>
                          <p className="font-medium text-violet-50">{item.name}</p>
                          <p className="text-xs text-violet-50/60">Tap to try on</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  <p className="text-xs text-violet-50/50 text-center mt-4">
                    Use voice: "Show me a dress for wedding"
                  </p>
                </div>
              )}
            </div>

            {/* Cast to TV */}
            <div data-aos="fade-up" data-aos-delay="300" className="rounded-2xl border border-violet-900/50 bg-black/35 p-6 backdrop-blur-md">
              <h3 className="mb-3 text-lg font-semibold text-violet-50">Cast to TV</h3>
              <p className="mb-4 text-sm text-violet-50/70">View on your smart TV for a full mirror experience</p>
              <button className="w-full rounded-full border border-violet-500/70 bg-black/20 px-4 py-2 text-sm font-medium text-violet-50 transition hover:border-yellow-400 hover:text-yellow-400">
                🖥️ Connect to TV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
