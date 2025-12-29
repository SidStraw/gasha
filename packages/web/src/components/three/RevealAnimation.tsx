import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { ANIMATION, PHYSICS } from '@gasha/shared'
import type { GachaItem, GamePhase } from '@gasha/shared'

interface RevealBallProps {
  item: GachaItem
  rigidBody: RapierRigidBody | null
  phase: GamePhase
  onRevealComplete: () => void
}

/**
 * 揭曉動畫球體 - 從物理模式平滑切換至動畫模式
 */
export function RevealBall({ 
  item, 
  rigidBody, 
  phase, 
  onRevealComplete 
}: RevealBallProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [startPosition, setStartPosition] = useState<THREE.Vector3 | null>(null)

  // 計算目標位置 (攝影機正前方)
  const targetPosition = new THREE.Vector3(
    ...ANIMATION.REVEAL.TARGET_POSITION
  )

  // React Spring 動畫
  const [spring, api] = useSpring(() => ({
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: 1,
    config: ANIMATION.REVEAL.SPRING_CONFIG,
  }))

  // 當 phase 變為 SELECTING 時，開始動畫
  useEffect(() => {
    if (phase === 'SELECTING' && rigidBody && !isAnimating) {
      // 1. 讀取當前物理位置
      const translation = rigidBody.translation()
      const currentPos = new THREE.Vector3(
        translation.x,
        translation.y,
        translation.z
      )
      setStartPosition(currentPos)

      // 2. 設定 Spring 起點
      api.set({
        position: [currentPos.x, currentPos.y, currentPos.z],
        rotation: [0, 0, 0],
        scale: 1,
      })

      // 3. 切換 RigidBody 為 kinematic 模式
      rigidBody.setBodyType(2, true) // 2 = KinematicPositionBased

      setIsAnimating(true)

      // 4. 啟動動畫
      api.start({
        position: [targetPosition.x, targetPosition.y, targetPosition.z],
        rotation: [0, Math.PI * 2, 0],
        scale: 1.5,
        onRest: () => {
          onRevealComplete()
        },
      })
    }
  }, [phase, rigidBody, api, isAnimating, targetPosition, onRevealComplete])

  // 重置時恢復物理模式
  useEffect(() => {
    if (phase === 'IDLE' && rigidBody && isAnimating) {
      // 恢復為 Dynamic 模式
      rigidBody.setBodyType(0, true) // 0 = Dynamic
      setIsAnimating(false)
      setStartPosition(null)
    }
  }, [phase, rigidBody, isAnimating])

  // 同步 kinematic 位置
  useFrame(() => {
    if (isAnimating && rigidBody) {
      const pos = spring.position.get()
      rigidBody.setNextKinematicTranslation({
        x: pos[0],
        y: pos[1],
        z: pos[2],
      })
    }
  })

  if (!isAnimating || !startPosition) return null

  // 取得當前位置和旋轉值
  const position = spring.position.get() as [number, number, number]
  const rotationY = spring.rotation.get()[1]
  const scaleValue = spring.scale.get()

  return (
    <animated.mesh
      ref={meshRef}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={scaleValue}
    >
      <sphereGeometry args={[PHYSICS.BALL.RADIUS, 32, 32]} />
      <meshStandardMaterial
        color={item.color}
        metalness={0.4}
        roughness={0.3}
        emissive={item.color}
        emissiveIntensity={0.2}
      />
    </animated.mesh>
  )
}

interface OpeningAnimationProps {
  item: GachaItem
  phase: GamePhase
}

/**
 * 開獎動畫 - 球體打開顯示獎品
 */
export function OpeningAnimation({ item, phase }: OpeningAnimationProps) {
  const topRef = useRef<THREE.Group>(null)
  const [isOpening, setIsOpening] = useState(false)

  const [spring, api] = useSpring(() => ({
    rotation: 0,
    config: { tension: 180, friction: 20 },
  }))

  // 當 phase 變為 REVEALING 時，開始開獎動畫
  useEffect(() => {
    if (phase === 'REVEALING' && !isOpening) {
      setIsOpening(true)
      api.start({
        rotation: ANIMATION.OPEN.ROTATION_ANGLE,
      })
    }
  }, [phase, api, isOpening])

  // 重置
  useEffect(() => {
    if (phase === 'IDLE') {
      setIsOpening(false)
      api.set({ rotation: 0 })
    }
  }, [phase, api])

  if (phase !== 'REVEALING' && phase !== 'RESULT') return null

  return (
    <group position={[...ANIMATION.REVEAL.TARGET_POSITION]}>
      {/* 下半球 (固定) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[PHYSICS.BALL.RADIUS * 1.5, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial
          color={item.color}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* 上半球 (旋轉開啟) */}
      <animated.group
        ref={topRef}
        rotation-x={spring.rotation}
        position={[0, 0, 0]}
      >
        <mesh>
          <sphereGeometry args={[PHYSICS.BALL.RADIUS * 1.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={item.color}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      </animated.group>

      {/* 獎品文字 */}
      {isOpening && (
        <group position={[0, 0.5, 0]}>
          {/* 這裡可以用 Text 組件顯示 item.label */}
        </group>
      )}
    </group>
  )
}
