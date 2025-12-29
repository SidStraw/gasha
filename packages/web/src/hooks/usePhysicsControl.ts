import { useEffect, useCallback, useRef } from 'react'
import type { RapierRigidBody } from '@react-three/rapier'
import { PHYSICS } from '@gasha/shared'

interface ShakeEvent extends CustomEvent {
  detail: { strength: number }
}

/**
 * 物理控制 Hook - 處理攪拌等物理操作
 */
export function usePhysicsControl(
  rigidBodiesRef: React.RefObject<RapierRigidBody[] | null>
) {
  const isShaking = useRef(false)

  // 對所有球體施加隨機脈衝
  const applyShakeImpulse = useCallback((strength: number) => {
    const bodies = rigidBodiesRef.current
    if (!bodies || bodies.length === 0 || isShaking.current) return

    isShaking.current = true

    bodies.forEach((body) => {
      // 隨機延遲，避免同步感太強
      const delay = Math.random() * 100

      setTimeout(() => {
        if (!body) return

        // 隨機方向的脈衝
        const angle = Math.random() * Math.PI * 2
        const upwardBias = 0.5 + Math.random() * 0.5 // 向上偏移
        
        const impulse = {
          x: Math.cos(angle) * strength * (0.5 + Math.random() * 0.5),
          y: strength * upwardBias,
          z: Math.sin(angle) * strength * (0.5 + Math.random() * 0.5),
        }

        body.applyImpulse(impulse, true)

        // 加入旋轉
        const torque = {
          x: (Math.random() - 0.5) * strength * 0.3,
          y: (Math.random() - 0.5) * strength * 0.3,
          z: (Math.random() - 0.5) * strength * 0.3,
        }
        body.applyTorqueImpulse(torque, true)
      }, delay)
    })

    // 重置 shaking 狀態
    setTimeout(() => {
      isShaking.current = false
    }, 500)
  }, [rigidBodiesRef])

  // 監聽 shake 事件
  useEffect(() => {
    const handleShake = (event: Event) => {
      const shakeEvent = event as ShakeEvent
      const strength = shakeEvent.detail?.strength ?? PHYSICS.SHAKE.DEFAULT_STRENGTH
      applyShakeImpulse(strength)
    }

    window.addEventListener('gasha:shake', handleShake)
    return () => window.removeEventListener('gasha:shake', handleShake)
  }, [applyShakeImpulse])

  return {
    applyShakeImpulse,
    isShaking: isShaking.current,
  }
}
