import { useState, useCallback } from 'react'
import { pipeline } from '@xenova/transformers'

export interface ColorRecommendation {
  name: string
  hex: string
}

export interface OutfitCombination {
  top: { color: string; item: string }
  bottom: { color: string; item: string }
  valid: boolean
  score: number
  reason: string
  occasion: string
  season: string
}

export interface DressItem {
  _id: string
  name: string
  category: string
  imageUrl: string
  embedding: number[]
  metadata: {
    season: string
    color: string
  }
}

export interface GeneratedOutfit {
  combination: OutfitCombination
  topItems: DressItem[]
  bottomItems: DressItem[]
}

const BACKEND_URL = 'https://elegante-backend-srp-rm.vercel.app/api'
const SEARCH_URL = `${BACKEND_URL}/search.js`
const SUGGEST_URL = `${BACKEND_URL}/suggestItems.js`
const VALIDATE_URL = `${BACKEND_URL}/validateOutfit.js`

const MIN_VALID_SCORE = 7
const MAX_COMBINATIONS = 10

export function useOutfitGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  const [error, setError] = useState<string | null>(null)

  // Generate color combinations
  const generateCombinations = useCallback((colors: ColorRecommendation[]) => {
    const combinations: Array<{ topColor: string; bottomColor: string }> = []
    
    // Generate all possible pairs (excluding same color)
    for (let i = 0; i < colors.length; i++) {
      for (let j = 0; j < colors.length; j++) {
        if (i !== j) {
          combinations.push({
            topColor: colors[i].name,
            bottomColor: colors[j].name
          })
        }
      }
    }
    
    // Limit to MAX_COMBINATIONS
    return combinations.slice(0, MAX_COMBINATIONS)
  }, [])

  // Get clothing item suggestions from Groq
  const getSuggestions = useCallback(async (topColor: string, bottomColor: string) => {
    try {
      const response = await fetch(SUGGEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topColor, bottomColor })
      })

      if (!response.ok) {
        throw new Error(`Suggestion API error: ${response.status}`)
      }

      const data = await response.json()
      return data.suggestions
    } catch (err) {
      console.error('❌ Suggestion error:', err)
      // Fallback suggestions
      return {
        top: { color: topColor, items: ['shirt', 'blouse', 'top'] },
        bottom: { color: bottomColor, items: ['pants', 'trousers', 'skirt'] }
      }
    }
  }, [])

  // Validate outfit combination with Groq
  const validateCombination = useCallback(async (
    topColor: string,
    topItem: string,
    bottomColor: string,
    bottomItem: string
  ): Promise<OutfitCombination> => {
    try {
      const response = await fetch(VALIDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topColor, topItem, bottomColor, bottomItem })
      })

      if (!response.ok) {
        throw new Error(`Validation API error: ${response.status}`)
      }

      const data = await response.json()
      return {
        top: { color: topColor, item: topItem },
        bottom: { color: bottomColor, item: bottomItem },
        ...data.validation
      }
    } catch (err) {
      console.error('❌ Validation error:', err)
      // Return invalid combination on error
      return {
        top: { color: topColor, item: topItem },
        bottom: { color: bottomColor, item: bottomItem },
        valid: false,
        score: 0,
        reason: 'Validation failed',
        occasion: 'casual',
        season: 'all'
      }
    }
  }, [])

  // Generate embedding for search query
  const generateEmbedding = useCallback(async (text: string): Promise<number[] | null> => {
    try {
      const model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
      const output = await model(text, { pooling: 'mean', normalize: true })
      return Array.from(output.data)
    } catch (err) {
      console.error('❌ Embedding error:', err)
      return null
    }
  }, [])

  // Search database for items
  const searchItems = useCallback(async (
    query: string,
    userFeatures?: any
  ): Promise<DressItem[]> => {
    try {
      const embedding = await generateEmbedding(query)
      if (!embedding) {
        return []
      }

      const response = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding, userFeatures })
      })

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`)
      }

      const data = await response.json()
      return data.items || []
    } catch (err) {
      console.error('❌ Search error:', err)
      return []
    }
  }, [generateEmbedding])

  // Main outfit generation function
  const generateOutfits = useCallback(async (
    colors: ColorRecommendation[],
    userFeatures?: any
  ): Promise<GeneratedOutfit[]> => {
    setIsGenerating(true)
    setError(null)
    const outfits: GeneratedOutfit[] = []

    try {
      // Step 1: Generate color combinations
      setProgress({ current: 1, total: 5, message: 'Generating color combinations...' })
      const combinations = generateCombinations(colors)
      console.log(`🎨 Generated ${combinations.length} color combinations`)

      // Step 2: Get clothing suggestions for each combination
      setProgress({ current: 2, total: 5, message: 'Getting clothing suggestions...' })
      const suggestionsPromises = combinations.map(combo =>
        getSuggestions(combo.topColor, combo.bottomColor)
      )
      const allSuggestions = await Promise.all(suggestionsPromises)
      console.log('👔 Received clothing suggestions')

      // Step 3: Validate combinations
      setProgress({ current: 3, total: 5, message: 'Validating outfit combinations...' })
      const validationPromises: Promise<OutfitCombination>[] = []
      
      for (let i = 0; i < combinations.length; i++) {
        const combo = combinations[i]
        const suggestions = allSuggestions[i]
        
        // Use first suggested item for each
        const topItem = suggestions.top.items[0]
        const bottomItem = suggestions.bottom.items[0]
        
        validationPromises.push(
          validateCombination(combo.topColor, topItem, combo.bottomColor, bottomItem)
        )
      }
      
      const validations = await Promise.all(validationPromises)
      const validCombinations = validations.filter(v => v.valid && v.score >= MIN_VALID_SCORE)
      console.log(`✅ ${validCombinations.length} valid combinations found`)

      if (validCombinations.length === 0) {
        throw new Error('No valid outfit combinations found')
      }

      // Step 4: Search database for items
      setProgress({ current: 4, total: 5, message: 'Finding matching items...' })
      
      for (const combo of validCombinations.slice(0, 5)) { // Limit to top 5
        const topQuery = `${combo.top.color} ${combo.top.item}`
        const bottomQuery = `${combo.bottom.color} ${combo.bottom.item}`
        
        const [topItems, bottomItems] = await Promise.all([
          searchItems(topQuery, userFeatures),
          searchItems(bottomQuery, userFeatures)
        ])
        
        // Only include outfits where we found at least one item for each
        if (topItems.length > 0 && bottomItems.length > 0) {
          outfits.push({
            combination: combo,
            topItems: topItems.slice(0, 3), // Top 3 matches
            bottomItems: bottomItems.slice(0, 3)
          })
        }
      }

      console.log(`🎉 Generated ${outfits.length} complete outfits`)

      if (outfits.length === 0) {
        throw new Error('No matching items found in database')
      }

      setProgress({ current: 5, total: 5, message: 'Outfits ready!' })
      return outfits

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate outfits'
      console.error('❌ Outfit generation error:', errorMessage)
      setError(errorMessage)
      return []
    } finally {
      setIsGenerating(false)
    }
  }, [generateCombinations, getSuggestions, validateCombination, searchItems])

  return {
    generateOutfits,
    isGenerating,
    progress,
    error
  }
}
