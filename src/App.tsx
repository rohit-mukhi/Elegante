import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { VoiceProvider } from './contexts/VoiceContext'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Mirror from './pages/Mirror'
import Stylist from './pages/Stylist'

function App() {
  return (
    <Router>
      <VoiceProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/mirror" element={<Mirror />} />
          <Route path="/stylist" element={<Stylist />} />
        </Routes>
      </VoiceProvider>
    </Router>
  )
}

export default App
