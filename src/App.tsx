import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { VoiceProvider } from './contexts/VoiceContext'
import { SearchProvider } from './contexts/SearchContext'
import { DeviceCapabilityProvider } from './contexts/DeviceCapabilityContext'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Mirror from './pages/Mirror'
import Stylist from './pages/Stylist'
import AddDress from './pages/AddDress'

function App() {
  return (
    <Router>
      <DeviceCapabilityProvider>
        <VoiceProvider>
          <SearchProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/home" element={<Home />} />
              <Route path="/mirror" element={<Mirror />} />
              <Route path="/stylist" element={<Stylist />} />
              <Route path="/add-dress" element={<AddDress />} />
            </Routes>
          </SearchProvider>
        </VoiceProvider>
      </DeviceCapabilityProvider>
    </Router>
  )
}

export default App
