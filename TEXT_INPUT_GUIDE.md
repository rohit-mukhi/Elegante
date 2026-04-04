# Voice Command Text Input Fallback

## Overview
When voice recognition is unavailable due to network restrictions, you can use the text input fallback to type voice commands instead of speaking them.

## How to Use

1. **Enable Voice Control**: Click the "Voice Off" button in the navigation bar to enable voice features
2. **Open Text Input**: Click the keyboard icon (⌨️) in the bottom-right corner
3. **Type Command**: Enter your command in the text field (e.g., "go to mirror")
4. **Submit**: Press Enter or click the arrow button (➤)

## Supported Commands

### Navigation
- "go to home" / "navigate home"
- "go to mirror" / "open mirror"
- "go to stylist" / "open stylist"
- "go to profile" / "open profile"
- "go back"

### Category Selection (on Home page)
- "show mens" / "mens category"
- "show womens" / "womens category"
- "show kids" / "kids category"
- "show ethnic" / "ethnic category"
- "show casuals" / "casuals category"
- "show formal" / "formal category"
- "show sports" / "sports category"

### Camera Controls (on Mirror/Stylist pages)
- "start camera" / "turn on camera"
- "stop camera" / "turn off camera"

### AI Features (on Stylist page)
- "analyze features" / "analyze my features"

### Help
- "help" / "show help"

## Why This Fallback?

The Web Speech API requires:
- Internet connection to Google's servers
- HTTPS or localhost environment
- Unrestricted network access

If your network blocks Google's Web Speech API (common in corporate/institutional networks), this text input provides the same functionality without requiring speech recognition.

## Tips

- Commands are case-insensitive
- You can use natural variations (e.g., "go to mirror" or "open mirror")
- The system uses the same intention detection as voice commands
- Close the text input panel by clicking the X button
- The keyboard icon will always be visible when voice control is enabled

## Future Enhancement

When you deploy to production with HTTPS or test on an unrestricted network, the actual voice recognition will work automatically. This text input will remain available as an alternative input method.
