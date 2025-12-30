import { useRef, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useThree, ThreeEvent, useFrame } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier'
import { Environment, PerspectiveCamera } from '@react-three/drei'
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

// 透明圓球容器 (類似扭蛋機的透明球體)
function GlobeContainer() {
  return (
    <group position={[0, 4, 0]}>
      {/* 透明球體外殼 */}
      <mesh>
        <sphereGeometry args={[5, 64, 64]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          transparent
          opacity={0.15}
          roughness={0.1}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 球體邊緣高光 */}
      <mesh>
        <sphereGeometry args={[5.02, 64, 64]} />
        <meshBasicMaterial 
          color="#725349"
          transparent
          opacity={0.08}
          wireframe
        />
      </mesh>
    </group>
  )
}

// 底座
function MachineBase() {
  return (
    <group position={[0, -0.5, 0]}>
      {/* 底座主體 */}
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[4, 4.5, 1, 32]} />
        <meshStandardMaterial color="#725349" roughness={0.8} />
      </mesh>
      {/* 底座裝飾環 */}
      <mesh position={[0, 0.4, 0]}>
        <torusGeometry args={[4.2, 0.15, 16, 64]} />
        <meshStandardMaterial color="#5a4139" roughness={0.6} />
      </mesh>
    </group>
  )
}

// 簡化的容器 - 方形但視覺上是透明的
function Container() {
  const size = 4
  const height = 7

  return (
    <RigidBody type="fixed" colliders={false}>
      {/* 底部 */}
      <CuboidCollider args={[size, 0.1, size]} position={[0, 0.1, 0]} />
      {/* 前面牆 */}
      <CuboidCollider args={[size, height/2, 0.1]} position={[0, height/2, size]} />
      {/* 後面牆 */}
      <CuboidCollider args={[size, height/2, 0.1]} position={[0, height/2, -size]} />
      {/* 左邊牆 */}
      <CuboidCollider args={[0.1, height/2, size]} position={[-size, height/2, 0]} />
      {/* 右邊牆 */}
      <CuboidCollider args={[0.1, height/2, size]} position={[size, height/2, 0]} />
    </RigidBody>
  )
}

// 單顆扭蛋球組件 - GACHAGO 風格
interface GachaBallProps {
  item: GachaItem
  initialPosition: [number, number, number]
  isSelected: boolean
  onClick: (item: GachaItem) => void
}

function GachaBall({ item, initialPosition, isSelected, onClick }: GachaBallProps) {
  const ref = useRef<RapierRigidBody>(null)
  const groupRef = useRef<THREE.Group>(null)
  const radius = 0.5

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onClick(item)
  }, [item, onClick])

  // 讓球體隨物理旋轉
  useFrame(() => {
    if (ref.current && groupRef.current) {
      const rotation = ref.current.rotation()
      groupRef.current.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
    }
  })

  return (
    <RigidBody
      ref={ref}
      position={initialPosition}
      colliders="ball"
      restitution={0.6}
      friction={0.3}
      linearDamping={0.5}
      angularDamping={0.3}
    >
      <group ref={groupRef} onClick={handleClick}>
        {/* 上半球 (彩色) */}
        <mesh castShadow>
          <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial 
            color={item.color}
            metalness={0.1}
            roughness={0.3}
            emissive={isSelected ? item.color : '#000000'}
            emissiveIntensity={isSelected ? 0.3 : 0}
          />
        </mesh>
        {/* 下半球 (白色) */}
        <mesh castShadow>
          <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial 
            color="#ffffff"
            metalness={0.1}
            roughness={0.4}
          />
        </mesh>
        {/* 中線 */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.01, 0.025, 8, 32]} />
          <meshStandardMaterial color="#725349" />
        </mesh>
        {/* 高光 */}
        <mesh position={[-radius * 0.3, radius * 0.3, radius * 0.5]}>
          <sphereGeometry args={[radius * 0.15, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      </group>
    </RigidBody>
  )
}

// 物理場景
interface PhysicsSceneProps {
  items: GachaItem[]
  selectedId: string | null
  onBallClick: (item: GachaItem) => void
}

function PhysicsScene({ items, selectedId, onBallClick }: PhysicsSceneProps) {
  const rigidBodiesRef = useRef<RapierRigidBody[]>([])

  // 產生初始位置 (在容器內隨機分布)
  const positions = useMemo(() => {
    return items.map((_, index) => {
      const angle = (index / items.length) * Math.PI * 2
      const r = 1.5 + Math.random() * 1.5
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = 8 + Math.random() * 3 + index * 0.2

      return [x, y, z] as [number, number, number]
    })
  }, [items])

  // 物理控制
  usePhysicsControl({ current: rigidBodiesRef.current })

  return (
    <Physics 
      gravity={[0, -15, 0]} 
      timeStep={1/60}
    >
      <Container />
      {items.map((item, index) => (
        <GachaBall
          key={item.id}
          item={item}
          initialPosition={positions[index]}
          isSelected={item.id === selectedId}
          onClick={onBallClick}
        />
      ))}
    </Physics>
  )
}

/**
 * 3D 物理池主組件 - GACHAGO 風格
 */
export function PhysicsPool({ items, selectedId, onBallClick }: PhysicsPoolProps) {
  // 視角：稍微從上方和前方看
  const cameraPosition: [number, number, number] = [0, 6, 14]
  const cameraLookAt: [number, number, number] = [0, 3, 0]

  const handleBallClick = useCallback((item: GachaItem) => {
    onBallClick?.(item)
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
      <PerspectiveCamera
        makeDefault
        position={cameraPosition}
        fov={40}
        near={0.1}
        far={1000}
      />

      {/* 燈光 - 柔和光線 */}
      <ambientLight intensity={0.7} color="#fff8f0" />
      <directionalLight
        position={[5, 12, 8]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        color="#ffffff"
      />
      <directionalLight
        position={[-3, 8, -5]}
        intensity={0.3}
        color="#e0d0c0"
      />
      
      {/* 背景補光 */}
      <hemisphereLight args={['#ffeedd', '#f6f3eb', 0.5]} />

      <Environment preset="apartment" />

      {/* 透明球體容器 (視覺) */}
      <GlobeContainer />
      
      {/* 底座 */}
      <MachineBase />

      {/* 地面 (陰影接收) */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1, 0]} 
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={0.15} />
      </mesh>

      {/* 物理場景 */}
      <PhysicsScene 
        items={items} 
        selectedId={selectedId} 
        onBallClick={handleBallClick}
      />

      <CameraController lookAt={cameraLookAt} />
    </Canvas>
  )
}

// 相機控制器
function CameraController({ lookAt }: { lookAt: [number, number, number] }) {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.lookAt(new THREE.Vector3(...lookAt))
  }, [camera, lookAt])

  return null
}
