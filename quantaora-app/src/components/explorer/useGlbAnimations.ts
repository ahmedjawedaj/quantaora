import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function useGlbAnimations({
  model,
  clips,
  playing,
  onAvailabilityChange,
}: {
  model: THREE.Object3D
  clips: THREE.AnimationClip[]
  playing: boolean
  onAvailabilityChange?: (available: boolean) => void
}) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  useEffect(() => {
    onAvailabilityChange?.(clips.length > 0)
  }, [clips.length, onAvailabilityChange])

  useEffect(() => {
    if (clips.length === 0) {
      mixerRef.current = null
      return
    }

    const mixer = new THREE.AnimationMixer(model)
    mixer.timeScale = playing ? 1 : 0
    clips.forEach((clip) => {
      mixer.clipAction(clip).reset().play()
    })
    mixerRef.current = mixer

    return () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(model)
      mixerRef.current = null
    }
  }, [model, clips])

  useEffect(() => {
    if (mixerRef.current) mixerRef.current.timeScale = playing ? 1 : 0
  }, [playing])

  useFrame((_, delta) => {
    if (playing) mixerRef.current?.update(delta)
  })
}
