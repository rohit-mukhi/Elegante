import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export interface DressItem {
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

interface SearchContextType {
  searchResults: DressItem[]
  setSearchResults: (results: DressItem[]) => void
  selectedDress: DressItem | null
  setSelectedDress: (dress: DressItem | null) => void
  isSearching: boolean
  setIsSearching: (searching: boolean) => void
  showNoResults: boolean
  setShowNoResults: (show: boolean) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchResults, setSearchResults] = useState<DressItem[]>([])
  const [selectedDress, setSelectedDress] = useState<DressItem | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showNoResults, setShowNoResults] = useState(false)

  return (
    <SearchContext.Provider
      value={{
        searchResults,
        setSearchResults,
        selectedDress,
        setSelectedDress,
        isSearching,
        setIsSearching,
        showNoResults,
        setShowNoResults
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}
