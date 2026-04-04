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
}

export function useAppearanceDetection(videoRef: React.RefObject<HTMLVideoElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [features, setFeatures] = useState<AppearanceFeatures | null>(null)
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
      console.log('Lazy loading MediaPipe models for appearance detection...')
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      const [pose, face, segmenter] = await Promise.all([
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        }),
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1
        }),
        ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          outputCategoryMask: true
        })
      ])

      poseLandmarkerRef.current = pose
      faceLandmarkerRef.current = face
      segmenterRef.current = segmenter
      isInitializedRef.current = true

      console.log('MediaPipe models loaded successfully')
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error)
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
    if (ita > 55) return 'Very Fair'
    if (ita > 41) return 'Fair'
    if (ita > 28) return 'Medium'
    if (ita > 10) return 'Brown'
    return 'Very Dark'
  }

  const classifyHairColor = (hex: string): string => {
    const rgb = hexToRgb(hex)
    if (!rgb) return 'Black'
    
    const { r, g, b } = rgb
    const brightness = (r + g + b) / 3
    const redness = r - (g + b) / 2
    
    if (brightness < 70) return 'Black'
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
    if (r < 60 && g < 60 && b < 60) return 'Black'
    const brightness = (r + g + b) / 3
    if (brightness < 100) return 'Brown'
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
    const video = videoRef.current
    
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    try {
      const poseResults = poseLandmarkerRef.current.detectForVideo(video, performance.now())
      let bodyType = 'Rectangle'
      let shoulderToHipRatio = 1.0
      let waistToHipRatio = 0.8

      if (poseResults.landmarks && poseResults.landmarks.length > 0) {
        const landmarks = poseResults.landmarks[0]
        const leftShoulder = landmarks[11]
        const rightShoulder = landmarks[12]
        const leftHip = landmarks[23]
        const rightHip = landmarks[24]

        const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x)
        const hipWidth = Math.abs(rightHip.x - leftHip.x)
        shoulderToHipRatio = shoulderWidth / hipWidth

        const waistWidth = shoulderWidth * 0.75
        waistToHipRatio = waistWidth / hipWidth

        bodyType = classifyBodyType(shoulderToHipRatio, waistToHipRatio)
      }

      const faceResults = faceLandmarkerRef.current.detectForVideo(video, performance.now())
      let hairColorHex = '#000000'
      let eyeColorHex = '#654321'

      if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
        const landmarks = faceResults.faceLandmarks[0]
        
        const foreheadPoints = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288]
        let hairR = 0, hairG = 0, hairB = 0, hairCount = 0
        
        foreheadPoints.forEach(idx => {
          if (landmarks[idx]) {
            const x = Math.floor(landmarks[idx].x * canvas.width)
            const y = Math.floor(landmarks[idx].y * canvas.height)
            if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
              const pixelIndex = (y * canvas.width + x) * 4
              hairR += imageData.data[pixelIndex]
              hairG += imageData.data[pixelIndex + 1]
              hairB += imageData.data[pixelIndex + 2]
              hairCount++
            }
          }
        })
        
        if (hairCount > 0) {
          const r = Math.round(hairR / hairCount)
          const g = Math.round(hairG / hairCount)
          const b = Math.round(hairB / hairCount)
          hairColorHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        }

        const eyePoints = [468, 469, 470, 471, 472, 473, 474, 475, 476, 477]
        let eyeR = 0, eyeG = 0, eyeB = 0, eyeCount = 0
        
        eyePoints.forEach(idx => {
          if (landmarks[idx]) {
            const x = Math.floor(landmarks[idx].x * canvas.width)
            const y = Math.floor(landmarks[idx].y * canvas.height)
            if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
              const pixelIndex = (y * canvas.width + x) * 4
              eyeR += imageData.data[pixelIndex]
              eyeG += imageData.data[pixelIndex + 1]
              eyeB += imageData.data[pixelIndex + 2]
              eyeCount++
            }
          }
        })
        
        if (eyeCount > 0) {
          const r = Math.round(eyeR / eyeCount)
          const g = Math.round(eyeG / eyeCount)
          const b = Math.round(eyeB / eyeCount)
          eyeColorHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        }
      }

      const segmentResults = segmenterRef.current.segmentForVideo(video, performance.now())
      let skinR = 0, skinG = 0, skinB = 0, skinCount = 0

      if (segmentResults.categoryMask) {
        const mask = segmentResults.categoryMask.getAsUint8Array()
        
        for (let i = 0; i < mask.length; i++) {
          if (mask[i] > 0) {
            const pixelIndex = i * 4
            skinR += imageData.data[pixelIndex]
            skinG += imageData.data[pixelIndex + 1]
            skinB += imageData.data[pixelIndex + 2]
            skinCount++
          }
        }
      }

      let skinTone = 'Fair'
      let skinToneITA = 0
      let underTone = 'Warm'

      if (skinCount > 0) {
        const avgR = skinR / skinCount
        const avgG = skinG / skinCount
        const avgB = skinB / skinCount
        
        const lab = rgbToLab(avgR, avgG, avgB)
        skinToneITA = calculateITA(lab.L, lab.b)
        skinTone = classifySkinTone(skinToneITA)
        underTone = determineUndertone(avgR, avgG, avgB)
      }

      const hairColor = classifyHairColor(hairColorHex)
      const eyeColor = classifyEyeColor(eyeColorHex)

      setFeatures({
        hairColor,
        eyeColor,
        skinTone,
        underTone,
        bodyType,
        hairColorHex,
        eyeColorHex,
        skinToneITA
      })

    } catch (error) {
      console.error('Analysis error:', error)
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

  return { features, isLoading, isAnalyzing, analyzeFeatures, dispose }
}
