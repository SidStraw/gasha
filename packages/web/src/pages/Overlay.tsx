import { useParams } from 'react-router-dom'
import { Suspense, useState, useCallback } from 'react'
import { useGachaSocket } from '@/hooks/useGachaSocket'
import { useGachaStore } from '@/stores/gachaStore'
import { PhysicsPool } from '@/components/three'
import type { GamePhase } from '@gasha/shared'

export default function Overlay() {
  const { roomId } = useParams<{ roomId: string }>()
  
  if (!roomId) {
    return <div>Invalid room ID</div>
  }

  return <OverlayContent roomId={roomId} />
}

interface OverlayContentProps {
  roomId: string
}

function OverlayContent({ roomId }: OverlayContentProps) {
  // 建立 Socket 連線
  const { setGamePhase } = useGachaSocket(roomId)
  
  const { items, phase, isConnected, selectedId, winnerId } = useGachaStore()
  const [showDebug, setShowDebug] = useState(true)

  // 處理 phase 變更
  const handlePhaseChange = useCallback((newPhase: GamePhase) => {
    setGamePhase(newPhase)
  }, [setGamePhase])

  // 獲勝者資訊
  const winner = items.find(item => item.id === winnerId)

  return (
    <div className="w-full h-screen bg-transparent overflow-hidden">
      {/* 3D 物理場景 */}
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center text-white/50">
          Loading 3D Scene...
        </div>
      }>
        <PhysicsPool 
          items={items} 
          selectedId={selectedId} 
          phase={phase}
          onPhaseChange={handlePhaseChange}
        />
      </Suspense>

      {/* 獲勝者顯示 */}
      {winner && (phase === 'REVEALING' || phase === 'RESULT') && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bounce">
          <div className="text-sm text-center opacity-80">🎉 恭喜</div>
          <div className="text-3xl font-bold text-center">{winner.label}</div>
        </div>
      )}

      {/* Debug 資訊 (可切換) */}
      {showDebug && (
        <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg text-xs pointer-events-none">
          <div>Room: {roomId}</div>
          <div>Connected: {isConnected ? '✅' : '❌'}</div>
          <div>Items: {items.length}</div>
          <div>Phase: {phase}</div>
          <div>Selected: {selectedId || 'none'}</div>
        </div>
      )}

      {/* Debug 切換按鈕 */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded text-xs hover:bg-black/70"
      >
        {showDebug ? '隱藏' : '顯示'} Debug
      </button>
    </div>
  )
}
