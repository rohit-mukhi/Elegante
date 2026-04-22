import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pipeline } from '@xenova/transformers'

export default function AddDress() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    cloudinaryUrl: '',
    season: '',
    color: '#77B5FE'
  })

  const categories = ['Party', 'Wedding', 'Casual', 'Formal', 'Beach', 'Office', 'Evening', 'Cocktail']
  const seasons = ['True Summer', 'True Winter', 'True Spring', 'True Autumn', 'Soft Summer', 'Soft Winter', 'Soft Spring', 'Soft Autumn', 'Clear Summer', 'Clear Winter', 'Clear Spring', 'Clear Autumn']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Generate embedding on frontend
      setMessage({ type: 'success', text: 'Generating embedding...' })
      const model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
      const description = `${formData.name} ${formData.category} dress for ${formData.season} in ${formData.color}`
      const output = await model(description, { pooling: 'mean', normalize: true })
      const embedding = Array.from(output.data)

      setMessage({ type: 'success', text: 'Uploading to database...' })

      const response = await fetch('https://elegante-backend-srp-rm.vercel.app/api/addDress.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          embedding
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `Dress added successfully! ID: ${data.id}` })
        setFormData({
          name: '',
          category: '',
          cloudinaryUrl: '',
          season: '',
          color: '#77B5FE'
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add dress' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-violet-950 to-purple-900 text-zinc-50">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-violet-900/50 pb-6 mb-8">
          <button onClick={() => navigate('/home')} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 via-gray-300 to-purple-600" />
            <span className="text-sm font-medium tracking-[0.3em] text-violet-50">ELEGANTE</span>
          </button>
          <button
            onClick={() => navigate('/home')}
            className="rounded-full border border-violet-500/70 bg-black/20 px-4 py-2 text-sm text-violet-50 transition hover:border-yellow-400 hover:text-yellow-400"
          >
            Back to Home
          </button>
        </header>

        {/* Form */}
        <div className="rounded-2xl border border-violet-900/50 bg-black/35 p-8 backdrop-blur-md">
          <h1 className="mb-6 text-3xl font-bold text-violet-50">Add New Dress</h1>
          
          {message && (
            <div className={`mb-6 rounded-lg p-4 ${
              message.type === 'success' 
                ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                : 'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-violet-50">
                Dress Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Coral Summer Dress"
                className="w-full rounded-lg border border-violet-500/50 bg-black/30 px-4 py-3 text-violet-50 placeholder-violet-50/40 focus:border-yellow-400 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium text-violet-50">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-violet-500/50 bg-black/30 px-4 py-3 text-violet-50 focus:border-yellow-400 focus:outline-none"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Cloudinary URL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-violet-50">
                Cloudinary URL (3D Model) <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                required
                value={formData.cloudinaryUrl}
                onChange={(e) => setFormData({ ...formData, cloudinaryUrl: e.target.value })}
                placeholder="https://res.cloudinary.com/demo/image/upload/sample.glb"
                className="w-full rounded-lg border border-violet-500/50 bg-black/30 px-4 py-3 text-violet-50 placeholder-violet-50/40 focus:border-yellow-400 focus:outline-none"
              />
              <p className="mt-1 text-xs text-violet-50/50">Must be a .glb or .gltf 3D model URL</p>
            </div>

            {/* Season */}
            <div>
              <label className="mb-2 block text-sm font-medium text-violet-50">
                Season <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                className="w-full rounded-lg border border-violet-500/50 bg-black/30 px-4 py-3 text-violet-50 focus:border-yellow-400 focus:outline-none"
              >
                <option value="">Select season</option>
                {seasons.map(season => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="mb-2 block text-sm font-medium text-violet-50">
                Color <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  required
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-12 w-20 rounded-lg border border-violet-500/50 bg-black/30 cursor-pointer"
                />
                <input
                  type="text"
                  required
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#77B5FE"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="flex-1 rounded-lg border border-violet-500/50 bg-black/30 px-4 py-3 text-violet-50 placeholder-violet-50/40 focus:border-yellow-400 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-violet-50/50">Hex color code (e.g., #77B5FE)</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-yellow-400 via-gray-300 to-purple-600 px-6 py-4 text-lg font-medium text-purple-950 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-950 border-t-transparent"></div>
                  Adding Dress...
                </span>
              ) : (
                'Add Dress to Database'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
