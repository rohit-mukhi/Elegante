import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { VoiceProvider } from './contexts/VoiceContext'
import { SearchProvider } from './contexts/SearchContext'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Mirror from './pages/Mirror'
import Stylist from './pages/Stylist'

function App() {
  return (
    <Router>
      <VoiceProvider>
        <SearchProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Home />} />
            <Route path="/mirror" element={<Mirror />} />
            <Route path="/stylist" element={<Stylist />} />
          </Routes>
        </SearchProvider>
      </VoiceProvider>
    </Router>
  )
}

export default App
