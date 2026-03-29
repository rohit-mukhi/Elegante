import { useState, useEffect, useRef } from 'react'
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'

export interface BodyMeasurements {
  shoulderWidth: number
  hipWidth: number
  torsoLength: number
  leftArmLength: number
  rightArmLength: number
  leftLegLength: number
  rightLegLength: number
}

export function useMediaPipePose(videoRef: React.RefObject<HTMLVideoElement>) {
  const [isLoading, setIsLoading] = useState(true)
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null)
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const initializePoseLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        })

        poseLandmarkerRef.current = poseLandmarker
        setIsLoading(false)
      } catch (error) {
        console.error('Error initializing pose landmarker:', error)
        setIsLoading(false)
      }
    }

    initializePoseLandmarker()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const calculateDistance = (point1: any, point2: any): number => {
    const dx = point1.x - point2.x
    const dy = point1.y - point2.y
    const dz = (point1.z || 0) - (point2.z || 0)
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  const calculateMeasurements = (landmarks: any[]): BodyMeasurements | null => {
    // Landmark indices based on MediaPipe Pose
    const LEFT_SHOULDER = 11
    const RIGHT_SHOULDER = 12
    const LEFT_HIP = 23
    const RIGHT_HIP = 24
    const LEFT_ELBOW = 13
    const RIGHT_ELBOW = 14
    const LEFT_WRIST = 15
    const RIGHT_WRIST = 16
    const LEFT_KNEE = 25
    const RIGHT_KNEE = 26
    const LEFT_ANKLE = 27
    const RIGHT_ANKLE = 28

    // Check visibility and position (only calculate if landmark is visible AND within frame)
    const isVisible = (index: number) => {
      const landmark = landmarks[index]
      const hasHighVisibility = landmark.visibility !== undefined ? landmark.visibility > 0.8 : false
      const inFrame = landmark.x >= 0 && landmark.x <= 1 && landmark.y >= 0 && landmark.y <= 1
      return hasHighVisibility && inFrame
    }

    const shoulderWidth = isVisible(LEFT_SHOULDER) && isVisible(RIGHT_SHOULDER)
      ? calculateDistance(landmarks[LEFT_SHOULDER], landmarks[RIGHT_SHOULDER])
      : null

    const hipWidth = isVisible(LEFT_HIP) && isVisible(RIGHT_HIP)
      ? calculateDistance(landmarks[LEFT_HIP], landmarks[RIGHT_HIP])
      : null

    const torsoLength = isVisible(LEFT_SHOULDER) && isVisible(LEFT_HIP)
      ? calculateDistance(landmarks[LEFT_SHOULDER], landmarks[LEFT_HIP])
      : null

    const leftArmLength = isVisible(LEFT_SHOULDER) && isVisible(LEFT_ELBOW) && isVisible(LEFT_WRIST)
      ? calculateDistance(landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW]) +
        calculateDistance(landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST])
      : null

    const rightArmLength = isVisible(RIGHT_SHOULDER) && isVisible(RIGHT_ELBOW) && isVisible(RIGHT_WRIST)
      ? calculateDistance(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW]) +
        calculateDistance(landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST])
      : null

    const leftLegLength = isVisible(LEFT_HIP) && isVisible(LEFT_KNEE) && isVisible(LEFT_ANKLE)
      ? calculateDistance(landmarks[LEFT_HIP], landmarks[LEFT_KNEE]) +
        calculateDistance(landmarks[LEFT_KNEE], landmarks[LEFT_ANKLE])
      : null

    const rightLegLength = isVisible(RIGHT_HIP) && isVisible(RIGHT_KNEE) && isVisible(RIGHT_ANKLE)
      ? calculateDistance(landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE]) +
        calculateDistance(landmarks[RIGHT_KNEE], landmarks[RIGHT_ANKLE])
      : null

    // Return null if no measurements are valid
    if (!shoulderWidth && !hipWidth && !torsoLength && !leftArmLength && !rightArmLength && !leftLegLength && !rightLegLength) {
      return null
    }

    return {
      shoulderWidth: shoulderWidth || 0,
      hipWidth: hipWidth || 0,
      torsoLength: torsoLength || 0,
      leftArmLength: leftArmLength || 0,
      rightArmLength: rightArmLength || 0,
      leftLegLength: leftLegLength || 0,
      rightLegLength: rightLegLength || 0
    }
  }

  const detectPose = async () => {
    if (
      !poseLandmarkerRef.current ||
      !videoRef.current ||
      !canvasRef.current ||
      videoRef.current.readyState !== 4
    ) {
      animationFrameRef.current = requestAnimationFrame(detectPose)
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(detectPose)
      return
    }

    const startTimeMs = performance.now()
    const results = poseLandmarkerRef.current.detectForVideo(video, startTimeMs)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0]
      
      // Calculate measurements
      const bodyMeasurements = calculateMeasurements(landmarks)
      if (bodyMeasurements) {
        setMeasurements(bodyMeasurements)
      } else {
        setMeasurements(null)
      }

      // Draw landmarks
      const drawingUtils = new DrawingUtils(ctx)
      
      // Draw connectors
      drawingUtils.drawConnectors(
        landmarks,
        PoseLandmarker.POSE_CONNECTIONS,
        { color: '#facc15', lineWidth: 2 }
      )
      
      // Draw landmarks
      drawingUtils.drawLandmarks(landmarks, {
        color: '#facc15',
        fillColor: '#8b5cf6',
        radius: 4
      })
    } else {
      setMeasurements(null)
    }

    animationFrameRef.current = requestAnimationFrame(detectPose)
  }

  const startDetection = (canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas
    if (!isLoading && poseLandmarkerRef.current) {
      detectPose()
    }
  }

  const stopDetection = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setMeasurements(null)
  }

  return {
    isLoading,
    measurements,
    startDetection,
    stopDetection
  }
}
