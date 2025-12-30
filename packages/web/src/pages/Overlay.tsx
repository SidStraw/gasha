import { useParams } from 'react-router-dom'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { Settings } from 'lucide-react'
import { useGachaSocket } from '@/hooks/useGachaSocket'
import { useGachaStore } from '@/stores/gachaStore'
import { GachaScene, PrizeDisplay } from '@/components/gacha'

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
  const { triggerShake, resetRoom, setGamePhase } = useGachaSocket(roomId)
  
  const { items, phase, isConnected, winnerId } = useGachaStore()
  const [showDebug, setShowDebug] = useState(false)
  const [shakeTrigger, setShakeTrigger] = useState(0)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [showPrize, setShowPrize] = useState(false)

  // 獲勝者資訊
  const winner = useMemo(() => {
    return items.find(item => item.id === winnerId) || null
  }, [items, winnerId])

  // 監聽 phase 變化顯示獎品
  useEffect(() => {
    if (phase === 'SELECTING' || phase === 'REVEALING' || phase === 'RESULT') {
      setShowPrize(true)
    }
  }, [phase])

  // 監聽 shake 事件
  useEffect(() => {
    const handleShake = () => {
      setShakeTrigger(prev => prev + 1)
    }
    window.addEventListener('gasha:shake', handleShake)
    return () => window.removeEventListener('gasha:shake', handleShake)
  }, [])

  // Handle clicking a ball in the scene
  const handleBallClick = useCallback((id: string, color: string, name: string) => {
    // 透過 socket 廣播選中的球
    // 這裡可以擴展為手動選擇模式
    console.log('Ball clicked:', { id, color, name })
  }, [])

  const handleClosePrize = useCallback(() => {
    setShowPrize(false)
    setGamePhase('IDLE')
  }, [setGamePhase])

  const handleShake = useCallback(() => {
    setShakeTrigger(prev => prev + 1)
    triggerShake(5)
  }, [triggerShake])

  const handleReset = useCallback(() => {
    setResetTrigger(prev => prev + 1)
    resetRoom()
  }, [resetRoom])

  return (
    <div className="relative w-full h-screen bg-[#FDFBF7] overflow-hidden select-none font-['Nunito',sans-serif]">
      
      {/* Background Text */}
      <div className="absolute top-8 left-0 right-0 text-center pointer-events-none z-0">
        <h1 className="text-[#D3C1B3] font-black text-xl tracking-[0.2em] uppercase">
          {items.length > 0 ? "Click Ball to Open" : "Machine Empty"}
        </h1>
        <p className="text-[#D3C1B3]/60 text-sm font-bold mt-1">
          Remaining: {items.length}
        </p>
      </div>

      {/* Main Physics Scene (2D Matter.js) */}
      <div className="absolute inset-0 z-10">
        <GachaScene 
          items={items}
          onBallClick={handleBallClick}
          triggerShake={shakeTrigger}
          triggerReset={resetTrigger}
        />
      </div>

      {/* Bottom Left: Reset Button */}
      <div className="absolute bottom-6 left-6 z-20">
        <button 
          onClick={handleReset}
          className="w-16 h-16 bg-white border-4 border-[#6D5E53] rounded-full flex flex-col items-center justify-center text-[#6D5E53] font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
            <span className="text-sm">Reset</span>
        </button>
      </div>

      {/* Bottom Right: Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex gap-4 items-end">
        
        {/* Debug Button */}
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className="w-16 h-16 bg-[#F3CC5A] border-4 border-[#8B6B40] rounded-full flex flex-col items-center justify-center text-[#5D4037] font-bold shadow-lg hover:scale-105 transition-transform"
        >
          <Settings size={24} />
        </button>

        {/* Shake Button */}
        <button 
          onClick={handleShake}
          className="w-16 h-16 bg-[#5D9CEC] border-4 border-[#2E5E8E] rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          <span className="text-sm">Shake</span>
        </button>
      </div>

      {/* Prize Overlay */}
      {showPrize && (
        <PrizeDisplay 
          winner={winner} 
          isLoading={phase === 'SELECTING'} 
          onClose={handleClosePrize} 
        />
      )}

      {/* Debug 資訊 (可切換) */}
      {showDebug && (
        <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg text-xs z-30">
          <div>Room: {roomId}</div>
          <div>Connected: {isConnected ? '✅' : '❌'}</div>
          <div>Items: {items.length}</div>
          <div>Phase: {phase}</div>
          <div>Winner: {winner?.label || 'none'}</div>
        </div>
      )}
    </div>
  )
}
