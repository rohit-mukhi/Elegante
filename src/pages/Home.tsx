import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const deals = [
  { id: 1, title: 'Summer Sale - Up to 50% Off', image: '🌞', bg: 'from-yellow-400 to-orange-500' },
  { id: 2, title: 'New Arrivals - Fresh Styles', image: '✨', bg: 'from-purple-500 to-pink-500' },
  { id: 3, title: 'Winter Collection - Stay Warm', image: '❄️', bg: 'from-blue-500 to-cyan-500' },
  { id: 4, title: 'Exclusive Deals - Limited Time', image: '🎁', bg: 'from-green-500 to-teal-500' },
]

const categories = [
  { id: 'mens', name: 'Mens', icon: '👔' },
  { id: 'womens', name: 'Womens', icon: '👗' },
  { id: 'kids', name: 'Kids', icon: '🧸' },
  { id: 'ethnic', name: 'Ethnic', icon: '🪷' },
  { id: 'casuals', name: 'Casuals', icon: '👕' },
  { id: 'formal', name: 'Formal', icon: '🎩' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
]

const productsByCategory: Record<string, any[]> = {
  mens: [
    { id: 1, name: 'Classic Shirt', price: '$49', image: '👔', color: 'Blue' },
    { id: 2, name: 'Denim Jacket', price: '$89', image: '🧥', color: 'Indigo' },
    { id: 3, name: 'Casual Tee', price: '$29', image: '👕', color: 'White' },
    { id: 4, name: 'Formal Blazer', price: '$129', image: '🎩', color: 'Black' },
    { id: 5, name: 'Chino Pants', price: '$59', image: '👖', color: 'Khaki' },
  ],
  womens: [
    { id: 1, name: 'Floral Dress', price: '$79', image: '👗', color: 'Pink' },
    { id: 2, name: 'Silk Blouse', price: '$69', image: '👚', color: 'Cream' },
    { id: 3, name: 'Maxi Skirt', price: '$59', image: '🩱', color: 'Navy' },
    { id: 4, name: 'Evening Gown', price: '$149', image: '👗', color: 'Red' },
    { id: 5, name: 'Cardigan', price: '$49', image: '🧶', color: 'Beige' },
  ],
  kids: [
    { id: 1, name: 'Cartoon Tee', price: '$19', image: '👕', color: 'Yellow' },
    { id: 2, name: 'Denim Shorts', price: '$29', image: '🩳', color: 'Blue' },
    { id: 3, name: 'Hoodie', price: '$39', image: '🧥', color: 'Green' },
    { id: 4, name: 'Sneakers', price: '$49', image: '👟', color: 'Multi' },
    { id: 5, name: 'Cap', price: '$15', image: '🧢', color: 'Red' },
  ],
  ethnic: [
    { id: 1, name: 'Silk Saree', price: '$99', image: '🪷', color: 'Gold' },
    { id: 2, name: 'Kurta Set', price: '$69', image: '👳', color: 'White' },
    { id: 3, name: 'Lehenga', price: '$149', image: '💃', color: 'Maroon' },
    { id: 4, name: 'Sherwani', price: '$199', image: '🤵', color: 'Ivory' },
    { id: 5, name: 'Dupatta', price: '$39', image: '🧣', color: 'Pink' },
  ],
  casuals: [
    { id: 1, name: 'Polo Shirt', price: '$39', image: '👕', color: 'Navy' },
    { id: 2, name: 'Joggers', price: '$49', image: '👖', color: 'Grey' },
    { id: 3, name: 'Sneakers', price: '$79', image: '👟', color: 'White' },
    { id: 4, name: 'Baseball Cap', price: '$25', image: '🧢', color: 'Black' },
    { id: 5, name: 'Backpack', price: '$59', image: '🎒', color: 'Blue' },
  ],
  formal: [
    { id: 1, name: 'Suit', price: '$299', image: '🤵', color: 'Charcoal' },
    { id: 2, name: 'Dress Shoes', price: '$129', image: '👞', color: 'Brown' },
    { id: 3, name: 'Tie', price: '$29', image: '👔', color: 'Burgundy' },
    { id: 4, name: 'Briefcase', price: '$149', image: '💼', color: 'Black' },
    { id: 5, name: 'Watch', price: '$199', image: '⌚', color: 'Silver' },
  ],
  sports: [
    { id: 1, name: 'Running Shoes', price: '$99', image: '👟', color: 'Neon' },
    { id: 2, name: 'Track Pants', price: '$49', image: '👖', color: 'Black' },
    { id: 3, name: 'Sports Bra', price: '$39', image: '🏃', color: 'Purple' },
    { id: 4, name: 'Gym Bag', price: '$59', image: '🎒', color: 'Grey' },
    { id: 5, name: 'Water Bottle', price: '$19', image: '💧', color: 'Blue' },
  ],
}

export default function Home() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('mens')

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % deals.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-purple-950/85 border-b border-yellow-500/25">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-3xl font-bold text-white cursor-pointer" onClick={() => navigate('/')}>
            Elegante
          </div>
          <button
            onClick={() => navigate('/mirror')}
            className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-gray-300 text-purple-950 rounded-full font-semibold hover:shadow-lg hover:shadow-yellow-400/50 transition"
          >
            Try Mirror
          </button>
        </div>
      </nav>

      {/* Carousel */}
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto mt-6">
          <div className="relative h-64 rounded-3xl overflow-hidden">
            {deals.map((deal, index) => (
              <div
                key={deal.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className={`h-full bg-gradient-to-r ${deal.bg} flex items-center justify-center`}>
                  <div className="text-center">
                    <div className="text-8xl mb-4">{deal.image}</div>
                    <h2 className="text-4xl font-bold text-white">{deal.title}</h2>
                  </div>
                </div>
              </div>
            ))}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {deals.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 mt-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">Shop by Category</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-full font-semibold transition ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-yellow-400 to-gray-300 text-purple-950'
                    : 'bg-purple-800/50 text-white hover:bg-purple-700/50'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="px-6 mt-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-6 capitalize">{selectedCategory} Collection</h3>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {productsByCategory[selectedCategory].map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-64 bg-gradient-to-br from-violet-900/55 to-purple-950/55 border border-yellow-400/25 rounded-2xl p-6 hover:border-yellow-400/55 transition cursor-pointer"
              >
                <div className="text-7xl mb-4 text-center">{product.image}</div>
                <h4 className="text-xl font-bold text-white mb-2">{product.name}</h4>
                <p className="text-gray-300 mb-2">Color: {product.color}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-yellow-400">{product.price}</span>
                  <button className="px-4 py-2 bg-yellow-400 text-purple-950 rounded-full font-semibold hover:bg-yellow-300 transition">
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
