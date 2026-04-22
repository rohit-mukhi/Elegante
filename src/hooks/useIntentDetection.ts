import { useState, useRef, useCallback } from 'react'
import { pipeline, Pipeline } from '@xenova/transformers'

export interface IntentResult {
  intent: string
  confidence: number
}

export interface IntentProgress {
  stage: 'idle' | 'loading' | 'ready' | 'processing'
  message: string
  progress: number
}

export function useIntentDetection() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<IntentProgress>({
    stage: 'idle',
    message: '',
    progress: 0
  })
  const pipelineRef = useRef<Pipeline | null>(null)
  const isInitializedRef = useRef(false)

  // Define your intents with example phrases
  const intents = {
    back: "navigate to previous page go back return",
    home: "go to home page main page homepage",
    open_mirror: "open virtual mirror try on clothes show mirror",
    open_stylist: "open stylist page color analysis style analysis",
    start_camera: "start camera turn on camera activate camera",
    stop_camera: "stop camera turn off camera deactivate camera",
    analyze: "analyze my features scan appearance detect colors what colors suit me",
    search_outfit: "show me dress find outfit search clothes wedding party formal casual",
    try_dress: "try dress wear put on select choose",
    next_dress: "next dress show next move forward",
    previous_dress: "previous dress go back show previous"
  }

  const initialize = useCallback(async () => {
    if (isInitializedRef.current) {
      return true
    }

    setIsLoading(true)
    try {
      setProgress({
        stage: 'loading',
        message: 'Downloading MiniLM model...',
        progress: 20
      })

      console.log('Loading MiniLM model for intent detection...')
      
      // Load MiniLM model for feature extraction
      const extractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        {
          progress_callback: (progressData: any) => {
            if (progressData.status === 'progress') {
              const percent = Math.round((progressData.loaded / progressData.total) * 100)
              setProgress({
                stage: 'loading',
                message: `Downloading model... ${percent}%`,
                progress: 20 + (percent * 0.6)
              })
            }
          }
        }
      )

      setProgress({
        stage: 'loading',
        message: 'Initializing model...',
        progress: 90
      })

      pipelineRef.current = extractor as any
      isInitializedRef.current = true

      setProgress({
        stage: 'ready',
        message: 'Model ready!',
        progress: 100
      })

      console.log('MiniLM model loaded successfully')
      
      setTimeout(() => {
        setIsLoading(false)
        setProgress({ stage: 'idle', message: '', progress: 0 })
      }, 500)
      
      return true
    } catch (error) {
      console.error('Failed to load MiniLM model:', error)
      setProgress({
        stage: 'idle',
        message: 'Failed to load model',
        progress: 0
      })
      alert(`Failed to load intent detection model: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsLoading(false)
      return false
    }
  }, [])

  // Calculate cosine similarity between two vectors
  const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
    return dotProduct / (magnitudeA * magnitudeB)
  }

  const detectIntent = useCallback(async (transcript: string): Promise<IntentResult | null> => {
    if (!pipelineRef.current) {
      console.error('Model not initialized')
      return null
    }

    if (!transcript || transcript.trim().length === 0) {
      return null
    }

    setProgress({
      stage: 'processing',
      message: 'Detecting intent...',
      progress: 50
    })

    try {
      console.log('Detecting intent for:', transcript)

      // Get embedding for user input
      const userEmbedding = await pipelineRef.current(transcript, {
        pooling: 'mean',
        normalize: true
      })

      // Get embeddings for all intents
      const intentScores: { intent: string; score: number }[] = []
      
      for (const [intentName, intentDescription] of Object.entries(intents)) {
        const intentEmbedding = await pipelineRef.current(intentDescription, {
          pooling: 'mean',
          normalize: true
        })

        // Calculate similarity
        const similarity = cosineSimilarity(
          Array.from(userEmbedding.data),
          Array.from(intentEmbedding.data)
        )

        intentScores.push({
          intent: intentName,
          score: similarity
        })
      }

      // Sort by score and get best match
      intentScores.sort((a, b) => b.score - a.score)
      const bestMatch = intentScores[0]

      console.log('Intent scores:', intentScores)
      console.log('Best match:', bestMatch)

      setProgress({
        stage: 'idle',
        message: '',
        progress: 0
      })

      // Return best match if confidence is above threshold
      if (bestMatch.score > 0.35) {  // Lowered from 0.5 for better mobile performance
        return {
          intent: bestMatch.intent,
          confidence: bestMatch.score
        }
      }

      return null
    } catch (error) {
      console.error('Error detecting intent:', error)
      setProgress({
        stage: 'idle',
        message: '',
        progress: 0
      })
      return null
    }
  }, [intents])

  const generateEmbedding = useCallback(async (text: string): Promise<number[] | null> => {
    if (!pipelineRef.current) {
      console.error('Model not initialized')
      return null
    }

    try {
      const embedding = await pipelineRef.current(text, {
        pooling: 'mean',
        normalize: true
      })
      return Array.from(embedding.data)
    } catch (error) {
      console.error('Error generating embedding:', error)
      return null
    }
  }, [])

  const dispose = useCallback(() => {
    console.log('Disposing MiniLM model...')
    pipelineRef.current = null
    isInitializedRef.current = false
    setIsLoading(false)
  }, [])

  return {
    isLoading,
    progress,
    initialize,
    detectIntent,
    generateEmbedding,
    dispose
  }
}
