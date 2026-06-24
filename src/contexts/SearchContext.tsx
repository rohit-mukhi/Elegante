import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

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

export interface UserFeatures {
  hairColor: string
  eyeColor: string
  skinTone: string
  underTone: string
  bodyType: string
}

export interface PendingSearch {
  query: string
  embedding: number[]
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
  userFeatures: UserFeatures | null
  setUserFeatures: (features: UserFeatures | null) => void
  pendingSearch: PendingSearch | null
  setPendingSearch: (search: PendingSearch | null) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchResults, setSearchResults] = useState<DressItem[]>([])
  const [selectedDress, setSelectedDress] = useState<DressItem | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showNoResults, setShowNoResults] = useState(false)
  const [userFeatures, setUserFeatures] = useState<UserFeatures | null>(null)
  const [pendingSearch, setPendingSearch] = useState<PendingSearch | null>(null)

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
        setShowNoResults,
        userFeatures,
        setUserFeatures,
        pendingSearch,
        setPendingSearch
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
