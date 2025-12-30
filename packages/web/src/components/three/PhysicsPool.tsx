import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import { Canvas, useThree, ThreeEvent, useFrame } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier'
import { OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'
import type { GachaItem, GamePhase } from '@gasha/shared'
import { usePhysicsControl } from '@/hooks/usePhysicsControl'

interface PhysicsPoolProps {
  items: GachaItem[]
  selectedId: string | null
  phase: GamePhase
  onBallClick?: (item: GachaItem) => void
  onPhaseChange?: (phase: GamePhase) => void
}

// 地板碰撞器
function FloorCollider() {
  return (
    <RigidBody type="fixed" colliders={false}>
      {/* 地板 */}
      <CuboidCollider args={[20, 0.1, 20]} position={[0, -0.1, 0]} />
      {/* 四面牆 (隱形) */}
      <CuboidCollider args={[20, 10, 0.1]} position={[0, 5, 15]} />
      <CuboidCollider args={[20, 10, 0.1]} position={[0, 5, -15]} />
      <CuboidCollider args={[0.1, 10, 20]} position={[15, 5, 0]} />
      <CuboidCollider args={[0.1, 10, 20]} position={[-15, 5, 0]} />
    </RigidBody>
  )
}

// 單顆扭蛋球 - GACHAGO 風格 (上白下彩)
interface GachaBallProps {
  item: GachaItem
  initialPosition: [number, number, number]
  isSelected: boolean
  isExiting: boolean
  onClick: (item: GachaItem) => void
}

function GachaBall({ item, initialPosition, isSelected, isExiting, onClick }: GachaBallProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const meshGroupRef = useRef<THREE.Group>(null)
  const shadowRef = useRef<THREE.Mesh>(null)
  const [exitProgress, setExitProgress] = useState(0)
  const radius = 0.8

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (!isExiting) {
      onClick(item)
    }
  }, [item, onClick, isExiting])

  // 每幀更新：同步旋轉 + 陰影 + 退場動畫
  useFrame((_, delta) => {
    if (!rigidBodyRef.current || !meshGroupRef.current) return

    // 同步物理旋轉到視覺
    const rotation = rigidBodyRef.current.rotation()
    meshGroupRef.current.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)

    // 計算離地高度，更新陰影
    const translation = rigidBodyRef.current.translation()
    const height = Math.max(0, translation.y - radius)
    
    if (shadowRef.current) {
      // 陰影大小和透明度隨高度變化
      const shadowScale = Math.max(0.3, 1 - height / 8)
      shadowRef.current.scale.set(shadowScale, shadowScale, 1)
      const mat = shadowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0.1, 0.35 * shadowScale)
    }

    // 退場動畫
    if (isExiting && exitProgress < 1) {
      setExitProgress(prev => Math.min(1, prev + delta * 3))
    }
  })

  // 退場時的縮放和透明度
  const scale = isExiting ? Math.max(0, 1 - exitProgress) : 1
  const opacity = isExiting ? Math.max(0, 1 - exitProgress) : 1

  if (exitProgress >= 1) return null

  return (
    <group>
      {/* 陰影 (投射在地板上) */}
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[initialPosition[0], 0.01, initialPosition[2]]}
      >
        <circleGeometry args={[radius * 1.1, 32]} />
        <meshBasicMaterial
          color="#c8b496"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>

      {/* 物理球體 */}
      <RigidBody
        ref={rigidBodyRef}
        position={initialPosition}
        colliders="ball"
        restitution={0.5}
        friction={0.4}
        linearDamping={0.3}
        angularDamping={0.1}
      >
        <group 
          ref={meshGroupRef} 
          onClick={handleClick}
          scale={scale}
        >
          {/* 上半球 - 白色 */}
          <mesh castShadow>
            <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial
              color="#ffffff"
              metalness={0.05}
              roughness={0.3}
              transparent
              opacity={opacity}
            />
          </mesh>
          
          {/* 下半球 - 彩色 */}
          <mesh castShadow>
            <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial
              color={item.color}
              metalness={0.05}
              roughness={0.3}
              transparent
              opacity={opacity}
              emissive={isSelected ? item.color : '#000000'}
              emissiveIntensity={isSelected ? 0.2 : 0}
            />
          </mesh>
          
          {/* 中線 (棕色邊框) */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius * 1.002, 0.04, 8, 64]} />
            <meshStandardMaterial 
              color="#725349"
              transparent
              opacity={opacity}
            />
          </mesh>
          
          {/* 外框 */}
          <mesh>
            <sphereGeometry args={[radius * 1.01, 32, 32]} />
            <meshBasicMaterial
              color="#725349"
              transparent
              opacity={opacity * 0.15}
              wireframe
            />
          </mesh>
        </group>
      </RigidBody>
    </group>
  )
}

// 物理場景
interface PhysicsSceneProps {
  items: GachaItem[]
  selectedId: string | null
  exitingId: string | null
  onBallClick: (item: GachaItem) => void
}

function PhysicsScene({ items, selectedId, exitingId, onBallClick }: PhysicsSceneProps) {
  const rigidBodiesRef = useRef<RapierRigidBody[]>([])

  // 產生初始位置
  const positions = useMemo(() => {
    return items.map((_, index) => {
      // 隨機散布在地板上
      const angle = Math.random() * Math.PI * 2
      const r = 2 + Math.random() * 6
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r - 2
      const y = 5 + Math.random() * 3 + index * 0.5

      return [x, y, z] as [number, number, number]
    })
  }, [items])

  usePhysicsControl({ current: rigidBodiesRef.current })

  return (
    <Physics gravity={[0, -20, 0]} timeStep={1 / 60}>
      <FloorCollider />
      {items.map((item, index) => (
        <GachaBall
          key={item.id}
          item={item}
          initialPosition={positions[index]}
          isSelected={item.id === selectedId}
          isExiting={item.id === exitingId}
          onClick={onBallClick}
        />
      ))}
    </Physics>
  )
}

/**
 * 3D 物理池 - GACHAGO 俯視等軸風格
 */
export function PhysicsPool({ items, selectedId, onBallClick }: PhysicsPoolProps) {
  const [exitingId, setExitingId] = useState<string | null>(null)

  const handleBallClick = useCallback((item: GachaItem) => {
    // 開始退場動畫
    setExitingId(item.id)
    
    // 延遲觸發回調
    setTimeout(() => {
      onBallClick?.(item)
      setExitingId(null)
    }, 350)
  }, [onBallClick])

  return (
    <Canvas
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      shadows
      style={{ background: 'transparent' }}
    >
      {/* 正交相機 - 等軸俯視角 */}
      <OrthographicCamera
        makeDefault
        position={[0, 15, 15]}
        zoom={50}
        near={0.1}
        far={1000}
      />

      {/* 柔和光線 */}
      <ambientLight intensity={0.8} color="#fff8f0" />
      <directionalLight
        position={[5, 20, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <hemisphereLight args={['#ffffff', '#f0e6d8', 0.4]} />

      {/* 地板 (接收陰影) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#f6f3eb"
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* 物理場景 */}
      <PhysicsScene
        items={items}
        selectedId={selectedId}
        exitingId={exitingId}
        onBallClick={handleBallClick}
      />

      {/* 相機看向原點 */}
      <CameraController />
    </Canvas>
  )
}

// 相機控制器
function CameraController() {
  const { camera } = useThree()

  useEffect(() => {
    camera.lookAt(new THREE.Vector3(0, 0, 0))
  }, [camera])

  return null
}
