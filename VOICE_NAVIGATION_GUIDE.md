# Voice Navigation System - Integration Guide

## Overview
The voice navigation system is fully implemented and ready to integrate your custom intention detection ML model. The system currently works with a keyword-based fallback and will automatically switch to ML-based detection once your model is added.

## Architecture

### Components Created

1. **useVoiceRecognition.ts** - Web Speech API integration
   - Captures voice input using browser's speech recognition
   - Provides real-time transcript
   - Handles start/stop listening states

2. **useIntentionDetection.ts** - ML model integration hook
   - Loads TensorFlow.js model from `/public/models/Intention-Detection-Model/`
   - Processes transcripts and predicts user intentions
   - Falls back to keyword matching if model not available

3. **VoiceNavigation.tsx** - Main voice navigation component
   - Integrates voice recognition + intention detection
   - Executes actions based on detected intents
   - Provides text-to-speech feedback

4. **VoiceIndicator.tsx** - Visual feedback component
   - Shows listening/processing states
   - Animated microphone indicator
   - Fixed position bottom-right corner

## Supported Intents

### Navigation Intents
- `navigate_home` - Go to home page
- `navigate_mirror` - Open virtual try-on mirror
- `navigate_stylist` - Open AI stylist
- `navigate_profile` - Open profile page
- `navigate_back` - Go back to previous page

### Category Selection (Home Page)
- `select_category_mens` - Show mens collection
- `select_category_womens` - Show womens collection
- `select_category_kids` - Show kids collection
- `select_category_ethnic` - Show ethnic collection
- `select_category_casuals` - Show casuals collection
- `select_category_formal` - Show formal collection
- `select_category_sports` - Show sports collection

### Camera Controls (Mirror/Stylist Pages)
- `camera_start` - Start camera
- `camera_stop` - Stop camera
- `analyze_features` - Analyze appearance features (Stylist page)

### General Commands
- `show_help` - Show available commands

## How to Integrate Your ML Model

### Step 1: Model Structure
Place your trained model in the following directory:
```
/public/models/Intention-Detection-Model/
├── model.json          # TensorFlow.js model architecture
├── metadata.json       # Model metadata (see format below)
└── group1-shard1of1.bin  # Model weights (or multiple shards)
```

### Step 2: Metadata Format
Create a `metadata.json` file with this structure:
```json
{
  "intents": [
    "navigate_home",
    "navigate_mirror",
    "navigate_stylist",
    "navigate_profile",
    "navigate_back",
    "select_category_mens",
    "select_category_womens",
    "select_category_kids",
    "select_category_ethnic",
    "select_category_casuals",
    "select_category_formal",
    "select_category_sports",
    "camera_start",
    "camera_stop",
    "analyze_features",
    "show_help"
  ],
  "vocabulary": ["optional", "list", "of", "tokens"],
  "maxLength": 50
}
```

### Step 3: Implement Preprocessing
In `useIntentionDetection.ts`, update the `detectIntention` function to preprocess your text input according to your model's requirements:

```typescript
// Example preprocessing (adjust based on your model)
const preprocessText = (text: string, metadata: IntentionModelMetadata) => {
  // Tokenization
  const tokens = text.toLowerCase().split(' ')
  
  // Convert to indices based on vocabulary
  const indices = tokens.map(token => 
    metadata.vocabulary?.indexOf(token) ?? 0
  )
  
  // Padding/truncating to maxLength
  const maxLen = metadata.maxLength ?? 50
  const padded = indices.slice(0, maxLen)
  while (padded.length < maxLen) {
    padded.push(0)
  }
  
  // Create tensor
  return tf.tensor2d([padded])
}

// Then use it in detectIntention:
const inputTensor = preprocessText(transcript, metadataRef.current)
const prediction = modelRef.current.predict(inputTensor) as tf.Tensor
const predictionData = await prediction.data()

// Get intent with highest probability
const maxIndex = predictionData.indexOf(Math.max(...Array.from(predictionData)))
const intent = metadataRef.current.intents[maxIndex]
const confidence = predictionData[maxIndex]

inputTensor.dispose()
prediction.dispose()

return { intent, confidence }
```

### Step 4: Model Output Format
Your model should output probabilities for each intent class. The system expects:
- **Input**: Preprocessed text (format depends on your model)
- **Output**: Array of probabilities, one per intent (length = number of intents)

## Current Fallback System

The keyword-based fallback is already implemented and works without the ML model. It matches common phrases to intents:

- "go to mirror" → `navigate_mirror`
- "show mens collection" → `select_category_mens`
- "start camera" → `camera_start`
- etc.

## Testing Voice Navigation

1. **Enable Voice Control**: Click the microphone button in the navigation bar
2. **Grant Permissions**: Allow microphone access when prompted
3. **Speak Commands**: Try phrases like:
   - "Go to mirror"
   - "Show womens collection"
   - "Start camera"
   - "Analyze my features"
   - "Go back"

## Browser Compatibility

Voice recognition requires:
- Chrome/Edge (recommended)
- Safari (iOS/macOS)
- Not supported: Firefox (no Web Speech API)

## Voice Feedback

The system provides audio feedback using Text-to-Speech:
- Confirms navigation actions
- Announces category changes
- Provides help information

## Integration Status

✅ **Completed:**
- Voice recognition (Web Speech API)
- Visual indicators (listening/processing)
- Intent execution system
- Fallback keyword matching
- Text-to-speech feedback
- Integration in all pages (Home, Mirror, Stylist)

⏳ **Pending Your ML Model:**
- Custom intention detection model
- Model-specific preprocessing
- Fine-tuned intent recognition

## Next Steps

1. Train your intention detection model
2. Export to TensorFlow.js format
3. Place model files in `/public/models/Intention-Detection-Model/`
4. Update preprocessing logic in `useIntentionDetection.ts`
5. Test with voice commands

The system will automatically detect and use your ML model once it's in place!
