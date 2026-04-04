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

  // Fallback keyword-based intention detection with fuzzy matching
  const keywordBasedIntention = (transcript: string): IntentionResult | null => {
    const text = transcript.toLowerCase().trim()
    
    // Navigation intents - with fuzzy matching for mishearings
    if (text.includes('home') || text.includes('hom') || text.includes('go home') || text.includes('main page') || text.includes('homepage')) {
      return { intent: 'navigate_home', confidence: 0.9 }
    }
    
    // Mirror variations: mirror, mira, meer, virtual try, try on
    if (text.includes('mirror') || text.includes('mira') || text.includes('meer') || text.includes('try on') || text.includes('virtual try') || text.includes('tryon')) {
      return { intent: 'navigate_mirror', confidence: 0.9 }
    }
    
    // Stylist variations: stylist, stylish, styles, styling, style, color, colours
    if (text.includes('stylist') || text.includes('stylish') || text.includes('styles') || text.includes('styling') || text.includes('style') || text.includes('color') || text.includes('colour') || text.includes('recommendation') || text.includes('suggest')) {
      return { intent: 'navigate_stylist', confidence: 0.9 }
    }
    
    // Profile variations
    if (text.includes('profile') || text.includes('profil') || text.includes('my profile') || text.includes('account') || text.includes('settings')) {
      return { intent: 'navigate_profile', confidence: 0.9 }
    }
    
    // Category selection intents with fuzzy matching
    // Mens: mens, men, man, male
    if (text.includes('mens') || text.includes('men') || text.includes('man') || text.includes('male') || text.includes('boys')) {
      return { intent: 'select_category_mens', confidence: 0.85 }
    }
    
    // Womens: womens, women, woman, female, ladies, girls
    if (text.includes('womens') || text.includes('women') || text.includes('woman') || text.includes('female') || text.includes('ladies') || text.includes('girls')) {
      return { intent: 'select_category_womens', confidence: 0.85 }
    }
    
    // Kids: kids, kid, children, child
    if (text.includes('kids') || text.includes('kid') || text.includes('children') || text.includes('child')) {
      return { intent: 'select_category_kids', confidence: 0.85 }
    }
    
    // Ethnic: ethnic, traditional, cultural
    if (text.includes('ethnic') || text.includes('ethnik') || text.includes('traditional') || text.includes('cultural')) {
      return { intent: 'select_category_ethnic', confidence: 0.85 }
    }
    
    // Casual: casual, casuals, causal (common mishearing)
    if (text.includes('casual') || text.includes('causal') || text.includes('casuals')) {
      return { intent: 'select_category_casuals', confidence: 0.85 }
    }
    
    // Formal: formal, formals
    if (text.includes('formal') || text.includes('formals')) {
      return { intent: 'select_category_formal', confidence: 0.85 }
    }
    
    // Sports: sports, sport, athletic, gym, fitness
    if (text.includes('sports') || text.includes('sport') || text.includes('athletic') || text.includes('gym') || text.includes('fitness')) {
      return { intent: 'select_category_sports', confidence: 0.85 }
    }
    
    // Camera control intents with fuzzy matching
    // Start camera: start, open, turn on, activate, enable
    if ((text.includes('start') || text.includes('open') || text.includes('turn on') || text.includes('activate') || text.includes('enable')) && 
        (text.includes('camera') || text.includes('cam') || text.includes('video'))) {
      return { intent: 'camera_start', confidence: 0.9 }
    }
    
    // Stop camera: stop, close, turn off, deactivate, disable
    if ((text.includes('stop') || text.includes('close') || text.includes('turn off') || text.includes('deactivate') || text.includes('disable')) && 
        (text.includes('camera') || text.includes('cam') || text.includes('video'))) {
      return { intent: 'camera_stop', confidence: 0.9 }
    }
    
    // Analyze: analyze, analyse, scan, detect, check
    if (text.includes('analyze') || text.includes('analyse') || text.includes('scan') || text.includes('detect') || text.includes('check')) {
      return { intent: 'analyze_features', confidence: 0.85 }
    }
    
    // General commands - check for back first before other navigation
    // Back: back, go back, previous, return
    if (text.includes('back') || text.includes('go back') || text.includes('previous') || text.includes('return')) {
      return { intent: 'navigate_back', confidence: 0.9 }
    }
    
    // Help: help, what can you do, commands, assist
    if (text.includes('help') || text.includes('what can you do') || text.includes('commands') || text.includes('assist')) {
      return { intent: 'show_help', confidence: 0.9 }
    }
    
    console.log('⚠️ No matching intent found for:', text)
    return null
  }

  return {
    isModelLoading,
    isProcessing,
    detectIntention,
    isModelAvailable: modelRef.current !== null
  }
}
