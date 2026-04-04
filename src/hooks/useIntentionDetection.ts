import { useState, useEffect, useRef } from 'react'
import * as tf from '@tensorflow/tfjs'

interface IntentionResult {
  intent: string
  confidence: number
}

interface IntentionModelMetadata {
  intents: string[]
  vocabulary?: string[]
  maxLength?: number
}

export function useIntentionDetection() {
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const modelRef = useRef<tf.LayersModel | null>(null)
  const metadataRef = useRef<IntentionModelMetadata | null>(null)

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Loading intention detection model...')
        
        // Check if model exists
        const modelPath = '/models/Intention-Detection-Model/model.json'
        const metadataPath = '/models/Intention-Detection-Model/metadata.json'
        
        const [model, metadataResponse] = await Promise.all([
          tf.loadLayersModel(modelPath),
          fetch(metadataPath)
        ])

        const metadata = await metadataResponse.json()
        
        modelRef.current = model
        metadataRef.current = metadata
        setIsModelLoading(false)
        
        console.log('Intention detection model loaded successfully!')
        console.log('Available intents:', metadata.intents)
      } catch (error) {
        console.error('Failed to load intention detection model:', error)
        console.log('Voice navigation will work without ML model (fallback to keyword matching)')
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

  const detectIntention = async (transcript: string): Promise<IntentionResult | null> => {
    if (!transcript || transcript.trim().length === 0) {
      return null
    }

    setIsProcessing(true)

    try {
      // If model is loaded, use ML prediction
      if (modelRef.current && metadataRef.current) {
        console.log('Using ML model for intention detection:', transcript)
        
        // TODO: Implement preprocessing based on your model's requirements
        // This is a placeholder - you'll need to adjust based on your model architecture
        // Common approaches: tokenization, padding, embedding lookup, etc.
        
        // Example: If your model expects text input directly
        // const inputTensor = preprocessText(transcript, metadataRef.current)
        // const prediction = modelRef.current.predict(inputTensor) as tf.Tensor
        // const predictionData = await prediction.data()
        
        // For now, return null to trigger fallback
        console.log('ML model preprocessing not yet implemented - using fallback')
        return null
      } else {
        // Fallback to keyword-based detection
        return keywordBasedIntention(transcript)
      }
    } catch (error) {
      console.error('Error detecting intention:', error)
      return keywordBasedIntention(transcript)
    } finally {
      setIsProcessing(false)
    }
  }

  // Fallback keyword-based intention detection
  const keywordBasedIntention = (transcript: string): IntentionResult | null => {
    const text = transcript.toLowerCase().trim()
    
    // Navigation intents
    if (text.includes('home') || text.includes('go home') || text.includes('main page')) {
      return { intent: 'navigate_home', confidence: 0.9 }
    }
    if (text.includes('mirror') || text.includes('try on') || text.includes('virtual try')) {
      return { intent: 'navigate_mirror', confidence: 0.9 }
    }
    if (text.includes('stylist') || text.includes('color') || text.includes('style') || text.includes('recommendation')) {
      return { intent: 'navigate_stylist', confidence: 0.9 }
    }
    if (text.includes('profile') || text.includes('my profile') || text.includes('account')) {
      return { intent: 'navigate_profile', confidence: 0.9 }
    }
    
    // Category selection intents
    if (text.includes('mens') || text.includes('men')) {
      return { intent: 'select_category_mens', confidence: 0.85 }
    }
    if (text.includes('womens') || text.includes('women') || text.includes('ladies')) {
      return { intent: 'select_category_womens', confidence: 0.85 }
    }
    if (text.includes('kids') || text.includes('children')) {
      return { intent: 'select_category_kids', confidence: 0.85 }
    }
    if (text.includes('ethnic') || text.includes('traditional')) {
      return { intent: 'select_category_ethnic', confidence: 0.85 }
    }
    if (text.includes('casual')) {
      return { intent: 'select_category_casuals', confidence: 0.85 }
    }
    if (text.includes('formal')) {
      return { intent: 'select_category_formal', confidence: 0.85 }
    }
    if (text.includes('sports') || text.includes('athletic')) {
      return { intent: 'select_category_sports', confidence: 0.85 }
    }
    
    // Camera control intents
    if (text.includes('start camera') || text.includes('activate camera') || text.includes('turn on camera')) {
      return { intent: 'camera_start', confidence: 0.9 }
    }
    if (text.includes('stop camera') || text.includes('turn off camera') || text.includes('close camera')) {
      return { intent: 'camera_stop', confidence: 0.9 }
    }
    if (text.includes('analyze') || text.includes('scan') || text.includes('detect')) {
      return { intent: 'analyze_features', confidence: 0.85 }
    }
    
    // General commands
    if (text.includes('back') || text.includes('go back')) {
      return { intent: 'navigate_back', confidence: 0.9 }
    }
    if (text.includes('help') || text.includes('what can you do')) {
      return { intent: 'show_help', confidence: 0.9 }
    }
    
    return null
  }

  return {
    isModelLoading,
    isProcessing,
    detectIntention,
    isModelAvailable: modelRef.current !== null
  }
}
