import { useIntentionDetection } from '../hooks/useIntentionDetection'
import { useEffect, useState } from 'react'

interface VoiceDebugProps {
  isListening: boolean
  transcript: string
  isSupported: boolean
}

export function VoiceDebug({ isListening, transcript, isSupported }: VoiceDebugProps) {
  const { detectIntention, isProcessing, isModelAvailable } = useIntentionDetection()
  const [lastIntent, setLastIntent] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    if (isListening) {
      addLog('Listening started')
    } else {
      addLog('Listening stopped')
    }
  }, [isListening])

  useEffect(() => {
    if (transcript) {
      addLog(`Transcript: "${transcript}"`)
    }
  }, [transcript])

  useEffect(() => {
    const processTranscript = async () => {
      if (transcript) {
        console.log('Processing:', transcript)
        const result = await detectIntention(transcript)
        setLastIntent(result)
        if (result) {
          addLog(`Intent: ${result.intent} (${(result.confidence * 100).toFixed(0)}%)`)
        }
      }
    }
    processTranscript()
  }, [transcript, detectIntention])

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/95 text-white p-4 rounded-lg max-w-md text-xs font-mono border border-yellow-400/50">
      <h3 className="font-bold mb-2 text-yellow-400">🎤 Voice Debug Panel</h3>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Supported:</span>
          <span className={isSupported ? 'text-green-400' : 'text-red-400'}>
            {isSupported ? '✅ YES' : '❌ NO'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Listening:</span>
          <span className={isListening ? 'text-green-400 animate-pulse' : 'text-red-400'}>
            {isListening ? '✅ YES' : '❌ NO'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Processing:</span>
          <span className={isProcessing ? 'text-yellow-400' : 'text-gray-400'}>
            {isProcessing ? '⏳ YES' : '❌ NO'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Model:</span>
          <span className={isModelAvailable ? 'text-green-400' : 'text-orange-400'}>
            {isModelAvailable ? '✅ Loaded' : '⚠️ Fallback'}
          </span>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="font-bold text-yellow-400">Current Transcript:</div>
          <div className="bg-gray-900 p-2 rounded mt-1 min-h-[40px] max-h-[60px] overflow-auto">
            {transcript || <span className="text-gray-500">Waiting for speech...</span>}
          </div>
        </div>
        
        {lastIntent && (
          <div className="mt-2">
            <div className="font-bold text-yellow-400">Last Intent:</div>
            <div className="bg-gray-900 p-2 rounded mt-1">
              <div className="text-green-400">{lastIntent.intent}</div>
              <div className="text-gray-400 text-[10px]">Confidence: {(lastIntent.confidence * 100).toFixed(0)}%</div>
            </div>
          </div>
        )}
        
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="font-bold text-yellow-400 mb-1">Activity Log:</div>
          <div className="bg-gray-900 p-2 rounded text-[10px] space-y-1 max-h-[80px] overflow-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No activity yet...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-gray-300">{log}</div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-3 flex gap-2">
          <div className="text-[10px] text-gray-400 text-center w-full">
            Use the mic button in the nav bar to control voice
          </div>
        </div>
        
        <div className="mt-2 text-[10px] text-gray-400 text-center">
          💡 Tip: Check browser console for detailed logs
        </div>
      </div>
    </div>
  )
}
