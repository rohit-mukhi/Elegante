import { useRef, useCallback } from 'react'
import type { DeviceTier } from '../contexts/DeviceCapabilityContext'

// Grid dimensions for Verlet simulation (high-end)
// 8 cols × 12 rows = 96 vertices — cheap enough to run alongside MediaPipe
const COLS = 8
const ROWS = 12

// Physics constants
const GRAVITY         = 0.00008  // downward pull per frame
const DAMPING         = 0.96     // velocity decay
const CONSTRAINT_ITER = 3        // iterations of stretch constraint per frame
const MAX_STRETCH     = 1.15     // max allowed distance ratio between adjacent vertices

// Low-end fake physics constants
const INERTIA_STRENGTH = 0.04    // how much the dress lags behind body movement
const SWING_STRENGTH   = 0.06    // how much the bottom swings opposite to lateral movement
const SMOOTH_FACTOR    = 0.10    // lerp factor — how fast the offset catches up

export interface PhysicsVertex {
  x: number   // NDC x offset to apply to the base mesh vertex
  y: number   // NDC y offset
}

// Flat array of (COLS * ROWS) vertices representing the dress mesh deformation
export type PhysicsGrid = PhysicsVertex[]

interface VerletParticle {
  x:  number; y:  number   // current position (NDC)
  px: number; py: number   // previous position
  pinned: boolean          // pinned particles don't move (top row = collar)
}

export function useClothPhysics(tier: DeviceTier) {
  const useVerlet = tier === 'high'

  // ── Verlet state (high-end) ───────────────────────────────────────────────
  const particlesRef    = useRef<VerletParticle[] | null>(null)
  const prevMeshRef     = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  // ── Fake physics state (low-end) ─────────────────────────────────────────
  const prevCenterRef   = useRef<{ x: number; y: number } | null>(null)
  const currentOffsetRef = useRef({ x: 0, y: 0 })
  const targetOffsetRef  = useRef({ x: 0, y: 0 })

  // ── Initialize Verlet grid from mesh bounding box ─────────────────────────
  const initVerlet = useCallback((
    cx: number, cy: number,   // mesh center NDC
    hw: number, hh: number    // mesh half-width, half-height NDC
  ) => {
    const particles: VerletParticle[] = []

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const t = col / (COLS - 1)   // 0..1 across width
        const s = row / (ROWS - 1)   // 0..1 down height

        const x = cx - hw + t * hw * 2
        const y = cy + hh - s * hh * 2   // top = +hh, bottom = -hh

        particles.push({
          x, y,
          px: x, py: y,
          pinned: row === 0   // top row pinned to collar/shoulder landmarks
        })
      }
    }

    particlesRef.current = particles
    prevMeshRef.current  = { x: cx, y: cy, w: hw * 2, h: hh * 2 }
  }, [])

  // ── Update pin positions each frame to follow shoulder landmarks ──────────
  const updatePins = useCallback((
    cx: number, cy: number,
    hw: number, hh: number
  ) => {
    const particles = particlesRef.current
    if (!particles) return

    for (let col = 0; col < COLS; col++) {
      const t = col / (COLS - 1)
      const x = cx - hw + t * hw * 2
      const y = cy + hh   // top of mesh = collar

      const idx = col   // row 0
      particles[idx].x  = x
      particles[idx].y  = y
      particles[idx].px = x
      particles[idx].py = y
    }
  }, [])

  // ── Verlet integration step ───────────────────────────────────────────────
  const stepVerlet = useCallback(() => {
    const particles = particlesRef.current
    if (!particles) return

    // Integrate
    for (const p of particles) {
      if (p.pinned) continue
      const vx = (p.x - p.px) * DAMPING
      const vy = (p.y - p.py) * DAMPING
      p.px = p.x
      p.py = p.y
      p.x += vx
      p.y += vy - GRAVITY
    }

    // Constraint solving — prevent over-stretching between adjacent particles
    // restLen is computed once from the initial grid spacing
    const restH = prevMeshRef.current ? prevMeshRef.current.w / (COLS - 1) : 0.01
    const restV = prevMeshRef.current ? prevMeshRef.current.h / (ROWS - 1) : 0.01

    for (let iter = 0; iter < CONSTRAINT_ITER; iter++) {
      // Horizontal constraints
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS - 1; col++) {
          const a = particles[row * COLS + col]
          const b = particles[row * COLS + col + 1]
          satisfyConstraint(a, b, restH)
        }
      }
      // Vertical constraints
      for (let row = 0; row < ROWS - 1; row++) {
        for (let col = 0; col < COLS; col++) {
          const a = particles[row       * COLS + col]
          const b = particles[(row + 1) * COLS + col]
          satisfyConstraint(a, b, restV)
        }
      }
    }
  }, [])

  function satisfyConstraint(a: VerletParticle, b: VerletParticle, restLen: number) {
    const dx   = b.x - a.x
    const dy   = b.y - a.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001
    const maxLen = restLen * MAX_STRETCH
    if (dist <= maxLen) return  // within acceptable range, no correction needed

    const diff = (dist - maxLen) / dist * 0.5
    const ox   = dx * diff
    const oy   = dy * diff

    if (!a.pinned) { a.x += ox; a.y += oy }
    if (!b.pinned) { b.x -= ox; b.y -= oy }
  }

  // ── Compute Verlet output grid ────────────────────────────────────────────
  // Returns per-vertex NDC offsets from the base flat mesh position
  const computeVerletOffsets = useCallback((
    cx: number, cy: number,
    hw: number, hh: number
  ): PhysicsGrid => {
    const particles = particlesRef.current
    if (!particles) {
      initVerlet(cx, cy, hw, hh)
      return flatGrid()
    }

    // Move pins to follow collar each frame
    updatePins(cx, cy, hw, hh)

    // Step simulation
    stepVerlet()

    // Convert particle positions to offsets from base flat mesh
    const grid: PhysicsGrid = []
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const p    = particles[row * COLS + col]
        const t    = col / (COLS - 1)
        const s    = row / (ROWS - 1)
        const baseX = cx - hw + t * hw * 2
        const baseY = cy + hh - s * hh * 2
        grid.push({ x: p.x - baseX, y: p.y - baseY })
      }
    }
    return grid
  }, [initVerlet, updatePins, stepVerlet])

  // ── Fake physics (low-end): velocity lag + bottom swing ──────────────────
  const computeFakeOffsets = useCallback((
    cx: number, cy: number
  ): PhysicsGrid => {
    const prev = prevCenterRef.current

    if (prev) {
      // Velocity of torso center this frame
      const velX = cx - prev.x
      const velY = cy - prev.y

      // Target offset: dress lags opposite to movement direction
      targetOffsetRef.current = {
        x: -velX * INERTIA_STRENGTH * 60,   // ×60 to normalise from per-frame to NDC scale
        y: -velY * INERTIA_STRENGTH * 60,
      }
    }

    prevCenterRef.current = { x: cx, y: cy }

    // Lerp current offset toward target — creates smooth follow
    currentOffsetRef.current = {
      x: currentOffsetRef.current.x + (targetOffsetRef.current.x - currentOffsetRef.current.x) * SMOOTH_FACTOR,
      y: currentOffsetRef.current.y + (targetOffsetRef.current.y - currentOffsetRef.current.y) * SMOOTH_FACTOR,
    }

    // Decay target offset back to zero — dress returns to rest
    targetOffsetRef.current = {
      x: targetOffsetRef.current.x * DAMPING,
      y: targetOffsetRef.current.y * DAMPING,
    }

    const { x: ox, y: oy } = currentOffsetRef.current
    const grid: PhysicsGrid = []

    for (let row = 0; row < ROWS; row++) {
      // Top rows (collar) move less, bottom rows swing more
      // rowFactor: 0 at top (pinned), 1 at bottom (full swing)
      const rowFactor = row / (ROWS - 1)

      // Bottom swings laterally opposite to direction — skirt/hem effect
      const swingX = -ox * rowFactor * SWING_STRENGTH * rowFactor

      for (let col = 0; col < COLS; col++) {
        grid.push({
          x: ox * rowFactor + swingX,
          y: oy * rowFactor,
        })
      }
    }

    return grid
  }, [])

  // ── Public API: compute physics for this frame ────────────────────────────
  const computePhysics = useCallback((
    cx: number, cy: number,   // torso center NDC
    hw: number, hh: number    // half dimensions of dress mesh
  ): PhysicsGrid => {
    if (useVerlet) {
      return computeVerletOffsets(cx, cy, hw, hh)
    } else {
      return computeFakeOffsets(cx, cy)
    }
  }, [useVerlet, computeVerletOffsets, computeFakeOffsets])

  // ── Reset when dress changes ──────────────────────────────────────────────
  const reset = useCallback(() => {
    particlesRef.current    = null
    prevMeshRef.current     = null
    prevCenterRef.current   = null
    currentOffsetRef.current = { x: 0, y: 0 }
    targetOffsetRef.current  = { x: 0, y: 0 }
  }, [])

  return { computePhysics, reset, COLS, ROWS }
}

// Helper: flat grid with zero offsets (no deformation)
function flatGrid(): PhysicsGrid {
  return Array.from({ length: COLS * ROWS }, () => ({ x: 0, y: 0 }))
}
