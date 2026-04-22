import { useState, useRef, useCallback } from 'react'
import { PoseLandmarker, FaceLandmarker, ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision'

export interface AppearanceFeatures {
  hairColor: string
  eyeColor: string
  skinTone: string
  underTone: string
  bodyType: string
  hairColorHex: string
  eyeColorHex: string
  skinToneITA: number
  lightingQuality: 'excellent' | 'good' | 'fair' | 'poor'
  lightingScore: number // 0-100
}

interface ColorSample {
  r: number
  g: number
  b: number
}

export interface LoadingProgress {
  stage: 'idle' | 'downloading-models' | 'initializing' | 'analyzing' | 'complete'
  message: string
  progress: number // 0-100
}

export function useAppearanceDetection(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [features, setFeatures] = useState<AppearanceFeatures | null>(null)
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
    stage: 'idle',
    message: '',
    progress: 0
  })
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null)
  const segmenterRef = useRef<ImageSegmenter | null>(null)
  const isInitializedRef = useRef(false)

  const initialize = useCallback(async () => {
    if (isInitializedRef.current) {
      return true
    }

    setIsLoading(true)
    try {
      setLoadingProgress({
        stage: 'downloading-models',
        message: 'Connecting to MediaPipe servers...',
        progress: 5
      })

      console.log('Lazy loading MediaPipe models for appearance detection...')
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      setLoadingProgress({
        stage: 'downloading-models',
        message: 'Downloading Pose Detection Model (1/3)...',
        progress: 15
      })

      // Try GPU first, fallback to CPU on mobile if GPU fails
      let delegate: 'GPU' | 'CPU' = 'GPU'
      
      const pose = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate
        },
        runningMode: 'VIDEO',
        numPoses: 1
      }).catch(async (err) => {
        console.warn('GPU delegate failed for pose, trying CPU:', err)
        setLoadingProgress({
          stage: 'downloading-models',
          message: 'GPU unavailable, using CPU for Pose Model...',
          progress: 20
        })
        return PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        })
      })

      setLoadingProgress({
        stage: 'downloading-models',
        message: 'Downloading Face Detection Model (2/3)...',
        progress: 40
      })

      const face = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate
        },
        runningMode: 'VIDEO',
        numFaces: 1
      }).catch(async (err) => {
        console.warn('GPU delegate failed for face, trying CPU:', err)
        setLoadingProgress({
          stage: 'downloading-models',
          message: 'GPU unavailable, using CPU for Face Model...',
          progress: 45
        })
        return FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1
        })
      })

      setLoadingProgress({
        stage: 'downloading-models',
        message: 'Downloading Image Segmentation Model (3/3)...',
        progress: 65
      })

      const segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite',
          delegate: 'CPU' // Force CPU for mobile compatibility
        },
        runningMode: 'VIDEO',
        outputCategoryMask: true
      })

      setLoadingProgress({
        stage: 'initializing',
        message: 'Initializing AI models...',
        progress: 90
      })

      poseLandmarkerRef.current = pose
      faceLandmarkerRef.current = face
      segmenterRef.current = segmenter
      isInitializedRef.current = true

      setLoadingProgress({
        stage: 'complete',
        message: 'Models ready!',
        progress: 100
      })

      console.log('MediaPipe models loaded successfully')
      
      // Clear loading state after a brief moment
      setTimeout(() => {
        setIsLoading(false)
        setLoadingProgress({ stage: 'idle', message: '', progress: 0 })
      }, 500)
      
      return true
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error)
      setLoadingProgress({
        stage: 'idle',
        message: 'Failed to load models',
        progress: 0
      })
      alert(`Failed to load AI models: ${error instanceof Error ? error.message : 'Unknown error'}. Please refresh and try again.`)
      setIsLoading(false)
      return false
    }
  }, [])

  const rgbToLab = (r: number, g: number, b: number) => {
    let rNorm = r / 255
    let gNorm = g / 255
    let bNorm = b / 255

    rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92
    gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92
    bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92

    const x = (rNorm * 0.4124 + gNorm * 0.3576 + bNorm * 0.1805) * 100
    const y = (rNorm * 0.2126 + gNorm * 0.7152 + bNorm * 0.0722) * 100
    const z = (rNorm * 0.0193 + gNorm * 0.1192 + bNorm * 0.9505) * 100

    const xn = 95.047, yn = 100.000, zn = 108.883
    const fx = x / xn > 0.008856 ? Math.pow(x / xn, 1/3) : (7.787 * x / xn) + 16/116
    const fy = y / yn > 0.008856 ? Math.pow(y / yn, 1/3) : (7.787 * y / yn) + 16/116
    const fz = z / zn > 0.008856 ? Math.pow(z / zn, 1/3) : (7.787 * z / zn) + 16/116

    const L = (116 * fy) - 16
    const a = 500 * (fx - fy)
    const bLab = 200 * (fy - fz)

    return { L, a, b: bLab }
  }

  const calculateITA = (L: number, b: number) => {
    return (Math.atan((L - 50) / b) * 180) / Math.PI
  }

  const classifySkinTone = (ita: number) => {
    // Adjusted thresholds - more conservative classification
    // Accounts for typical indoor lighting making skin appear lighter
    if (ita > 58) return 'Very Fair'  // Increased from 55 (stricter)
    if (ita > 44) return 'Fair'       // Increased from 41 (stricter)
    if (ita > 31) return 'Medium'     // Increased from 28 (stricter)
    if (ita > 22) return 'Olive'      // Increased from 19 (stricter)
    if (ita > 13) return 'Brown'      // Increased from 10 (stricter)
    return 'Very Dark'                 // < 13
  }

  const classifyHairColor = (hex: string): string => {
    const rgb = hexToRgb(hex)
    if (!rgb) return 'Black'
    
    const { r, g, b } = rgb
    const brightness = (r + g + b) / 3
    const redness = r - (g + b) / 2
    
    // More lenient black detection (increased from 70 to 90)
    if (brightness < 90) return 'Black'
    if (redness > 40 && brightness < 160) return 'Red'
    if (brightness < 160) return 'Brown'
    if (brightness > 200) return 'Blonde'
    if (r < 120 && g < 120 && b < 120) return 'Grey'
    return 'Brown'
  }

  const classifyEyeColor = (hex: string): string => {
    const rgb = hexToRgb(hex)
    if (!rgb) return 'Brown'
    
    const { r, g, b } = rgb
    
    if (b > r && b > g && b > 120) return 'Light Blue'
    if (b > r && b > g && b > 80) return 'Blue'
    if (g > r && g > b && g > 80) return 'Green'
    if (g > 100 && r > 100 && b < 80) return 'Hazel'
    
    // More lenient black detection (increased from 60 to 80)
    if (r < 80 && g < 80 && b < 80) return 'Black'
    
    const brightness = (r + g + b) / 3
    // Adjusted threshold for black eyes (increased from 100 to 120)
    if (brightness < 120) return 'Black'
    if (brightness < 160) return 'Brown'
    return 'Light Brown'
  }

  const determineUndertone = (skinR: number, skinG: number, skinB: number): string => {
    const warmth = (skinR + skinG) - (skinB * 1.5)
    return warmth > 0 ? 'Warm' : 'Cool'
  }

  const classifyBodyType = (shoulderToHip: number, waistToHip: number): string => {
    if (Math.abs(shoulderToHip - 1.0) < 0.08 && waistToHip < 0.75) return 'Hourglass'
    if (shoulderToHip > 1.05) return 'Inverted Triangle'
    if (shoulderToHip < 0.95) return 'Triangle'
    if (waistToHip > 0.85) return 'Apple'
    if (waistToHip > 0.80 && waistToHip < 0.85) return 'Oval'
    if (shoulderToHip > 1.0 && shoulderToHip < 1.05 && waistToHip < 0.80) return 'Trapezoid'
    return 'Rectangle'
  }

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  // Assess lighting quality based on face region only
  const assessLightingQuality = (
    imageData: ImageData,
    facePoints: Array<{ x: number; y: number }>
  ): { quality: 'excellent' | 'good' | 'fair' | 'poor', score: number, issues: string[] } => {
    if (facePoints.length === 0) {
      return { quality: 'fair', score: 50, issues: ['No face detected'] }
    }

    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    
    // Calculate bounding box of face
    const minX = Math.max(0, Math.floor(Math.min(...facePoints.map(p => p.x)) - 20))
    const maxX = Math.min(width, Math.ceil(Math.max(...facePoints.map(p => p.x)) + 20))
    const minY = Math.max(0, Math.floor(Math.min(...facePoints.map(p => p.y)) - 20))
    const maxY = Math.min(height, Math.ceil(Math.max(...facePoints.map(p => p.y)) + 20))
    
    let rSum = 0, gSum = 0, bSum = 0, count = 0
    let brightnessValues: number[] = []
    let darkPixels = 0
    let brightPixels = 0
    
    // Sample only face region
    for (let y = minY; y < maxY; y += 3) {
      for (let x = minX; x < maxX; x += 3) {
        const i = (y * width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const brightness = (r + g + b) / 3
        
        rSum += r
        gSum += g
        bSum += b
        brightnessValues.push(brightness)
        
        // Count very dark and very bright pixels
        if (brightness < 60) darkPixels++
        if (brightness > 220) brightPixels++
        
        count++
      }
    }
    
    if (count === 0) {
      return { quality: 'fair', score: 50, issues: ['Face region too small'] }
    }
    
    const rAvg = rSum / count
    const gAvg = gSum / count
    const bAvg = bSum / count
    const avgBrightness = (rAvg + gAvg + bAvg) / 3
    
    // Calculate standard deviation for contrast
    const variance = brightnessValues.reduce((sum, val) => sum + Math.pow(val - avgBrightness, 2), 0) / count
    const stdDev = Math.sqrt(variance)
    
    // Calculate color cast (how balanced are RGB channels)
    const colorBalance = Math.max(Math.abs(rAvg - gAvg), Math.abs(gAvg - bAvg), Math.abs(rAvg - bAvg))
    
    // Check for noise (sign of low light + camera gain)
    const darkPixelRatio = darkPixels / count
    const brightPixelRatio = brightPixels / count
    
    const issues: string[] = []
    let score = 100
    
    // CRITICAL: Check for camera auto-exposure in dark room
    // High contrast + many dark pixels = camera struggling in low light
    if (darkPixelRatio > 0.15 && stdDev > 45) {
      issues.push('Dark room - camera auto-adjusting')
      score -= 35
    } else if (darkPixelRatio > 0.10) {
      issues.push('Insufficient ambient light')
      score -= 25
    }
    
    // Check brightness (ideal for face: 130-200)
    if (avgBrightness < 90) {
      issues.push('Very dark - face barely visible')
      score -= 40
    } else if (avgBrightness < 130) {
      issues.push('Too dark - need more light')
      score -= 30
    } else if (avgBrightness > 220) {
      issues.push('Overexposed - too bright')
      score -= 35
    } else if (avgBrightness > 200) {
      issues.push('Slightly overexposed')
      score -= 15
    }
    
    // Check contrast (ideal: 20-50 for face with good lighting)
    if (stdDev < 12) {
      issues.push('Very flat lighting')
      score -= 25
    } else if (stdDev < 18) {
      issues.push('Low contrast')
      score -= 15
    } else if (stdDev > 65) {
      issues.push('Harsh shadows on face')
      score -= 30
    } else if (stdDev > 50) {
      issues.push('Uneven lighting')
      score -= 20
    }
    
    // Check color cast (ideal: < 12 for accurate skin tone)
    if (colorBalance > 30) {
      issues.push('Strong color tint (yellow/blue)')
      score -= 30
    } else if (colorBalance > 18) {
      issues.push('Noticeable color tint')
      score -= 15
    }
    
    // Penalty for overexposed pixels (blown highlights)
    if (brightPixelRatio > 0.05) {
      issues.push('Blown highlights')
      score -= 20
    }
    
    score = Math.max(0, Math.min(100, score))
    
    let quality: 'excellent' | 'good' | 'fair' | 'poor'
    if (score >= 82) quality = 'excellent'
    else if (score >= 65) quality = 'good'
    else if (score >= 45) quality = 'fair'
    else quality = 'poor'
    
    console.log(`Lighting Assessment (Face Region): Score=${score}, Quality=${quality}`)
    console.log(`  Brightness=${avgBrightness.toFixed(1)}, Contrast=${stdDev.toFixed(1)}, ColorCast=${colorBalance.toFixed(1)}`)
    console.log(`  DarkPixels=${(darkPixelRatio*100).toFixed(1)}%, BrightPixels=${(brightPixelRatio*100).toFixed(1)}%`)
    console.log(`  RGB Averages: R=${rAvg.toFixed(1)}, G=${gAvg.toFixed(1)}, B=${bAvg.toFixed(1)}`)
    console.log(`  Face region: ${minX},${minY} to ${maxX},${maxY} (${count} pixels sampled)`)
    if (issues.length > 0) {
      console.log(`  Issues: ${issues.join(', ')}`)
    }
    
    return { quality, score, issues }
  }

  // White balance correction using gray world algorithm
  const normalizeWhiteBalance = (imageData: ImageData): ImageData => {
    const data = imageData.data
    let rSum = 0, gSum = 0, bSum = 0, count = 0

    // Calculate average RGB values
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i]
      gSum += data[i + 1]
      bSum += data[i + 2]
      count++
    }

    const rAvg = rSum / count
    const gAvg = gSum / count
    const bAvg = bSum / count
    const grayAvg = (rAvg + gAvg + bAvg) / 3

    // Calculate correction factors
    const rScale = grayAvg / rAvg
    const gScale = grayAvg / gAvg
    const bScale = grayAvg / bAvg

    // Apply correction
    const normalized = new ImageData(imageData.width, imageData.height)
    for (let i = 0; i < data.length; i += 4) {
      normalized.data[i] = Math.min(255, data[i] * rScale)
      normalized.data[i + 1] = Math.min(255, data[i + 1] * gScale)
      normalized.data[i + 2] = Math.min(255, data[i + 2] * bScale)
      normalized.data[i + 3] = data[i + 3]
    }

    return normalized
  }

  // Sample pixels with median filtering to remove outliers
  const samplePixelsWithMedian = (
    imageData: ImageData,
    points: Array<{ x: number; y: number }>,
    radius: number = 3
  ): ColorSample | null => {
    const samples: ColorSample[] = []
    const width = imageData.width
    const height = imageData.height

    points.forEach(point => {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = Math.floor(point.x + dx)
          const y = Math.floor(point.y + dy)
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const pixelIndex = (y * width + x) * 4
            samples.push({
              r: imageData.data[pixelIndex],
              g: imageData.data[pixelIndex + 1],
              b: imageData.data[pixelIndex + 2]
            })
          }
        }
      }
    })

    if (samples.length === 0) return null

    // Calculate median for each channel to remove outliers
    const rValues = samples.map(s => s.r).sort((a, b) => a - b)
    const gValues = samples.map(s => s.g).sort((a, b) => a - b)
    const bValues = samples.map(s => s.b).sort((a, b) => a - b)

    const mid = Math.floor(samples.length / 2)
    return {
      r: rValues[mid],
      g: gValues[mid],
      b: bValues[mid]
    }
  }

  // Average multiple frames for stability
  const averageFrames = (frames: ColorSample[]): ColorSample => {
    const sum = frames.reduce(
      (acc, frame) => ({
        r: acc.r + frame.r,
        g: acc.g + frame.g,
        b: acc.b + frame.b
      }),
      { r: 0, g: 0, b: 0 }
    )
    return {
      r: Math.round(sum.r / frames.length),
      g: Math.round(sum.g / frames.length),
      b: Math.round(sum.b / frames.length)
    }
  }

  const analyzeFeatures = async (debugCanvas?: HTMLCanvasElement) => {
    if (!videoRef.current) {
      return
    }

    // Initialize models if not already loaded
    const initialized = await initialize()
    if (!initialized || !poseLandmarkerRef.current || !faceLandmarkerRef.current || !segmenterRef.current) {
      return
    }

    setIsAnalyzing(true)
    
    // Multi-frame capture for averaging
    const numFrames = 5
    const frameDelay = 200 // ms between frames
    const hairSamples: ColorSample[] = []
    const eyeSamples: ColorSample[] = []
    const skinSamples: ColorSample[] = []
    let bodyTypeResults: string[] = []
    let lightingScores: number[] = []
    let debugCtx: CanvasRenderingContext2D | null = null
    
    if (debugCanvas) {
      debugCtx = debugCanvas.getContext('2d')
    }

    for (let frameIdx = 0; frameIdx < numFrames; frameIdx++) {
      setLoadingProgress({
        stage: 'analyzing',
        message: `Capturing frame ${frameIdx + 1}/${numFrames}...`,
        progress: 10 + (frameIdx * 15)
      })

      const video = videoRef.current
      
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) continue

      ctx.drawImage(video, 0, 0)
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      // Apply white balance normalization
      imageData = normalizeWhiteBalance(imageData)

      try {
        const poseResults = poseLandmarkerRef.current.detectForVideo(video, performance.now())
      let bodyType = 'Rectangle' // Default fallback for model compatibility
      let shoulderToHipRatio = 1.0
      let waistToHipRatio = 0.8

      if (poseResults.landmarks && poseResults.landmarks.length > 0) {
        const landmarks = poseResults.landmarks[0]
        const leftShoulder = landmarks[11]
        const rightShoulder = landmarks[12]
        const leftHip = landmarks[23]
        const rightHip = landmarks[24]

        // Check if all required landmarks are visible and in frame
        const isShoulderVisible = leftShoulder.visibility > 0.7 && rightShoulder.visibility > 0.7
        const isHipVisible = leftHip.visibility > 0.7 && rightHip.visibility > 0.7
        const isInFrame = 
          leftShoulder.x >= 0 && leftShoulder.x <= 1 &&
          rightShoulder.x >= 0 && rightShoulder.x <= 1 &&
          leftHip.x >= 0 && leftHip.x <= 1 &&
          rightHip.x >= 0 && rightHip.x <= 1

        // Only calculate body type if shoulders AND hips are clearly visible
        if (isShoulderVisible && isHipVisible && isInFrame) {
          const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x)
          const hipWidth = Math.abs(rightHip.x - leftHip.x)
          
          // Only calculate if measurements are reasonable (not too small)
          if (shoulderWidth > 0.1 && hipWidth > 0.1) {
            shoulderToHipRatio = shoulderWidth / hipWidth
            const waistWidth = shoulderWidth * 0.75
            waistToHipRatio = waistWidth / hipWidth
            bodyType = classifyBodyType(shoulderToHipRatio, waistToHipRatio)
          }
        }
      }

        bodyTypeResults.push(bodyType)

        const faceResults = faceLandmarkerRef.current.detectForVideo(video, performance.now())

        if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
          const landmarks = faceResults.faceLandmarks[0]
          
          // Collect face points for lighting assessment
          const facePoints: Array<{ x: number; y: number }> = []
          // Sample key face landmarks for bounding box
          const keyPoints = [10, 152, 234, 454, 234, 454, 93, 323, 61, 291]
          keyPoints.forEach(idx => {
            if (landmarks[idx]) {
              facePoints.push({
                x: landmarks[idx].x * canvas.width,
                y: landmarks[idx].y * canvas.height
              })
            }
          })
          
          // Assess lighting quality on face region
          const lightingAssessment = assessLightingQuality(imageData, facePoints)
          lightingScores.push(lightingAssessment.score)
          
          // IMPROVED HAIR SAMPLING: Sample ABOVE forehead, not at forehead
          const foreheadPoints = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288]
          const hairPoints: Array<{ x: number; y: number }> = []
          
          foreheadPoints.forEach(idx => {
            if (landmarks[idx]) {
              const x = landmarks[idx].x * canvas.width
              const y = landmarks[idx].y * canvas.height
              // Sample 45 pixels ABOVE forehead to get actual hair
              const hairY = y - 45
              if (hairY >= 0) {
                hairPoints.push({ x, y: hairY })
              }
            }
          })
          
          const hairSample = samplePixelsWithMedian(imageData, hairPoints, 5)
          if (hairSample) {
            hairSamples.push(hairSample)
          }

          // IMPROVED EYE SAMPLING: Larger radius around iris points
          const irisPoints = [468, 469, 470, 471, 472, 473, 474, 475, 476, 477]
          const eyePoints: Array<{ x: number; y: number }> = []
          
          irisPoints.forEach(idx => {
            if (landmarks[idx]) {
              eyePoints.push({
                x: landmarks[idx].x * canvas.width,
                y: landmarks[idx].y * canvas.height
              })
            }
          })
          
          const eyeSample = samplePixelsWithMedian(imageData, eyePoints, 8)
          if (eyeSample) {
            eyeSamples.push(eyeSample)
          }

          // IMPROVED SKIN SAMPLING: Use upper cheek area closer to nose (lighter, more accurate)
          const cheekPoints = [36, 266, 203, 423, 50, 280, 101, 330, 117, 346]
          const skinPoints: Array<{ x: number; y: number }> = []
          
          cheekPoints.forEach(idx => {
            if (landmarks[idx]) {
              skinPoints.push({
                x: landmarks[idx].x * canvas.width,
                y: landmarks[idx].y * canvas.height
              })
            }
          })
          
          const skinSample = samplePixelsWithMedian(imageData, skinPoints, 4)
          if (skinSample) {
            skinSamples.push(skinSample)
          }
          
          // Draw debug overlay on last frame
          if (debugCtx && frameIdx === numFrames - 1) {
            debugCtx.clearRect(0, 0, debugCanvas!.width, debugCanvas!.height)
            
            // Draw hair sampling points (red)
            debugCtx.fillStyle = 'rgba(255, 0, 0, 0.6)'
            debugCtx.strokeStyle = 'red'
            debugCtx.lineWidth = 2
            hairPoints.forEach(p => {
              debugCtx!.beginPath()
              debugCtx!.arc(p.x, p.y, 8, 0, 2 * Math.PI)
              debugCtx!.fill()
              debugCtx!.stroke()
            })
            
            // Draw eye sampling points (blue)
            debugCtx.fillStyle = 'rgba(0, 0, 255, 0.6)'
            debugCtx.strokeStyle = 'blue'
            eyePoints.forEach(p => {
              debugCtx!.beginPath()
              debugCtx!.arc(p.x, p.y, 8, 0, 2 * Math.PI)
              debugCtx!.fill()
              debugCtx!.stroke()
            })
            
            // Draw skin sampling points (green)
            debugCtx.fillStyle = 'rgba(0, 255, 0, 0.6)'
            debugCtx.strokeStyle = 'green'
            skinPoints.forEach(p => {
              debugCtx!.beginPath()
              debugCtx!.arc(p.x, p.y, 8, 0, 2 * Math.PI)
              debugCtx!.fill()
              debugCtx!.stroke()
            })
            
            // Draw labels
            debugCtx.font = 'bold 20px Arial'
            debugCtx.fillStyle = 'white'
            debugCtx.strokeStyle = 'black'
            debugCtx.lineWidth = 3
            if (hairPoints.length > 0) {
              const hairLabel = hairPoints[0]
              debugCtx.strokeText('HAIR', hairLabel.x - 30, hairLabel.y - 15)
              debugCtx.fillText('HAIR', hairLabel.x - 30, hairLabel.y - 15)
            }
            if (eyePoints.length > 0) {
              const eyeLabel = eyePoints[0]
              debugCtx.strokeText('EYES', eyeLabel.x - 30, eyeLabel.y - 15)
              debugCtx.fillText('EYES', eyeLabel.x - 30, eyeLabel.y - 15)
            }
            if (skinPoints.length > 0) {
              const skinLabel = skinPoints[0]
              debugCtx.strokeText('SKIN', skinLabel.x - 30, skinLabel.y + 30)
              debugCtx.fillText('SKIN', skinLabel.x - 30, skinLabel.y + 30)
            }
          }
        }
      } catch (frameError) {
        console.warn(`Frame ${frameIdx + 1} analysis failed:`, frameError)
      }

      // Wait before next frame
      if (frameIdx < numFrames - 1) {
        await new Promise(resolve => setTimeout(resolve, frameDelay))
      }
    }

    // Process averaged results
    try {

      setLoadingProgress({
        stage: 'analyzing',
        message: 'Processing multi-frame data...',
        progress: 85
      })

      // Average all frames for final results
      let hairColorHex = '#000000'
      let eyeColorHex = '#654321'
      let skinTone = 'Fair'
      let skinToneITA = 0
      let underTone = 'Warm'
      let bodyType = 'Rectangle'
      let lightingScore = 0
      let lightingQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'fair'

      // Calculate average lighting score
      if (lightingScores.length > 0) {
        lightingScore = Math.round(lightingScores.reduce((a, b) => a + b, 0) / lightingScores.length)
        if (lightingScore >= 82) lightingQuality = 'excellent'
        else if (lightingScore >= 65) lightingQuality = 'good'
        else if (lightingScore >= 45) lightingQuality = 'fair'
        else lightingQuality = 'poor'
        console.log(`Average Lighting Score: ${lightingScore} (${lightingQuality})`)
      }

      if (hairSamples.length > 0) {
        const avgHair = averageFrames(hairSamples)
        hairColorHex = `#${avgHair.r.toString(16).padStart(2, '0')}${avgHair.g.toString(16).padStart(2, '0')}${avgHair.b.toString(16).padStart(2, '0')}`
        console.log(`Hair RGB (averaged): R=${avgHair.r}, G=${avgHair.g}, B=${avgHair.b}`)
      }

      if (eyeSamples.length > 0) {
        const avgEye = averageFrames(eyeSamples)
        eyeColorHex = `#${avgEye.r.toString(16).padStart(2, '0')}${avgEye.g.toString(16).padStart(2, '0')}${avgEye.b.toString(16).padStart(2, '0')}`
        console.log(`Eye RGB (averaged): R=${avgEye.r}, G=${avgEye.g}, B=${avgEye.b}`)
      }

      if (skinSamples.length > 0) {
        const avgSkin = averageFrames(skinSamples)
        console.log(`Skin RGB (averaged): R=${avgSkin.r}, G=${avgSkin.g}, B=${avgSkin.b}`)
        
        const lab = rgbToLab(avgSkin.r, avgSkin.g, avgSkin.b)
        skinToneITA = calculateITA(lab.L, lab.b)
        
        console.log(`LAB values: L=${lab.L.toFixed(2)}, a=${lab.a.toFixed(2)}, b=${lab.b.toFixed(2)}`)
        console.log(`ITA value: ${skinToneITA.toFixed(2)}`)
        
        skinTone = classifySkinTone(skinToneITA)
        console.log(`Classified skin tone: ${skinTone}`)
        
        underTone = determineUndertone(avgSkin.r, avgSkin.g, avgSkin.b)
        console.log(`Undertone: ${underTone}`)
      }

      // Use most common body type from frames
      if (bodyTypeResults.length > 0) {
        const typeCounts = bodyTypeResults.reduce((acc, type) => {
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        bodyType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]
        console.log(`Body type (most common): ${bodyType}`)
      }

      setLoadingProgress({
        stage: 'analyzing',
        message: 'Finalizing analysis...',
        progress: 95
      })

      const hairColor = classifyHairColor(hairColorHex)
      const eyeColor = classifyEyeColor(eyeColorHex)
      
      console.log(`Final classifications - Hair: ${hairColor}, Eye: ${eyeColor}, Skin: ${skinTone}`)

      setFeatures({
        hairColor,
        eyeColor,
        skinTone,
        underTone,
        bodyType,
        hairColorHex,
        eyeColorHex,
        skinToneITA,
        lightingQuality,
        lightingScore
      })

      setLoadingProgress({
        stage: 'complete',
        message: 'Analysis complete!',
        progress: 100
      })

      // Clear progress after brief moment
      setTimeout(() => {
        setLoadingProgress({ stage: 'idle', message: '', progress: 0 })
      }, 1000)

    } catch (error) {
      console.error('Analysis error:', error)
      setLoadingProgress({
        stage: 'idle',
        message: 'Analysis failed',
        progress: 0
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const dispose = () => {
    console.log('Disposing MediaPipe appearance detection models...')
    poseLandmarkerRef.current = null
    faceLandmarkerRef.current = null
    segmenterRef.current = null
    isInitializedRef.current = false
    setIsLoading(false)
    setFeatures(null)
  }

  return { features, isLoading, isAnalyzing, loadingProgress, analyzeFeatures, dispose }
}
