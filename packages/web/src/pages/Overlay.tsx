import { useParams } from 'react-router-dom'
import { useGachaSocket } from '@/hooks/useGachaSocket'
import { useGachaStore } from '@/stores/gachaStore'

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
  useGachaSocket(roomId)
  
  const { items, phase, isConnected, selectedId } = useGachaStore()

  return (
    <div className="w-full h-screen bg-transparent">
      {/* 暫時顯示狀態資訊，Phase 2 會替換為 3D Canvas */}
      <div className="absolute top-4 left-4 bg-black/50 text-white p-4 rounded-lg text-sm">
        <div>Room: {roomId}</div>
        <div>Connected: {isConnected ? '✅' : '❌'}</div>
        <div>Items: {items.length}</div>
        <div>Phase: {phase}</div>
        <div>Selected: {selectedId || 'none'}</div>
      </div>

      {/* Phase 2: 3D Canvas 將在這裡 */}
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white/50 text-2xl">
          🎱 3D Scene (Phase 2)
        </div>
      </div>

      {/* Debug: 顯示所有球體 */}
      {items.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">球體清單:</div>
          <div className="flex flex-wrap gap-2">
            {items.map(item => (
              <div
                key={item.id}
                className={`px-2 py-1 rounded text-xs ${
                  item.id === selectedId ? 'ring-2 ring-yellow-400' : ''
                }`}
                style={{ backgroundColor: item.color }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
