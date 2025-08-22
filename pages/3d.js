// pages/3d.js
import Head from 'next/head'
import { useEffect, useRef } from 'react'

export default function ThreeD() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // ---- TUNABLES ----
    const BASE_PHI = 0.25           // default pitch (polar angle), radians
    const YAW_RANGE = 0.25          // smaller = less sensitive (theta)
    const PITCH_RANGE = 0.12        // smaller = less sensitive (phi)
    const EASE = 0.08               // 0.05–0.15: lower = smoother/slower
    const MIN_PHI = 0.05            // clamp so it never flips
    const MAX_PHI = 0.55
    const RADIUS = '2.5m'           // keep distance stable

    // Target orbit we’ll ease toward (theta = yaw, phi = pitch)
    let targetTheta = 0
    let targetPhi = BASE_PHI
    let rafId = 0

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

    // Map pointer -> target angles
    function onPointer(x, y, w, h) {
      const nx = (x / w) * 2 - 1   // -1..1 (left->right)
      const ny = (y / h) * 2 - 1   // -1..1 (top->bottom)

      // Inverted axes & reduced sensitivity:
      // - Horizontal controls YAW (theta). Inverted via the leading minus.
      targetTheta = -nx * YAW_RANGE

      // - Vertical controls PITCH (phi). Inverted via the leading minus.
      targetPhi = clamp(BASE_PHI + (-ny) * PITCH_RANGE, MIN_PHI, MAX_PHI)
    }

    const handleMouse = (e) => {
      const r = el.getBoundingClientRect()
      onPointer(e.clientX - r.left, e.clientY - r.top, r.width, r.height)
    }

    const handleTouch = (e) => {
      const t = e.touches[0]
      if (!t) return
      const r = el.getBoundingClientRect()
      onPointer(t.clientX - r.left, t.clientY - r.top, r.width, r.height)
    }

    // Smoothly ease current orbit toward target each frame
    const tick = () => {
      const parts = (el.cameraOrbit || `0rad ${BASE_PHI}rad ${RADIUS}`).split(' ')
      const curTheta = parseFloat(parts[0]) || 0
      const curPhi = parseFloat(parts[1]) || BASE_PHI
      const radius = parts[2] || RADIUS

      const nextTheta = curTheta + (targetTheta - curTheta) * EASE
      const nextPhi = curPhi + (targetPhi - curPhi) * EASE

      el.cameraOrbit = `${nextTheta}rad ${nextPhi}rad ${radius}`
      rafId = requestAnimationFrame(tick)
    }

    el.addEventListener('mousemove', handleMouse)
    el.addEventListener('touchmove', handleTouch, { passive: true })
    rafId = requestAnimationFrame(tick)

    return () => {
      el.removeEventListener('mousemove', handleMouse)
      el.removeEventListener('touchmove', handleTouch)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      <Head>
        <script
          type="module"
          src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        ></script>
      </Head>

      <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <h1 className="text-xl mb-3 opacity-80">Move your mouse 👇</h1>
          <model-viewer
            ref={ref}
            src="/models/LIPS.glb"
            alt="LIPS model"
            style={{ width: '100%', height: '70vh', background: 'transparent' }}
            camera-controls          // allows orbit inertia (we override orbit each frame)
            disable-zoom             // keeps radius fixed so roll can't happen
            exposure="1.1"
            environment-image="neutral"
            shadow-intensity="0"
          />
        </div>
      </main>
    </>
  )
}
