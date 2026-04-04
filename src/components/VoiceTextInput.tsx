import { useState } from 'react'

interface VoiceTextInputProps {
  onSubmit: (text: string) => void
}

export function VoiceTextInput({ onSubmit }: VoiceTextInputProps) {
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSubmit(input.trim())
      setInput('')
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Type voice command"
      >
        <span className="text-2xl">⌨️</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl p-4 w-80 z-50 border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Type Command</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., go to mirror"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
        />
        <button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          ➤
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2">
        Try: "go to mirror", "show casual", "start camera"
      </p>
    </div>
  )
}
