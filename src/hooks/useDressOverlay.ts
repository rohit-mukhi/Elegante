import { useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import type { PoseLandmark } from './useMediaPipePose'
import type { DeviceTier } from '../contexts/DeviceCapabilityContext'

export type DressCategory = 'top' | 'bottom' | 'full'

// Anchor points in normalized image coords (0-1).
// These tell us exactly where the shoulder seams are inside the garment image.
// Must be defined for every garment — computed once via pixel analysis.
export interface GarmentAnchors {
  leftShoulder:  { x: number; y: number }
  rightShoulder: { x: number; y: number }
}

// Anchors for /dresses/t-shirt.png — computed from pixel analysis
export const DEFAULT_ANCHORS: GarmentAnchors = {
  leftShoulder:  { x: 0.169, y: 0.310 },
  rightShoulder: { x: 0.831, y: 0.310 },
}

export function useDressOverlay(
  mountRef: React.RefObject<HTMLDivElement | null>,
  _tier: DeviceTier = 'low'
) {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef    = useRef<THREE.Scene | null>(null)
  const cameraRef   = useRef<THREE.OrthographicCamera | null>(null)
  const meshRef     = useRef<THREE.Mesh | null>(null)
  const textureRef  = useRef<THREE.Texture | null>(null)
  const activeRef   = useRef(false)
  const anchorsRef  = useRef<GarmentAnchors>(DEFAULT_ANCHORS)
  const texSizeRef  = useRef<{ w: number; h: number }>({ w: 1, h: 1 })

  // ── Initialize Three.js renderer ─────────────────────────────────────────
  const initialize = useCallback(() => {
    if (!mountRef.current || rendererRef.current) return

    const container = mountRef.current
    const w = container.clientWidth  || 640
    const h = container.clientHeight || 480

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const el = renderer.domElement
    el.style.position      = 'absolute'
    el.style.inset         = '0'
    el.style.pointerEvents = 'none'
    el.style.zIndex        = '10'
    // No CSS scaleX(-1) — mirroring is handled in landmarkToNDC

    container.appendChild(el)

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.z = 1

    rendererRef.current = renderer
    cameraRef.current   = camera
    sceneRef.current    = new THREE.Scene()
    console.log('✅ Three.js overlay initialized', w, h)
  }, [mountRef])

  // ── Convert MediaPipe landmark → Three.js NDC ─────────────────────────────
  // MediaPipe gives x,y in [0,1] of the raw unmirrored camera frame.
  // The video has CSS scaleX(-1), so we flip x = (1 - lm.x).
  // Then correct for object-cover scaling between video resolution and container size.
  const landmarkToNDC = useCallback((
    lm: PoseLandmark,
    cW: number, cH: number,  // container pixels
    vW: number, vH: number   // video resolution pixels
  ): [number, number] => {
    const mx    = 1 - lm.x                    // mirror X to match CSS scaleX(-1)
    const scale = Math.max(cW / vW, cH / vH)  // object-cover fill scale
    const dW    = vW * scale                   // scaled video width in container space
    const dH    = vH * scale
    const cropX = (dW - cW) / 2               // pixels cropped off each side
    const cropY = (dH - cH) / 2
    const px    = mx   * dW - cropX           // pixel position inside container
    const py    = lm.y * dH - cropY
    return [(px / cW) * 2 - 1, -(py / cH) * 2 + 1]  // NDC: x∈[-1,1], y∈[-1,1] (+y=up)
  }, [])

  // ── Per-frame render: anchor garment shoulders to body shoulders ──────────
  const renderFrame = useCallback((
    lms: PoseLandmark[] | null,
    cW: number, cH: number,
    vW: number, vH: number
  ) => {
    const renderer = rendererRef.current
    const scene    = sceneRef.current
    const camera   = cameraRef.current
    if (!renderer || !scene || !camera) return

    if (!activeRef.current || !lms || !textureRef.current || cW === 0 || vW === 0) {
      if (meshRef.current) meshRef.current.visible = false
      renderer.render(scene, camera)
      return
    }

    const lsLM = lms[11]  // MediaPipe left shoulder
    const rsLM = lms[12]  // MediaPipe right shoulder
    if (!lsLM || !rsLM) { renderer.render(scene, camera); return }

    // Where the user's shoulders are on screen in NDC
    const [lsX, lsY] = landmarkToNDC(lsLM, cW, cH, vW, vH)
    const [rsX, rsY] = landmarkToNDC(rsLM, cW, cH, vW, vH)

    const bodyShoulderW  = Math.abs(rsX - lsX)       // shoulder span in NDC
    const bodyShoulderCX = (lsX + rsX) / 2           // midpoint X
    const bodyShoulderCY = (lsY + rsY) / 2           // midpoint Y

    // Garment anchor span (fraction of image width between the two shoulder seams)
    const anc        = anchorsRef.current
    const ancSpanX   = anc.rightShoulder.x - anc.leftShoulder.x  // e.g. 0.662
    const ancCX      = (anc.leftShoulder.x + anc.rightShoulder.x) / 2  // e.g. 0.5
    const ancCY      = (anc.leftShoulder.y + anc.rightShoulder.y) / 2  // e.g. 0.310

    // Scale the image so the anchor span matches the body shoulder width
    const imgW      = texSizeRef.current.w
    const imgH      = texSizeRef.current.h
    const imageNDCW = bodyShoulderW / ancSpanX              // full image width in NDC
    const imageNDCH = imageNDCW * (imgH / imgW)             // height preserving aspect ratio

    // Offset the mesh center so the anchor point lands exactly on the body shoulder midpoint
    // ancCX=0.5 means anchor is horizontally centered → no X offset
    // ancCY=0.310 means anchor is 31% from top → mesh center must be pushed down by (ancCY - 0.5) * height
    const meshCX = bodyShoulderCX + (0.5 - ancCX) * imageNDCW
    const meshCY = bodyShoulderCY + (ancCY - 0.5) * imageNDCH

    // Create mesh once
    if (!meshRef.current) {
      const geo = new THREE.PlaneGeometry(1, 1)
      const mat = new THREE.MeshBasicMaterial({
        map:         textureRef.current,
        transparent: true,
        alphaTest:   0.05,
        depthWrite:  false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      scene.add(mesh)
      meshRef.current = mesh
    }

    const mesh = meshRef.current
    ;(mesh.material as THREE.MeshBasicMaterial).map = textureRef.current
    mesh.scale.set(imageNDCW, imageNDCH, 1)
    mesh.position.set(meshCX, meshCY, 0)
    mesh.visible = true

    renderer.render(scene, camera)
  }, [landmarkToNDC])

  // ── Load a garment image ──────────────────────────────────────────────────
  const loadDress = useCallback((
    imageUrl: string,
    _category: DressCategory,
    anchors?: GarmentAnchors
  ) => {
    activeRef.current  = true
    anchorsRef.current = anchors ?? DEFAULT_ANCHORS

    if (textureRef.current) { textureRef.current.dispose(); textureRef.current = null }
    if (meshRef.current) meshRef.current.visible = false

    new THREE.TextureLoader().load(
      imageUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.minFilter  = THREE.LinearFilter
        tex.magFilter  = THREE.LinearFilter
        textureRef.current = tex
        texSizeRef.current = { w: tex.image.width, h: tex.image.height }
        console.log(`✅ Dress loaded: ${imageUrl} (${tex.image.width}×${tex.image.height})`)
      },
      undefined,
      (err) => console.error('❌ Dress texture load failed:', err)
    )
  }, [])

  // ── Resize ────────────────────────────────────────────────────────────────
  const resize = useCallback((w: number, h: number) => {
    rendererRef.current?.setSize(w, h)
  }, [])

  // ── Clear dress ───────────────────────────────────────────────────────────
  const clearDress = useCallback(() => {
    activeRef.current = false
    if (meshRef.current) meshRef.current.visible = false
    if (textureRef.current) { textureRef.current.dispose(); textureRef.current = null }
  }, [])

  // ── Dispose ───────────────────────────────────────────────────────────────
  const dispose = useCallback(() => {
    clearDress()
    if (meshRef.current) {
      meshRef.current.geometry.dispose()
      ;(meshRef.current.material as THREE.Material).dispose()
      meshRef.current = null
    }
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current.domElement.remove()
      rendererRef.current = null
    }
    sceneRef.current  = null
    cameraRef.current = null
  }, [clearDress])

  useEffect(() => () => { dispose() }, [dispose])

  return { initialize, loadDress, renderFrame, resize, clearDress, dispose }
}
