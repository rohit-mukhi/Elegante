import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Hamburger from 'hamburger-react'

export default function Landing() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    AOS.init({ 
      duration: 1000, 
      once: false,
      mirror: true
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-purple-950/85 border-b border-yellow-500/25">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-3xl font-bold text-white">
            Elegante
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-gray-200 hover:text-yellow-400 transition">Features</a>
            <a href="#how-it-works" className="text-gray-200 hover:text-yellow-400 transition">How It Works</a>
            <button
              onClick={() => navigate('/mirror')}
              className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-gray-300 text-purple-950 rounded-full font-semibold hover:shadow-lg hover:shadow-yellow-400/50 transition"
            >
              Try Now
            </button>
          </div>
          <div className="md:hidden">
            <Hamburger toggled={isOpen} toggle={setIsOpen} color="#facc15" />
          </div>
        </div>
        {isOpen && (
          <div className="md:hidden bg-purple-950/90 backdrop-blur-md border-t border-yellow-500/25 p-4 space-y-4">
            <a href="#features" className="block text-gray-200 hover:text-yellow-400 transition">Features</a>
            <a href="#how-it-works" className="block text-gray-200 hover:text-yellow-400 transition">How It Works</a>
            <button
              onClick={() => {
                navigate('/mirror')
                setIsOpen(false)
              }}
              className="w-full px-6 py-2 bg-gradient-to-r from-yellow-400 to-gray-300 text-purple-950 rounded-full font-semibold"
            >
              Try Now
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white">
                Your Personal <span className="bg-gradient-to-r from-yellow-400 via-gray-300 to-yellow-400 bg-clip-text text-transparent">AI Stylist</span>
              </h1>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Discover your perfect colors using advanced AI and color theory. See how clothes look on you before you buy—no returns, no regrets.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/mirror')}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-gray-300 text-purple-950 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-yellow-400/50 transition transform hover:scale-105"
                >
                  Start Styling
                </button>
                <button className="px-8 py-4 border-2 border-yellow-400 text-yellow-400 rounded-full font-bold text-lg hover:bg-yellow-400/10 transition">
                  Learn More
                </button>
              </div>
            </div>
            <div data-aos="fade-left" className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-gray-300/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-violet-900/70 to-purple-950/70 backdrop-blur-xl rounded-3xl p-8 border border-yellow-400/35">
                <div className="aspect-square bg-gradient-to-br from-yellow-400/10 to-gray-300/10 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">✨</div>
                    <p className="text-gray-200">AI-Powered Virtual Try-On</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-purple-950/25">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
            Why <span className="bg-gradient-to-r from-yellow-400 to-gray-300 bg-clip-text text-transparent">Elegante</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎨',
                title: 'Color Science',
                desc: 'AI analyzes your skin tone and recommends colors from the 12-season color theory'
              },
              {
                icon: '👁️',
                title: 'Virtual Try-On',
                desc: 'See how clothes look on you in real-time with our advanced mirror technology'
              },
              {
                icon: '🎯',
                title: 'Smart Recommendations',
                desc: 'Get personalized product suggestions that actually match your style'
              },
              {
                icon: '🌍',
                title: 'Sustainable Fashion',
                desc: 'Reduce returns and waste by making confident purchasing decisions'
              },
              {
                icon: '🔒',
                title: 'Privacy First',
                desc: 'All processing happens on your device—your data never leaves your phone'
              },
              {
                icon: '🎤',
                title: 'Voice Commands',
                desc: 'Navigate hands-free with natural voice interactions'
              }
            ].map((feature, i) => (
              <div
                key={i}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                className="group p-8 rounded-2xl bg-gradient-to-br from-violet-900/55 to-purple-950/55 border border-yellow-400/25 hover:border-yellow-400/55 transition hover:shadow-lg hover:shadow-yellow-400/25"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-yellow-400 group-hover:text-gray-300 transition">{feature.title}</h3>
                <p className="text-gray-200 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
            How It <span className="bg-gradient-to-r from-yellow-400 to-gray-300 bg-clip-text text-transparent">Works</span>
          </h2>
          <div className="space-y-8">
            {[
              { step: '1', title: 'Activate Mirror Mode', desc: 'Position yourself in front of your camera for a full-body view' },
              { step: '2', title: 'AI Analysis', desc: 'Our AI analyzes your skin tone, eye color, and features in real-time' },
              { step: '3', title: 'Get Your Season', desc: 'Discover your color season and receive personalized recommendations' },
              { step: '4', title: 'Virtual Try-On', desc: 'Browse and try on clothes virtually to see what suits you best' },
              { step: '5', title: 'Shop with Confidence', desc: 'Make purchases knowing exactly how items will look on you' }
            ].map((item, i) => (
              <div
                key={i}
                data-aos="fade-right"
                data-aos-delay={i * 100}
                className="flex gap-8 items-start"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-gray-300 flex items-center justify-center text-purple-950 font-bold text-2xl">
                  {item.step}
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-2xl font-bold mb-2 text-white">{item.title}</h3>
                  <p className="text-gray-200 text-lg">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-yellow-400/12 to-gray-300/12 border-y border-yellow-400/35">
        <div className="max-w-4xl mx-auto text-center" data-aos="zoom-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Transform Your Style?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Join thousands discovering their perfect colors with AI-powered styling
          </p>
          <button
            onClick={() => navigate('/mirror')}
            className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-gray-300 text-purple-950 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-yellow-400/50 transition transform hover:scale-105"
          >
            Start Your Journey
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-yellow-400/20 bg-purple-950/65">
        <div className="max-w-6xl mx-auto text-center text-gray-200">
          <p>© 2024 Elegante. Powered by AI & Color Science.</p>
        </div>
      </footer>
    </div>
  )
}
