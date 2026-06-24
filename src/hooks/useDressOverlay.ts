import { useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import type { PoseLandmark } from './useMediaPipePose'
import type { DeviceTier } from '../contexts/DeviceCapabilityContext'
import { useClothPhysics } from './useClothPhysics'

export type DressCategory = 'top' | 'bottom' | 'full'

const PAD: Record<DressCategory, { w: number; h: number }> = {
  top:    { w: 1.25, h: 1.05 },
  bottom: { w: 1.20, h: 1.05 },
  full:   { w: 1.25, h: 1.10 },
}

const LM = {
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW:    13, R_ELBOW:    14,
  L_HIP:      23, R_HIP:      24,
  L_KNEE:     25, R_KNEE:     26,
  L_ANKLE:    27, R_ANKLE:    28,
}

function getLM(lms: PoseLandmark[], idx: number, minVis = 0.4): PoseLandmark | null {
  const lm = lms[idx]
  if (!lm) return null
  if (lm.visibility !== undefined && lm.visibility < minVis) return null
  return lm
}

function clearGroup(group: THREE.Group) {
  while (group.children.length > 0) {
    const child = group.children[0] as THREE.Mesh
    child.geometry?.dispose()
    ;(child.material as THREE.Material)?.dispose()
    group.remove(child)
  }
}

// Build BufferGeometry for a subdivided dress mesh (COLS × ROWS grid)
// Physics offsets are applied to vertex positions each frame
function buildDressGeometry(COLS: number, ROWS: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  const vertCount = COLS * ROWS

  const positions = new Float32Array(vertCount * 3)
  const uvs       = new Float32Array(vertCount * 2)

  // Two triangles per quad cell = (COLS-1)*(ROWS-1)*6 indices
  const indices: number[] = []

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const i = row * COLS + col
      // Positions initialised to zero — updated every frame
      positions[i * 3]     = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      // UV: (0,1) top-left → (1,0) bottom-right
      uvs[i * 2]     = col / (COLS - 1)
      uvs[i * 2 + 1] = 1 - row / (ROWS - 1)

      if (row < ROWS - 1 && col < COLS - 1) {
        const tl = i
        const tr = i + 1
        const bl = i + COLS
        const br = i + COLS + 1
        indices.push(tl, bl, tr)
        indices.push(tr, bl, br)
      }
    }
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('uv',       new THREE.BufferAttribute(uvs,       2))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  return geo
}

export function useDressOverlay(
  mountRef: React.RefObject<HTMLDivElement | null>,
  tier: DeviceTier = 'low'
) {
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef     = useRef<THREE.Scene | null>(null)
  const cameraRef    = useRef<THREE.OrthographicCamera | null>(null)
  const groupRef     = useRef<THREE.Group | null>(null)
  const textureRef   = useRef<THREE.Texture | null>(null)
  const categoryRef  = useRef<DressCategory>('top')
  const activeRef    = useRef(false)

  // Reusable dress mesh — geometry updated in-place every frame (no GC pressure)
  const dressMeshRef = useRef<THREE.Mesh | null>(null)
  const dressGeoRef  = useRef<THREE.BufferGeometry | null>(null)

  const { computePhysics, reset: resetPhysics, COLS, ROWS } = useClothPhysics(tier)

  // ── Initialize ────────────────────────────────────────────────────────────
  const initialize = useCallback(() => {
    if (!mountRef.current || rendererRef.current) return

    const container = mountRef.current
    const w = container.clientWidth  || 640
    const h = container.clientHeight || 480

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const el = renderer.domElement
    el.style.position      = 'absolute'
    el.style.inset         = '0'
    el.style.pointerEvents = 'none'
    el.style.zIndex        = '10'
    // No scaleX(-1) here — we mirror landmark X in toNDC instead

    container.appendChild(el)

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.z = 1

    const scene = new THREE.Scene()
    const group = new THREE.Group()
    scene.add(group)

    rendererRef.current = renderer
    cameraRef.current   = camera
    sceneRef.current    = scene
    groupRef.current    = group

    console.log('✅ Three.js overlay initialized', w, h)
  }, [mountRef])

  // ── Landmark to NDC with object-cover correction ──────────────────────────
  // MediaPipe gives x,y in [0,1] of the raw (unmirrored) camera frame.
  // The video element is CSS-flipped with scaleX(-1), so the overlay is too.
  // We must mirror the X landmark to match what the user sees on screen,
  // then account for object-cover cropping to get correct NDC coords.
  const toNDC = useCallback((
    lm: PoseLandmark,
    cW: number, cH: number,
    vW: number, vH: number
  ): [number, number] => {
    // Mirror X to match the CSS scaleX(-1) on the video
    const mx = 1 - lm.x

    // object-cover: find the scale that fills the container, then center
    const scale    = Math.max(cW / vW, cH / vH)
    const displayW = vW * scale
    const displayH = vH * scale
    const cropX    = (displayW - cW) / 2   // pixels of video cropped on each side
    const cropY    = (displayH - cH) / 2

    // Convert to container pixel space
    const px = mx * displayW - cropX
    const py = lm.y * displayH - cropY

    // Convert to NDC [-1, 1] (x: left=-1, right=+1 | y: top=-1... wait, Three.js: top=+1)
    const ndcX =  (px / cW) * 2 - 1
    const ndcY = -(py / cH) * 2 + 1

    return [ndcX, ndcY]
  }, [])

  // ── Build or update the dress mesh with physics deformation ───────────────
  const updateDressMesh = useCallback((
    lms: PoseLandmark[],
    cW: number, cH: number,
    vW: number, vH: number
  ) => {
    const group = groupRef.current
    if (!group || !textureRef.current) return

    const ls = getLM(lms, LM.L_SHOULDER)
    const rs = getLM(lms, LM.R_SHOULDER)
    const lh = getLM(lms, LM.L_HIP)
    const rh = getLM(lms, LM.R_HIP)
    if (!ls || !rs || !lh || !rh) return

    const ndc = (lm: PoseLandmark) => toNDC(lm, cW, cH, vW, vH)

    const [lsx, lsy] = ndc(ls)
    const [rsx, rsy] = ndc(rs)
    const [lhx, lhy] = ndc(lh)
    const [rhx, rhy] = ndc(rh)

    const cat = categoryRef.current
    const pad = PAD[cat]

    let topY: number, botY: number, centerX: number

    if (cat === 'top') {
      topY    = (lsy + rsy) / 2
      botY    = (lhy + rhy) / 2
      centerX = (lsx + rsx + lhx + rhx) / 4
    } else if (cat === 'bottom') {
      topY    = (lhy + rhy) / 2
      centerX = (lhx + rhx) / 2
      const la = getLM(lms, LM.L_ANKLE) ?? getLM(lms, LM.L_KNEE) ?? lh
      const ra = getLM(lms, LM.R_ANKLE) ?? getLM(lms, LM.R_KNEE) ?? rh
      botY = (ndc(la)[1] + ndc(ra)[1]) / 2
    } else {
      topY    = (lsy + rsy) / 2
      centerX = (lsx + rsx + lhx + rhx) / 4
      const la = getLM(lms, LM.L_ANKLE) ?? getLM(lms, LM.L_KNEE) ?? lh
      const ra = getLM(lms, LM.R_ANKLE) ?? getLM(lms, LM.R_KNEE) ?? rh
      botY = (ndc(la)[1] + ndc(ra)[1]) / 2
    }

    const hw      = (Math.abs(rsx - lsx) * pad.w) / 2
    const hh      = (Math.abs(topY - botY) * pad.h) / 2
    const centerY = (topY + botY) / 2

    // Get physics offsets for this frame
    const offsets = computePhysics(centerX, centerY, hw, hh)

    // Create mesh on first use
    if (!dressMeshRef.current) {
      const geo = buildDressGeometry(COLS, ROWS)
      const mat = new THREE.MeshBasicMaterial({
        map:         textureRef.current,
        transparent: true,
        alphaTest:   0.01,
        depthWrite:  false,
        side:        THREE.FrontSide,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.z = 0.03
      group.add(mesh)
      dressMeshRef.current = mesh
      dressGeoRef.current  = geo
    } else {
      // Update material map in case texture changed
      ;(dressMeshRef.current.material as THREE.MeshBasicMaterial).map = textureRef.current
    }

    // Update vertex positions in-place — no GC, no geometry rebuild
    const posAttr = dressGeoRef.current!.getAttribute('position') as THREE.BufferAttribute
    const posArr  = posAttr.array as Float32Array

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const vi = row * COLS + col
        const t  = col / (COLS - 1)   // 0..1 left→right
        const s  = row / (ROWS - 1)   // 0..1 top→bottom

        // Base flat position
        const baseX = centerX - hw + t * hw * 2
        const baseY = centerY + hh - s * hh * 2

        // Apply physics offset
        posArr[vi * 3]     = baseX + offsets[vi].x
        posArr[vi * 3 + 1] = baseY + offsets[vi].y
        posArr[vi * 3 + 2] = 0
      }
    }

    posAttr.needsUpdate = true
    dressMeshRef.current.visible = true
  }, [toNDC, computePhysics, COLS, ROWS])

  // ── Build debug wireframe overlay (always shown when dress is active) ─────
  const updateDebugMesh = useCallback((
    lms: PoseLandmark[],
    cW: number, cH: number,
    vW: number, vH: number
  ) => {
    const group = groupRef.current
    if (!group) return

    // Remove only debug children (keep dress mesh at index 0 if it exists)
    const toRemove = group.children.filter(c => (c as THREE.Mesh).userData.debug)
    toRemove.forEach(c => {
      const m = c as THREE.Mesh
      m.geometry?.dispose()
      ;(m.material as THREE.Material)?.dispose()
      group.remove(m)
    })

    const ls = getLM(lms, LM.L_SHOULDER)
    const rs = getLM(lms, LM.R_SHOULDER)
    const lh = getLM(lms, LM.L_HIP)
    const rh = getLM(lms, LM.R_HIP)
    if (!ls || !rs || !lh || !rh) return

    const ndc = (lm: PoseLandmark) => toNDC(lm, cW, cH, vW, vH)

    const addDebug = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z = 0, rz = 0) => {
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(x, y, z)
      mesh.rotation.z = rz
      mesh.userData.debug = true
      group.add(mesh)
    }

    const [lsx, lsy] = ndc(ls)
    const [rsx, rsy] = ndc(rs)
    const [lhx, lhy] = ndc(lh)
    const [rhx, rhy] = ndc(rh)
    const cat = categoryRef.current
    const pad = PAD[cat]

    const meshW   = Math.abs(rsx - lsx) * pad.w
    const meshH   = Math.abs((lsy + rsy) / 2 - (lhy + rhy) / 2) * pad.h
    const centerX = (lsx + rsx + lhx + rhx) / 4
    const centerY = ((lsy + rsy) / 2 + (lhy + rhy) / 2) / 2

    // Yellow torso wireframe
    addDebug(
      new THREE.PlaneGeometry(meshW, meshH),
      new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true, transparent: true, opacity: 0.8 }),
      centerX, centerY, 0
    )

    // Cyan shoulder bar
    addDebug(
      new THREE.PlaneGeometry(Math.abs(rsx - lsx) * 1.05, 0.012),
      new THREE.MeshBasicMaterial({ color: 0x00ffff }),
      (lsx + rsx) / 2, (lsy + rsy) / 2, 0.01
    )

    // Red landmark dots
    ;[LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP,
      LM.L_ELBOW, LM.R_ELBOW, LM.L_KNEE, LM.R_KNEE].forEach(idx => {
      const lmPoint = getLM(lms, idx)
      if (!lmPoint) return
      const [x, y] = ndc(lmPoint)
      addDebug(
        new THREE.PlaneGeometry(0.022, 0.022),
        new THREE.MeshBasicMaterial({ color: 0xff3333 }),
        x, y, 0.02
      )
    })

    // Magenta sleeve boxes
    const le = getLM(lms, LM.L_ELBOW)
    const re = getLM(lms, LM.R_ELBOW)
    ;[
      le ? { a: ls, b: le } : null,
      re ? { a: rs, b: re } : null,
    ].forEach(pair => {
      if (!pair) return
      const [ax, ay] = ndc(pair.a)
      const [bx, by] = ndc(pair.b)
      const sw  = Math.hypot(bx - ax, by - ay) * 1.05
      const ang = Math.atan2(by - ay, bx - ax)
      addDebug(
        new THREE.PlaneGeometry(sw, 0.045),
        new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true }),
        (ax + bx) / 2, (ay + by) / 2, 0.01, ang
      )
    })
  }, [toNDC])

  // ── Per-frame render — called from detectPose rAF ─────────────────────────
  const renderFrame = useCallback((
    lms: PoseLandmark[] | null,
    cW: number, cH: number,
    vW: number, vH: number
  ) => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return

    if (!activeRef.current) {
      if (dressMeshRef.current) dressMeshRef.current.visible = false
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      return
    }

    if (lms && cW > 0 && vW > 0) {
      updateDressMesh(lms, cW, cH, vW, vH)
    } else {
      if (dressMeshRef.current) dressMeshRef.current.visible = false
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }, [updateDressMesh, updateDebugMesh])

  // ── Load dress ────────────────────────────────────────────────────────────
  const loadDress = useCallback((imageUrl: string, category: DressCategory) => {
    categoryRef.current = category
    activeRef.current   = true
    resetPhysics()

    // Dispose old dress mesh so it gets rebuilt with new texture
    if (dressMeshRef.current && groupRef.current) {
      dressMeshRef.current.geometry.dispose()
      ;(dressMeshRef.current.material as THREE.Material).dispose()
      groupRef.current.remove(dressMeshRef.current)
      dressMeshRef.current = null
      dressGeoRef.current  = null
    }

    if (textureRef.current) {
      textureRef.current.dispose()
      textureRef.current = null
    }

    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'
    loader.load(
      imageUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.minFilter  = THREE.LinearFilter
        tex.magFilter  = THREE.LinearFilter
        textureRef.current = tex
        console.log('✅ Dress texture loaded:', imageUrl)
      },
      undefined,
      (err) => console.error('❌ Dress texture load failed:', err)
    )
  }, [resetPhysics])

  // ── Resize ────────────────────────────────────────────────────────────────
  const resize = useCallback((w: number, h: number) => {
    if (rendererRef.current) rendererRef.current.setSize(w, h)
  }, [])

  // ── Clear dress ───────────────────────────────────────────────────────────
  const clearDress = useCallback(() => {
    activeRef.current = false
    resetPhysics()

    if (dressMeshRef.current && groupRef.current) {
      dressMeshRef.current.geometry.dispose()
      ;(dressMeshRef.current.material as THREE.Material).dispose()
      groupRef.current.remove(dressMeshRef.current)
      dressMeshRef.current = null
      dressGeoRef.current  = null
    }

    if (textureRef.current) {
      textureRef.current.dispose()
      textureRef.current = null
    }

    if (groupRef.current) clearGroup(groupRef.current)
  }, [resetPhysics])

  // ── Dispose ───────────────────────────────────────────────────────────────
  const dispose = useCallback(() => {
    clearDress()
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
