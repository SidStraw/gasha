import { useParams } from 'react-router-dom'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { Settings, RotateCcw, Shuffle } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useGachaSocket } from '@/hooks/useGachaSocket'
import { useGachaStore } from '@/stores/gachaStore'
import { GachaScene, PrizeDisplay } from '@/components/gacha'
import { CornerControls, ControlButton, SettingsModal, AlertDialog } from '@/components/ui'
import type { GachaItem, WinnerRecord } from '@gasha/shared'

export default function Overlay() {
  const { roomId } = useParams<{ roomId: string }>()
  
  if (!roomId) {
    return <div className="flex items-center justify-center h-screen bg-gasha-bg text-gasha-brown font-body">Invalid room ID</div>
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
  const [showSettings, setShowSettings] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [shakeTrigger, setShakeTrigger] = useState(0)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [showPrize, setShowPrize] = useState(false)
  
  // 本地紀錄 (未來可同步到 server)
  const [history, setHistory] = useState<WinnerRecord[]>([])

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

  // 記錄獲勝者到歷史
  useEffect(() => {
    if (winner && phase === 'RESULT') {
      setHistory(prev => [
        ...prev,
        { id: crypto.randomUUID(), item: winner, timestamp: Date.now() }
      ])
    }
  }, [winner, phase])

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
    setShowResetDialog(true)
  }, [])

  const confirmReset = useCallback(() => {
    setResetTrigger(prev => prev + 1)
    resetRoom()
    setShowResetDialog(false)
  }, [resetRoom])

  // 編輯功能 (暫時只在本地，未來可透過 socket 同步)
  const handleUpdateItem = useCallback((id: string, updates: Partial<GachaItem>) => {
    console.log('Update item:', id, updates)
    // TODO: 透過 socket 同步更新
  }, [])

  const handleDeleteItem = useCallback((id: string) => {
    console.log('Delete item:', id)
    // TODO: 透過 socket 同步刪除
  }, [])

  const handleClearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return (
    <div className="relative w-full h-screen bg-gasha-bg overflow-hidden select-none font-body">
      
      {/* 提示文字 - GACHAGO 風格 */}
      <div className="absolute top-8 sm:top-10 left-0 right-0 text-center pointer-events-none z-0">
        <h1 className="text-gasha-brown-light font-display text-lg sm:text-xl tracking-[0.15em] uppercase">
          {items.length > 0 ? "Click Ball to Open" : "Machine Empty"}
        </h1>
        <p className="text-gasha-brown-light/60 text-sm font-bold mt-1">
          剩餘: {items.length}
        </p>
      </div>

      {/* 主要物理場景 (2D Matter.js) */}
      <div className="absolute inset-0 z-10">
        <GachaScene 
          items={items}
          onBallClick={handleBallClick}
          triggerShake={shakeTrigger}
          triggerReset={resetTrigger}
        />
      </div>

      {/* 左下角: 重來按鈕 */}
      <AnimatePresence>
        <CornerControls position="bottom-left" className="pb-safe-or-5">
          <ControlButton 
            variant="reset"
            onClick={handleReset}
            icon={<RotateCcw size={20} />}
          >
            重來
          </ControlButton>
        </CornerControls>
      </AnimatePresence>

      {/* 右下角: 控制按鈕 */}
      <AnimatePresence>
        <CornerControls position="bottom-right" className="pb-safe-or-5">
          {/* 設定按鈕 */}
          <ControlButton 
            variant="settings"
            onClick={() => setShowSettings(true)}
            icon={<Settings size={20} />}
          >
            設定
          </ControlButton>

          {/* 搖動按鈕 */}
          <ControlButton 
            variant="shake"
            onClick={handleShake}
            icon={<Shuffle size={20} />}
          >
            搖動
          </ControlButton>
        </CornerControls>
      </AnimatePresence>

      {/* 結果顯示 */}
      <AnimatePresence>
        {showPrize && (
          <PrizeDisplay 
            winner={winner} 
            isLoading={phase === 'SELECTING'} 
            onClose={handleClosePrize} 
          />
        )}
      </AnimatePresence>

      {/* 設定面板 */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        items={items}
        history={history}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onClearHistory={handleClearHistory}
      />

      {/* 重來確認對話框 */}
      <AlertDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={confirmReset}
        title="確定要重來嗎？"
        description="所有球會重新掉落，但抽獎紀錄會保留。"
        confirmText="重來"
        cancelText="取消"
      />

      {/* Debug 資訊 (點擊左上角觸發) */}
      <div 
        className="absolute top-4 left-4 z-30 cursor-pointer"
        onClick={() => setShowDebug(prev => !prev)}
      >
        {showDebug ? (
          <div className="bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
            <div>Room: {roomId}</div>
            <div>Connected: {isConnected ? '✅' : '❌'}</div>
            <div>Items: {items.length}</div>
            <div>Phase: {phase}</div>
            <div>Winner: {winner?.label || 'none'}</div>
            <div>History: {history.length}</div>
          </div>
        ) : (
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-gasha-green' : 'bg-gasha-red'}`} />
        )}
      </div>
    </div>
  )
}
