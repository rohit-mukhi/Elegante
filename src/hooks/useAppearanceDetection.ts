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
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
          delegate
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.6,
        minPosePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6
      }).catch(async (err) => {
        console.warn('GPU delegate failed for pose, trying CPU:', err)
        setLoadingProgress({
          stage: 'downloading-models',
          message: 'GPU unavailable, using CPU for Pose Model...',
          progress: 20
        })
        return PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.6,
          minPosePresenceConfidence: 0.6,
          minTrackingConfidence: 0.6
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
        numFaces: 1,
        minFaceDetectionConfidence: 0.6,
        minFacePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false
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
          numFaces: 1,
          minFaceDetectionConfidence: 0.6,
          minFacePresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false
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

  const classifySkinTone = (ita: number, avgBrightness: number) => {
    // Adaptive ITA thresholds based on lighting conditions
    // In low light (avgBrightness < 130): skin appears darker, so lower thresholds
    // In bright light (avgBrightness > 190): skin appears lighter, so raise thresholds
    
    let adjustment = 0
    
    if (avgBrightness < 100) {
      // Very dark lighting - skin appears much darker
      adjustment = -8
    } else if (avgBrightness < 130) {
      // Dark lighting - skin appears darker
      adjustment = -5
    } else if (avgBrightness > 210) {
      // Very bright lighting - skin appears much lighter
      adjustment = +8
    } else if (avgBrightness > 190) {
      // Bright lighting - skin appears lighter
      adjustment = +5
    }
    // Normal lighting (130-190): no adjustment needed
    
    const adjustedITA = ita + adjustment
    
    console.log(`ITA Adjustment: Original=${ita.toFixed(2)}, Adjusted=${adjustedITA.toFixed(2)} (brightness=${avgBrightness.toFixed(1)}, adjustment=${adjustment})`)
    
    // Custom strict thresholds to compensate for lighting variations
    if (adjustedITA > 75) return 'Very Fair'
    if (adjustedITA > 65) return 'Fair'
    if (adjustedITA > 50) return 'Medium'
    if (adjustedITA > 35) return 'Olive'
    if (adjustedITA > 20) return 'Brown'
    return 'Very Dark'
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
    const lab = rgbToLab(skinR, skinG, skinB)
    // a* > 5 = reddish, b* > 20 = yellowish = Warm
    // b* < 12 = bluish = Cool
    // between = Neutral
    if (lab.b > 20 && lab.a > 5) return 'Warm'
    if (lab.b < 12) return 'Cool'
    return 'Neutral'
  }

  const classifyBodyType = (shoulderToHip: number, waistToHip: number): string => {
    if (Math.abs(shoulderToHip - 1.0) < 0.08 && waistToHip < 0.75) return 'Hourglass'
    if (shoulderToHip > 1.08) return 'Inverted Triangle'
    if (shoulderToHip < 0.92) return 'Triangle'
    if (waistToHip > 0.85) return 'Apple'
    if (waistToHip > 0.80 && waistToHip < 0.85) return 'Oval'
    if (shoulderToHip >= 1.0 && shoulderToHip <= 1.08 && waistToHip < 0.80) return 'Trapezoid'
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
  ): { quality: 'excellent' | 'good' | 'fair' | 'poor', score: number, issues: string[], avgBrightness: number } => {
    if (facePoints.length === 0) {
      return { quality: 'fair', score: 50, issues: ['No face detected'], avgBrightness: 128 }
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
      return { quality: 'fair', score: 50, issues: ['Face region too small'], avgBrightness: 128 }
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
    
    return { quality, score, issues, avgBrightness }
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

  const analyzeFeatures = async () => {
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
    let faceRegionBrightness: number[] = []  // Track overall face brightness for normalization

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
      
      // REMOVED: White balance normalization - causes inconsistent results
      // White balance on entire frame conflicts with local skin sampling
      // imageData = normalizeWhiteBalance(imageData)

      try {
        const poseResults = poseLandmarkerRef.current.detectForVideo(video, performance.now())
        let bodyType = 'Rectangle'
        let shoulderToHipRatio = 1.0
        let waistToHipRatio = 0.8
        const aspectRatio = canvas.width / canvas.height

        if (poseResults.landmarks && poseResults.landmarks.length > 0) {
          const lm = poseResults.landmarks[0]
          const leftShoulder  = lm[11]
          const rightShoulder = lm[12]
          const leftElbow     = lm[13]
          const rightElbow    = lm[14]
          const leftHip       = lm[23]
          const rightHip      = lm[24]

          const isVisible = (idx: number, threshold = 0.7) =>
            lm[idx].visibility !== undefined &&
            lm[idx].visibility! > threshold &&
            lm[idx].x >= 0 && lm[idx].x <= 1 &&
            lm[idx].y >= 0 && lm[idx].y <= 1

          const isShoulderVisible = isVisible(11) && isVisible(12)
          const isHipVisible      = isVisible(23) && isVisible(24)

          if (isShoulderVisible && isHipVisible) {
            // Correct for non-square frames by scaling x distances by aspect ratio
            const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x) * aspectRatio
            const hipWidth      = Math.abs(rightHip.x - leftHip.x) * aspectRatio

            if (shoulderWidth > 0.05 && hipWidth > 0.05) {
              shoulderToHipRatio = shoulderWidth / hipWidth

              // Use elbow x-positions as waist proxy if both elbows visible
              // Elbows at rest hang at natural waist level
              if (isVisible(13) && isVisible(14)) {
                const elbowSpan = Math.abs(rightElbow.x - leftElbow.x) * aspectRatio
                // Clamp: elbow span should be between hip and shoulder width
                const clampedWaist = Math.min(Math.max(elbowSpan, hipWidth * 0.8), shoulderWidth * 1.1)
                waistToHipRatio = clampedWaist / hipWidth
                console.log(`Waist from elbows: span=${elbowSpan.toFixed(3)}, clamped=${clampedWaist.toFixed(3)}, ratio=${waistToHipRatio.toFixed(3)}`)
              } else {
                // Fallback: estimate waist as 80% of shoulder (more realistic than 75%)
                waistToHipRatio = (shoulderWidth * 0.80) / hipWidth
              }

              bodyType = classifyBodyType(shoulderToHipRatio, waistToHipRatio)
              console.log(`Body ratios — shoulder/hip: ${shoulderToHipRatio.toFixed(3)}, waist/hip: ${waistToHipRatio.toFixed(3)} → ${bodyType}`)
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
          faceRegionBrightness.push(lightingAssessment.avgBrightness)  // Store for normalization
          
          // HAIR SAMPLING: offset scales with face height so it works at any distance
          // [10]=forehead top, [152]=chin — face height in pixels
          const faceTopY  = landmarks[10].y  * canvas.height
          const faceChinY = landmarks[152].y * canvas.height
          const faceHeightPx = Math.abs(faceChinY - faceTopY)
          const hairOffset = faceHeightPx * 0.15  // 15% of face height above hairline

          // 22 points: original 12 + 10 upper-forehead border landmarks
          const foreheadPoints = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
                                   108, 69, 104, 68, 337, 299, 333, 298, 301, 67]
          const hairPoints: Array<{ x: number; y: number }> = []

          foreheadPoints.forEach(idx => {
            if (landmarks[idx]) {
              const x    = landmarks[idx].x * canvas.width
              const y    = landmarks[idx].y * canvas.height
              const hairY = y - hairOffset
              if (hairY >= 0) hairPoints.push({ x, y: hairY })
            }
          })

          const hairSample = samplePixelsWithMedian(imageData, hairPoints, 5)
          if (hairSample) hairSamples.push(hairSample)

          // EYE SAMPLING: separate left/right iris, exclude pupil center, radius 3
          // Left iris ring: [469,470,471,472] — skip [468] (pupil center)
          // Right iris ring: [474,475,476,477] — skip [473] (pupil center)
          const leftIrisPoints: Array<{ x: number; y: number }>  = []
          const rightIrisPoints: Array<{ x: number; y: number }> = []

          ;[469, 470, 471, 472].forEach(idx => {
            if (landmarks[idx]) leftIrisPoints.push({
              x: landmarks[idx].x * canvas.width,
              y: landmarks[idx].y * canvas.height
            })
          })
          ;[474, 475, 476, 477].forEach(idx => {
            if (landmarks[idx]) rightIrisPoints.push({
              x: landmarks[idx].x * canvas.width,
              y: landmarks[idx].y * canvas.height
            })
          })

          const leftEyeSample  = samplePixelsWithMedian(imageData, leftIrisPoints,  3)
          const rightEyeSample = samplePixelsWithMedian(imageData, rightIrisPoints, 3)

          // Pick the better-lit eye to avoid blown-out or shadowed eye contaminating result
          let eyeSample: ColorSample | null = null
          if (leftEyeSample && rightEyeSample) {
            const leftBrightness  = (leftEyeSample.r  + leftEyeSample.g  + leftEyeSample.b)  / 3
            const rightBrightness = (rightEyeSample.r + rightEyeSample.g + rightEyeSample.b) / 3
            // Prefer the eye closer to ideal brightness (80–160 range for iris)
            const leftDelta  = Math.abs(leftBrightness  - 120)
            const rightDelta = Math.abs(rightBrightness - 120)
            eyeSample = leftDelta <= rightDelta ? leftEyeSample : rightEyeSample
          } else {
            eyeSample = leftEyeSample ?? rightEyeSample
          }

          if (eyeSample) eyeSamples.push(eyeSample)

          // SKIN SAMPLING: cheeks + nose bridge + chin for shadow-resistant coverage
          // Cheeks (10), nose bridge (5), chin (3) = 18 total points
          const skinPointIndices = [
            // Upper cheeks near nose
            36, 266, 203, 423, 50, 280, 101, 330, 117, 346,
            // Nose bridge (least shadow variation)
            168, 6, 197, 195, 5,
            // Chin (complements cheeks for darker skin tones)
            175, 199, 200
          ]
          const skinPoints: Array<{ x: number; y: number }> = []

          skinPointIndices.forEach(idx => {
            if (landmarks[idx]) skinPoints.push({
              x: landmarks[idx].x * canvas.width,
              y: landmarks[idx].y * canvas.height
            })
          })

          const skinSample = samplePixelsWithMedian(imageData, skinPoints, 4)
          if (skinSample) skinSamples.push(skinSample)
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
        
        // Use overall face region brightness (not just skin sample) for normalization
        const overallFaceBrightness = faceRegionBrightness.length > 0 
          ? faceRegionBrightness.reduce((a, b) => a + b, 0) / faceRegionBrightness.length
          : (avgSkin.r + avgSkin.g + avgSkin.b) / 3
        
        console.log(`Overall face brightness: ${overallFaceBrightness.toFixed(1)}`)
        
        // Smart adaptive normalization based on lighting analysis
        // Target: 160 brightness (well-lit indoor conditions)
        const targetBrightness = 160
        let correctionFactor = targetBrightness / overallFaceBrightness
        
        // Apply intelligent limits based on detected lighting condition
        if (overallFaceBrightness < 100) {
          // Very dark: limit boost to 1.8x to avoid noise amplification
          correctionFactor = Math.min(correctionFactor, 1.8)
          console.log(`⚠️ Very dark lighting detected - limiting correction to 1.8x`)
        } else if (overallFaceBrightness < 130) {
          // Dark: limit boost to 1.5x
          correctionFactor = Math.min(correctionFactor, 1.5)
          console.log(`⚠️ Dark lighting detected - limiting correction to 1.5x`)
        } else if (overallFaceBrightness > 200) {
          // Very bright: limit reduction to 0.7x
          correctionFactor = Math.max(correctionFactor, 0.7)
          console.log(`⚠️ Very bright lighting detected - limiting correction to 0.7x`)
        } else if (overallFaceBrightness > 180) {
          // Bright: limit reduction to 0.8x
          correctionFactor = Math.max(correctionFactor, 0.8)
          console.log(`⚠️ Bright lighting detected - limiting correction to 0.8x`)
        }
        
        console.log(`Brightness correction factor: ${correctionFactor.toFixed(2)}x`)
        
        // Apply normalization
        const normalizedSkin = {
          r: Math.min(255, Math.max(0, Math.round(avgSkin.r * correctionFactor))),
          g: Math.min(255, Math.max(0, Math.round(avgSkin.g * correctionFactor))),
          b: Math.min(255, Math.max(0, Math.round(avgSkin.b * correctionFactor)))
        }
        console.log(`Skin RGB (normalized): R=${normalizedSkin.r}, G=${normalizedSkin.g}, B=${normalizedSkin.b}`)
        
        const lab = rgbToLab(normalizedSkin.r, normalizedSkin.g, normalizedSkin.b)
        skinToneITA = calculateITA(lab.L, lab.b)
        
        console.log(`LAB values: L=${lab.L.toFixed(2)}, a=${lab.a.toFixed(2)}, b=${lab.b.toFixed(2)}`)
        console.log(`ITA value: ${skinToneITA.toFixed(2)}`)
        
        skinTone = classifySkinTone(skinToneITA, overallFaceBrightness)
        console.log(`Classified skin tone: ${skinTone}`)
        
        underTone = determineUndertone(normalizedSkin.r, normalizedSkin.g, normalizedSkin.b)
        console.log(`Undertone: ${underTone} (L=${lab.L.toFixed(1)}, a*=${lab.a.toFixed(1)}, b*=${lab.b.toFixed(1)})`)
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
