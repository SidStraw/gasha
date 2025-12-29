import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { PHYSICS } from '@gasha/shared'

const { WIDTH, HEIGHT, DEPTH, WALL_THICKNESS } = PHYSICS.CONTAINER

/**
 * 方箱容器 - 5 面靜態碰撞器 (底部 + 四面牆，無頂)
 */
export function Container() {
  const halfWidth = WIDTH / 2
  const halfHeight = HEIGHT / 2
  const halfDepth = DEPTH / 2
  const halfThickness = WALL_THICKNESS / 2

  return (
    <RigidBody type="fixed" colliders={false}>
      {/* 底部 */}
      <CuboidCollider 
        args={[halfWidth, halfThickness, halfDepth]} 
        position={[0, -halfThickness, 0]} 
      />
      
      {/* 前面牆 */}
      <CuboidCollider 
        args={[halfWidth, halfHeight, halfThickness]} 
        position={[0, halfHeight, halfDepth + halfThickness]} 
      />
      
      {/* 後面牆 */}
      <CuboidCollider 
        args={[halfWidth, halfHeight, halfThickness]} 
        position={[0, halfHeight, -halfDepth - halfThickness]} 
      />
      
      {/* 左邊牆 */}
      <CuboidCollider 
        args={[halfThickness, halfHeight, halfDepth]} 
        position={[-halfWidth - halfThickness, halfHeight, 0]} 
      />
      
      {/* 右邊牆 */}
      <CuboidCollider 
        args={[halfThickness, halfHeight, halfDepth]} 
        position={[halfWidth + halfThickness, halfHeight, 0]} 
      />

      {/* 視覺化邊界 (半透明) */}
      <mesh position={[0, halfHeight, 0]}>
        <boxGeometry args={[WIDTH, HEIGHT, DEPTH]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.05} 
          wireframe 
        />
      </mesh>
    </RigidBody>
  )
}
