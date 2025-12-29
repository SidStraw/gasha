import { useParams, useNavigate } from 'react-router-dom'
import { useState, useCallback, useMemo } from 'react'
import { nanoid } from 'nanoid'
import { useGachaSocket } from '@/hooks/useGachaSocket'
import { useGachaStore } from '@/stores/gachaStore'
import { COLORS, LIMITS, PHYSICS } from '@gasha/shared'
import type { GachaItem } from '@gasha/shared'

export default function Controller() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  
  if (!roomId) {
    return <div>Invalid room ID</div>
  }

  return <ControllerContent roomId={roomId} navigate={navigate} />
}

interface ControllerContentProps {
  roomId: string
  navigate: ReturnType<typeof useNavigate>
}

function ControllerContent({ roomId, navigate }: ControllerContentProps) {
  const { syncItems, triggerShake, pickWinner, resetRoom } = useGachaSocket(roomId)
  const { items, phase, isConnected, winnerId } = useGachaStore()
  
  const [inputText, setInputText] = useState('')
  const [shakeStrength, setShakeStrength] = useState<number>(PHYSICS.SHAKE.DEFAULT_STRENGTH)

  // 解析文字輸入為 GachaItem 陣列
  const parseInput = useCallback((text: string): GachaItem[] => {
    const lines = text.split('\n').filter(line => line.trim())
    return lines.slice(0, LIMITS.MAX_BALLS).map((line, index) => ({
      id: nanoid(8),
      label: line.trim().slice(0, LIMITS.MAX_LABEL_LENGTH),
      color: COLORS.getColor(index),
    }))
  }, [])

  // 同步名單
  const handleSyncItems = useCallback(() => {
    const newItems = parseInput(inputText)
    syncItems(newItems)
  }, [inputText, parseInput, syncItems])

  // 隨機抽獎
  const handleRandomDraw = useCallback(() => {
    if (items.length === 0) return
    const randomIndex = Math.floor(Math.random() * items.length)
    const winner = items[randomIndex]
    pickWinner(winner.id, 'RANDOM')
  }, [items, pickWinner])

  // 刷新房間 ID
  const handleRefreshRoom = useCallback(() => {
    const newRoomId = nanoid(LIMITS.ROOM_ID_LENGTH)
    navigate(`/controller/${newRoomId}`)
  }, [navigate])

  // 複製 Overlay URL
  const overlayUrl = useMemo(() => {
    const base = window.location.origin
    return `${base}/overlay/${roomId}`
  }, [roomId])

  const handleCopyOverlayUrl = useCallback(() => {
    navigator.clipboard.writeText(overlayUrl)
    alert('已複製 Overlay URL！')
  }, [overlayUrl])

  // 獲勝者資訊
  const winner = useMemo(() => {
    return items.find(item => item.id === winnerId)
  }, [items, winnerId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* 標題與連線狀態 */}
        <header className="text-center">
          <h1 className="text-2xl font-bold mb-2">🎱 Gasha 控制台</h1>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? '已連線' : '連線中...'}</span>
          </div>
        </header>

        {/* 房間資訊 */}
        <section className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">房間 ID</span>
            <button 
              onClick={handleRefreshRoom}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              🔄 換新房間
            </button>
          </div>
          <code className="block bg-gray-900 rounded px-3 py-2 text-center font-mono">
            {roomId}
          </code>
          
          <button
            onClick={handleCopyOverlayUrl}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-500 rounded py-2 text-sm transition-colors"
          >
            📋 複製 OBS Overlay URL
          </button>
        </section>

        {/* 名單輸入 */}
        <section className="bg-gray-800 rounded-lg p-4">
          <label className="block text-gray-400 text-sm mb-2">
            參與名單 (一行一個，最多 {LIMITS.MAX_BALLS} 人)
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="貼上觀眾名單...&#10;觀眾A&#10;觀眾B&#10;觀眾C"
            className="w-full h-40 bg-gray-900 rounded p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-gray-500 text-sm">
              已輸入: {parseInput(inputText).length} 人
            </span>
            <button
              onClick={handleSyncItems}
              disabled={!isConnected}
              className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded px-4 py-2 text-sm transition-colors"
            >
              ✅ 同步名單
            </button>
          </div>
        </section>

        {/* 當前狀態 */}
        <section className="bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-gray-400 text-sm">球數</div>
              <div className="text-2xl font-bold">{items.length}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">階段</div>
              <div className="text-lg font-semibold text-blue-400">{phase}</div>
            </div>
          </div>
          
          {winner && (
            <div className="mt-4 p-3 bg-yellow-900/50 rounded-lg text-center">
              <div className="text-yellow-400 text-sm">🎉 獲勝者</div>
              <div className="text-xl font-bold">{winner.label}</div>
            </div>
          )}
        </section>

        {/* 攪拌控制 */}
        <section className="bg-gray-800 rounded-lg p-4">
          <label className="block text-gray-400 text-sm mb-2">
            攪拌力道: {shakeStrength}
          </label>
          <input
            type="range"
            min={PHYSICS.SHAKE.MIN_STRENGTH}
            max={PHYSICS.SHAKE.MAX_STRENGTH}
            value={shakeStrength}
            onChange={(e) => setShakeStrength(Number(e.target.value))}
            className="w-full mb-3"
          />
          <button
            onClick={() => triggerShake(shakeStrength)}
            disabled={!isConnected || items.length === 0}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 rounded py-3 text-lg font-bold transition-colors"
          >
            🔀 攪拌！
          </button>
        </section>

        {/* 抽獎控制 */}
        <section className="bg-gray-800 rounded-lg p-4 space-y-3">
          <button
            onClick={handleRandomDraw}
            disabled={!isConnected || items.length === 0 || phase !== 'IDLE'}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded py-4 text-xl font-bold transition-colors"
          >
            🎲 隨機抽獎！
          </button>
          
          <button
            onClick={resetRoom}
            disabled={!isConnected || phase === 'IDLE'}
            className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 rounded py-2 text-sm transition-colors"
          >
            ↩️ 重置
          </button>
        </section>
      </div>
    </div>
  )
}
