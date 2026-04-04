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

export function useColorRecommendation() {
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [isRecommending, setIsRecommending] = useState(false)
  const modelRef = useRef<tf.LayersModel | null>(null)
  const metadataRef = useRef<ModelMetadata | null>(null)

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Starting to load model and metadata...')
        
        const [model, metadataResponse] = await Promise.all([
          tf.loadLayersModel('/models/Color-Recommendation-Model/model.json'),
          fetch('/models/Color-Recommendation-Model/metadata.json')
        ])

        console.log('Model loaded:', model)
        console.log('Metadata response:', metadataResponse)

        const metadata = await metadataResponse.json()
        console.log('Metadata parsed:', metadata)

        modelRef.current = model
        metadataRef.current = metadata
        setIsModelLoading(false)
        console.log('Model and metadata successfully loaded!')
      } catch (error) {
        console.error('Failed to load color recommendation model:', error)
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
      console.log('Model or metadata not loaded')
      return null
    }

    setIsRecommending(true)

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

      // Create tensor and predict
      const inputTensor = tf.tensor2d([inputFeatures])
      const prediction = modelRef.current.predict(inputTensor) as tf.Tensor
      const predictionData = await prediction.data()

      console.log('Prediction data:', predictionData)

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

      return {
        colors: sortedColors,
        topColors
      }
    } catch (error) {
      console.error('Error getting color recommendations:', error)
      return null
    } finally {
      setIsRecommending(false)
    }
  }

  return {
    isModelLoading,
    isRecommending,
    getRecommendations
  }
}
