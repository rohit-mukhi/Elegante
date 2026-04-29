import { useState, useCallback } from 'react'

interface GreetingHook {
  getGreeting: (userName?: string) => string
  speak: (text: string) => void
}

export function useGreeting(): GreetingHook {
  const greetingTemplates = [
    "Hey {name}, what's on your mind today?",
    "Welcome back {name}! What can I help you style today?",
    "Hi {name}! Ready to find your perfect look?",
    "Hello {name}! What are you shopping for today?",
    "Hey there {name}! Tell me what you're looking for",
    "Good to see you {name}! What brings you here today?",
    "{name}! Let's find something amazing for you today",
    "Hi {name}! What occasion are we styling for?",
    "Welcome {name}! Ready to discover your perfect colors?",
    "{name}! What style are you going for today?"
  ]

  const getGreeting = useCallback((userName: string = 'there'): string => {
    const randomIndex = Math.floor(Math.random() * greetingTemplates.length)
    const template = greetingTemplates[randomIndex]
    return template.replace('{name}', userName)
  }, [])

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.1
      utterance.pitch = 1.0
      utterance.volume = 0.7
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  return {
    getGreeting,
    speak
  }
}
