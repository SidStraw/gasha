import { useRef, useMemo, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, OrbitControls } from '@react-three/drei'
import type { GachaItem, GamePhase } from '@gasha/shared'
import { PHYSICS, ANIMATION } from '@gasha/shared'
import { Container } from './Container'
import { GachaBalls, GachaBallsRef } from './GachaBalls'
import { RevealBall } from './RevealAnimation'
import { usePhysicsControl } from '@/hooks/usePhysicsControl'

interface PhysicsPoolProps {
  items: GachaItem[]
  selectedId: string | null
  phase: GamePhase
  onPhaseChange?: (phase: GamePhase) => void
}

/**
 * 物理場景內部組件
 */
function PhysicsScene({ items, selectedId, phase, onPhaseChange }: PhysicsPoolProps) {
  const gachaBallsRef = useRef<GachaBallsRef>(null)
  
  // 使用物理控制 Hook
  usePhysicsControl(
    { current: gachaBallsRef.current?.rigidBodies || null }
  )

  // 找到選中的球體
  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    return items.find(item => item.id === selectedId) || null
  }, [items, selectedId])

  // 取得選中球體的 RigidBody
  const selectedRigidBody = useMemo(() => {
    if (!selectedId || !gachaBallsRef.current) return null
    return gachaBallsRef.current.getRigidBodyById(selectedId)
  }, [selectedId, gachaBallsRef.current])

  // 揭曉動畫完成回調
  const handleRevealComplete = useCallback(() => {
    onPhaseChange?.('REVEALING')
  }, [onPhaseChange])

  return (
    <Physics 
      gravity={[...PHYSICS.GRAVITY]} 
      timeStep={PHYSICS.TIME_STEP}
    >
      <Container />
      <GachaBalls 
        ref={gachaBallsRef}
        items={items} 
        selectedId={selectedId}
      />
      
      {/* 選中球體的揭曉動畫 */}
      {selectedItem && phase === 'SELECTING' && (
        <RevealBall
          item={selectedItem}
          rigidBody={selectedRigidBody}
          phase={phase}
          onRevealComplete={handleRevealComplete}
        />
      )}
    </Physics>
  )
}

/**
 * 物理池主組件 - 包含 R3F Canvas
 */
export function PhysicsPool({ items, selectedId, phase, onPhaseChange }: PhysicsPoolProps) {
  const cameraPosition = ANIMATION.CAMERA.DEFAULT_POSITION

  return (
    <Canvas
      gl={{ 
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      camera={{ 
        position: [...cameraPosition],
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      shadows
      style={{ background: 'transparent' }}
    >
      {/* 燈光 */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight
        position={[-10, 10, -10]}
        intensity={0.3}
      />

      {/* 環境光 */}
      <Environment preset="studio" />

      {/* 物理場景 */}
      <PhysicsScene 
        items={items} 
        selectedId={selectedId} 
        phase={phase}
        onPhaseChange={onPhaseChange}
      />

      {/* 開發用軌道控制 (正式版可移除) */}
      <OrbitControls 
        enablePan={false}
        minDistance={5}
        maxDistance={30}
        target={[0, PHYSICS.CONTAINER.HEIGHT / 2, 0]}
      />
    </Canvas>
  )
}
