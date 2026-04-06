import { useState, useEffect, useRef } from 'react'
import * as tf from '@tensorflow/tfjs'

interface ModelMetadata {
  features: {
    'Hair Color': string[]
    'Eye Color': string[]
    'Skin Tone': string[]
    'Under Tone': string[]
    'Torso length': string[]
    'Body Proportion': string[]
  }
  labels: string[]
}

export interface ColorRecommendations {
  colors: Array<{ name: string; confidence: number }>
  topColors: string[]
}

export interface ColorLoadingProgress {
  stage: 'idle' | 'loading-model' | 'loading-metadata' | 'initializing-backend' | 'generating' | 'complete'
  message: string
  progress: number
}

export function useColorRecommendation() {
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [isRecommending, setIsRecommending] = useState(false)
  const [colorProgress, setColorProgress] = useState<ColorLoadingProgress>({
    stage: 'idle',
    message: '',
    progress: 0
  })
  const modelRef = useRef<tf.LayersModel | null>(null)
  const metadataRef = useRef<ModelMetadata | null>(null)

  useEffect(() => {
    const loadModel = async () => {
      try {
        setColorProgress({
          stage: 'initializing-backend',
          message: 'Initializing TensorFlow.js...',
          progress: 5
        })

        console.log('Starting to load model and metadata...')
        
        // Set TensorFlow.js backend explicitly for mobile compatibility
        await tf.ready()
        console.log('TensorFlow.js backend:', tf.getBackend())
        
        setColorProgress({
          stage: 'initializing-backend',
          message: 'Configuring GPU acceleration...',
          progress: 15
        })

        // Try to use WebGL, fallback to WASM or CPU if needed
        try {
          await tf.setBackend('webgl')
          console.log('Using WebGL backend')
          setColorProgress({
            stage: 'initializing-backend',
            message: 'GPU acceleration enabled',
            progress: 25
          })
        } catch (e) {
          console.warn('WebGL not available, trying WASM...')
          setColorProgress({
            stage: 'initializing-backend',
            message: 'GPU unavailable, trying WASM...',
            progress: 20
          })
          try {
            await tf.setBackend('wasm')
            console.log('Using WASM backend')
            setColorProgress({
              stage: 'initializing-backend',
              message: 'WASM acceleration enabled',
              progress: 25
            })
          } catch (e2) {
            console.warn('WASM not available, using CPU backend')
            await tf.setBackend('cpu')
            setColorProgress({
              stage: 'initializing-backend',
              message: 'Using CPU (slower)',
              progress: 25
            })
          }
        }
        
        await tf.ready()
        console.log('Final backend:', tf.getBackend())
        
        setColorProgress({
          stage: 'loading-model',
          message: 'Downloading color recommendation model...',
          progress: 40
        })

        const modelPromise = tf.loadLayersModel('/models/Color-Recommendation-Model/model.json')
        
        setColorProgress({
          stage: 'loading-metadata',
          message: 'Loading color categories...',
          progress: 60
        })

        const metadataPromise = fetch('/models/Color-Recommendation-Model/metadata.json')

        const [model, metadataResponse] = await Promise.all([modelPromise, metadataPromise])

        console.log('Model loaded:', model)
        console.log('Metadata response:', metadataResponse)

        if (!metadataResponse.ok) {
          throw new Error(`Failed to fetch metadata: ${metadataResponse.status}`)
        }

        setColorProgress({
          stage: 'loading-metadata',
          message: 'Processing color data...',
          progress: 80
        })

        const metadata = await metadataResponse.json()
        console.log('Metadata parsed:', metadata)

        setColorProgress({
          stage: 'complete',
          message: 'Color model ready!',
          progress: 100
        })

        modelRef.current = model
        metadataRef.current = metadata
        
        setTimeout(() => {
          setIsModelLoading(false)
          setColorProgress({ stage: 'idle', message: '', progress: 0 })
        }, 500)

        console.log('Model and metadata successfully loaded!')
      } catch (error) {
        console.error('Failed to load color recommendation model:', error)
        setColorProgress({
          stage: 'idle',
          message: 'Failed to load model',
          progress: 0
        })
        alert(`Color recommendation model failed to load: ${error instanceof Error ? error.message : 'Unknown error'}. Please refresh the page.`)
        setIsModelLoading(false)
      }
    }

    loadModel()

    return () => {
      if (modelRef.current) {
        modelRef.current.dispose()
      }
    }
  }, [])

  const labelEncode = (value: string, categories: string[]): number => {
    const index = categories.findIndex(cat => cat.toLowerCase() === value.toLowerCase())
    console.log(`Encoding "${value}" in categories:`, categories, 'Index found:', index)
    // Return the index, or 0 if not found
    return index !== -1 ? index : 0
  }

  const getRecommendations = async (
    hairColor: string,
    eyeColor: string,
    skinTone: string,
    underTone: string,
    torsoLength: string,
    bodyType: string
  ): Promise<ColorRecommendations | null> => {
    if (!modelRef.current || !metadataRef.current) {
      console.error('Model or metadata not loaded')
      alert('Color recommendation model not ready. Please wait and try again.')
      return null
    }

    setIsRecommending(true)
    setColorProgress({
      stage: 'generating',
      message: 'Encoding your features...',
      progress: 20
    })

    try {
      const metadata = metadataRef.current
      console.log('Metadata loaded:', metadata)

      // Label encode all features (return index, not one-hot)
      const hairEncoded = labelEncode(hairColor, metadata.features['Hair Color'])
      const eyeEncoded = labelEncode(eyeColor, metadata.features['Eye Color'])
      const skinEncoded = labelEncode(skinTone, metadata.features['Skin Tone'])
      const underToneEncoded = labelEncode(underTone, metadata.features['Under Tone'])
      const torsoEncoded = labelEncode(torsoLength, metadata.features['Torso length'])
      const bodyEncoded = labelEncode(bodyType, metadata.features['Body Proportion'])

      // Create input array with 6 features
      const inputFeatures = [
        hairEncoded,
        eyeEncoded,
        skinEncoded,
        underToneEncoded,
        torsoEncoded,
        bodyEncoded
      ]

      console.log('Input features length:', inputFeatures.length)
      console.log('Input features:', inputFeatures)

      setColorProgress({
        stage: 'generating',
        message: 'Running AI color analysis...',
        progress: 50
      })

      // Create tensor and predict with error handling
      let inputTensor: tf.Tensor2D | null = null
      let prediction: tf.Tensor | null = null
      
      try {
        inputTensor = tf.tensor2d([inputFeatures])
        console.log('Input tensor created:', inputTensor.shape)
        
        setColorProgress({
          stage: 'generating',
          message: 'Calculating color matches...',
          progress: 70
        })

        prediction = modelRef.current.predict(inputTensor) as tf.Tensor
        console.log('Prediction tensor created:', prediction.shape)
        
        const predictionData = await prediction.data()
        console.log('Prediction data:', predictionData)

        setColorProgress({
          stage: 'generating',
          message: 'Selecting best colors...',
          progress: 90
        })

        // Clean up tensors
        inputTensor.dispose()
        prediction.dispose()

        // Map predictions to color names with confidence scores
        const colorConfidences = metadata.labels.map((color, index) => ({
          name: color,
          confidence: predictionData[index]
        }))

        console.log('Color confidences:', colorConfidences)

        // Sort by confidence and get top colors (threshold > 0.5)
        const sortedColors = colorConfidences
          .sort((a, b) => b.confidence - a.confidence)

        const topColors = sortedColors
          .filter(c => c.confidence > 0.5)
          .map(c => c.name)

        // If no colors above threshold, take top 3
        if (topColors.length === 0) {
          topColors.push(...sortedColors.slice(0, 3).map(c => c.name))
        }

        console.log('Top colors:', topColors)

        setColorProgress({
          stage: 'complete',
          message: 'Colors ready!',
          progress: 100
        })

        setTimeout(() => {
          setColorProgress({ stage: 'idle', message: '', progress: 0 })
        }, 1000)

        return {
          colors: sortedColors,
          topColors
        }
      } catch (tensorError) {
        // Clean up on error
        if (inputTensor) inputTensor.dispose()
        if (prediction) prediction.dispose()
        throw tensorError
      }
    } catch (error) {
      console.error('Error getting color recommendations:', error)
      setColorProgress({
        stage: 'idle',
        message: 'Generation failed',
        progress: 0
      })
      alert(`Failed to generate color recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null
    } finally {
      setIsRecommending(false)
    }
  }

  return {
    isModelLoading,
    isRecommending,
    colorProgress,
    getRecommendations
  }
}
