// Test script to demonstrate greeting variations
// Run with: node test-greetings.js

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

console.log('🎤 GREETING VARIATIONS TEST\n')
console.log('Simulating 10 page visits with voice enabled:\n')

for (let i = 1; i <= 10; i++) {
  const randomIndex = Math.floor(Math.random() * greetingTemplates.length)
  const greeting = greetingTemplates[randomIndex].replace('{name}', 'Rohit')
  console.log(`Visit ${i}: "${greeting}"`)
}

console.log('\n✅ Each visit gets a randomized greeting!')
console.log('📊 Total variations available:', greetingTemplates.length)
