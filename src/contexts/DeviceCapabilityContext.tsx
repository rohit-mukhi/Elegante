import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type DeviceTier = 'high' | 'low' | 'unknown'

interface DeviceCapabilityContextType {
  tier: DeviceTier
  isDetecting: boolean
}

const DeviceCapabilityContext = createContext<DeviceCapabilityContextType>({
  tier: 'unknown',
  isDetecting: true
})

const STORAGE_KEY = 'elegante_device_tier'
const BENCHMARK_THRESHOLD_MS = 80 // inference must complete within 80ms for high tier

function getGpuTier(): 'high' | 'low' | 'unknown' {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
    if (!gl) return 'unknown'

    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (!ext) return 'unknown'

    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string
    console.log('🖥️ GPU Renderer:', renderer)

    const highEndPatterns = [
      /apple a1[5-9]/i, /apple m[1-9]/i,        // Apple A15+ and M-series
      /adreno [6-9][5-9][0-9]/i,                 // Adreno 650+ (flagship Android)
      /mali-g[7-9][0-9][0-9]/i,                  // Mali G710+ (flagship Android)
      /nvidia/i,                                  // Any NVIDIA desktop/laptop GPU
      /radeon rx [5-9]/i,                         // Modern AMD
      /geforce rtx/i, /geforce gtx 1[0-9]/i      // Modern NVIDIA
    ]

    const lowEndPatterns = [
      /adreno [3-5][0-9][0-9]/i,   // Adreno 300–599 (mid/low Android)
      /mali-g[3-5][0-9]/i,         // Mali G31–G57 (budget Android)
      /powervr/i,                   // Older Apple / budget chips
      /videocore/i                  // Raspberry Pi / very low end
    ]

    if (highEndPatterns.some(p => p.test(renderer))) return 'high'
    if (lowEndPatterns.some(p => p.test(renderer))) return 'low'

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

async function runInferenceBenchmark(): Promise<number> {
  // Lightweight benchmark: measure how fast the device can run
  // a representative compute workload (matrix multiply proxy)
  const size = 256
  const a = new Float32Array(size * size).map(() => Math.random())
  const b = new Float32Array(size * size).map(() => Math.random())
  const c = new Float32Array(size * size)

  const start = performance.now()

  // Simulate inference-like compute: dot products across rows/cols
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      let sum = 0
      for (let k = 0; k < size; k++) {
        sum += a[i * size + k] * b[k * size + j]
      }
      c[i * size + j] = sum
    }
  }

  // Prevent dead-code elimination
  void c[0]

  return performance.now() - start
}

export function DeviceCapabilityProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<DeviceTier>('unknown')
  const [isDetecting, setIsDetecting] = useState(true)

  useEffect(() => {
    const detect = async () => {
      // Return cached result if available — no need to re-benchmark every session
      const cached = sessionStorage.getItem(STORAGE_KEY) as DeviceTier | null
      if (cached === 'high' || cached === 'low') {
        console.log(`📱 Device tier (cached): ${cached}`)
        setTier(cached)
        setIsDetecting(false)
        return
      }

      // Signal 1: GPU tier from WebGL renderer string
      const gpuTier = getGpuTier()
      console.log(`🔍 GPU tier signal: ${gpuTier}`)

      // Signal 2: Compute benchmark
      const benchmarkMs = await runInferenceBenchmark()
      console.log(`⚡ Benchmark result: ${benchmarkMs.toFixed(1)}ms (threshold: ${BENCHMARK_THRESHOLD_MS}ms)`)

      let result: DeviceTier

      if (gpuTier === 'high' && benchmarkMs < BENCHMARK_THRESHOLD_MS) {
        // Both signals agree: high-end device
        result = 'high'
      } else if (gpuTier === 'low') {
        // GPU explicitly low-end
        result = 'low'
      } else if (gpuTier === 'unknown') {
        // Unknown GPU: rely solely on benchmark
        result = benchmarkMs < BENCHMARK_THRESHOLD_MS ? 'high' : 'low'
      } else {
        // GPU says high but benchmark is slow (thermal throttling, power saving mode)
        result = benchmarkMs < BENCHMARK_THRESHOLD_MS * 1.5 ? 'high' : 'low'
      }

      console.log(`✅ Device tier determined: ${result}`)
      sessionStorage.setItem(STORAGE_KEY, result)
      setTier(result)
      setIsDetecting(false)
    }

    detect()
  }, [])

  return (
    <DeviceCapabilityContext.Provider value={{ tier, isDetecting }}>
      {children}
    </DeviceCapabilityContext.Provider>
  )
}

export function useDeviceCapability() {
  return useContext(DeviceCapabilityContext)
}
