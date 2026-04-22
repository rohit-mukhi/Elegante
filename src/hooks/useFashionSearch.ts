import { useState, useCallback } from 'react'

export interface FashionItem {
  _id: string
  name: string
  category: string
  cloudinaryUrl: string
  embedding: number[]
  metadata: {
    season: string
    color: string
  }
}

export interface SearchResult {
  items: FashionItem[]
  success: boolean
  error?: string
}

const BACKEND_URL = 'https://elegante-backend-srp-rm.vercel.app/api/search.js'

export function useFashionSearch() {
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<FashionItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (
    embedding: number[],
    userFeatures?: {
      hairColor?: string
      eyeColor?: string
      skinTone?: string
      underTone?: string
      bodyType?: string
    }
  ): Promise<SearchResult> => {
    setIsSearching(true)
    setError(null)

    try {
      console.log('🔍 Sending search request to backend...')
      console.log('📊 Embedding dimensions:', embedding.length)
      console.log('👤 User features:', userFeatures)

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embedding,
          userFeatures
        })
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Search failed')
      }

      console.log('✅ Search results received:', data.items?.length || 0, 'items')
      setResults(data.items || [])

      return {
        items: data.items || [],
        success: true
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      console.error('❌ Search error:', errorMessage)
      setError(errorMessage)
      setResults([])

      return {
        items: [],
        success: false,
        error: errorMessage
      }
    } finally {
      setIsSearching(false)
    }
  }, [])

  return {
    search,
    isSearching,
    results,
    error
  }
}
