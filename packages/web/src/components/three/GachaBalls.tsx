import { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'
import { InstancedRigidBodies, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { GachaItem } from '@gasha/shared'
import { PHYSICS } from '@gasha/shared'

interface GachaBallsProps {
  items: GachaItem[]
  selectedId: string | null
}

// 導出 ref 類型供外部使用
export interface GachaBallsRef {
  rigidBodies: RapierRigidBody[] | null
  getRigidBodyById: (id: string) => RapierRigidBody | null
}

/**
 * InstancedMesh 球體 - 使用 InstancedRigidBodies 管理物理實體
 */
export const GachaBalls = forwardRef<GachaBallsRef, GachaBallsProps>(
  function GachaBalls({ items, selectedId: _selectedId }, ref) {
    const rigidBodiesRef = useRef<RapierRigidBody[]>(null)
    const meshRef = useRef<THREE.InstancedMesh>(null)

    // 暴露給父組件的方法
    useImperativeHandle(ref, () => ({
      rigidBodies: rigidBodiesRef.current,
      getRigidBodyById: (id: string) => {
        const index = items.findIndex(item => item.id === id)
        if (index === -1 || !rigidBodiesRef.current) return null
        return rigidBodiesRef.current[index] || null
      },
    }), [items])

    // 產生初始位置 (從頂部隨機散落)
    const instances = useMemo(() => {
      console.log('[GachaBalls] Creating instances for', items.length, 'items')
      return items.map((item, index) => {
        const row = Math.floor(index / 10)
        const col = index % 10
        const x = (col - 4.5) * (PHYSICS.BALL.RADIUS * 2.5)
        const z = (row - 4.5) * (PHYSICS.BALL.RADIUS * 2.5)
        const y = PHYSICS.CONTAINER.HEIGHT + 2 + Math.random() * 3

        return {
          key: item.id,
          position: [x, y, z] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
        }
      })
    }, [items])

    // 更新實例顏色
    useEffect(() => {
      if (!meshRef.current || items.length === 0) return

      const color = new THREE.Color()
      items.forEach((item, i) => {
        color.set(item.color)
        meshRef.current!.setColorAt(i, color)
      })
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true
      }
    }, [items])

    console.log('[GachaBalls] Rendering with', items.length, 'items')

    if (items.length === 0) return null

    return (
      <InstancedRigidBodies
        ref={rigidBodiesRef}
        instances={instances}
        colliders="ball"
        restitution={PHYSICS.BALL.RESTITUTION}
        friction={PHYSICS.BALL.FRICTION}
      >
        <instancedMesh 
          ref={meshRef} 
          args={[undefined, undefined, items.length]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[PHYSICS.BALL.RADIUS, 32, 32]} />
          <meshStandardMaterial 
            color="#ff6b6b"
            metalness={0.3}
            roughness={0.4}
          />
        </instancedMesh>
      </InstancedRigidBodies>
    )
  }
)
