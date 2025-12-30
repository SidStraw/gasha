import { useParams } from 'react-router-dom'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGachaSocket } from '@/hooks/useGachaSocket'
import { useGachaStore } from '@/stores/gachaStore'
import { PhysicsPool } from '@/components/three'
import { SettingsModal, AlertDialog } from '@/components/ui'
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
  const { triggerShake, resetRoom, setGamePhase, pickWinner, syncItems } = useGachaSocket(roomId)
  
  const { items, phase, isConnected, winnerId, setItems, setPhase, setWinnerId } = useGachaStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [showPrize, setShowPrize] = useState(false)
  const [history, setHistory] = useState<WinnerRecord[]>([])
  const [selectedBall, setSelectedBall] = useState<GachaItem | null>(null)

  const winner = useMemo(() => {
    if (selectedBall) return selectedBall
    if (winnerId) return items.find(item => item.id === winnerId) || null
    return null
  }, [items, winnerId, selectedBall])

  useEffect(() => {
    if (phase === 'SELECTING' || phase === 'REVEALING' || phase === 'RESULT') {
      setShowPrize(true)
    }
  }, [phase])

  const handleBallClick = useCallback((item: GachaItem) => {
    if (phase !== 'IDLE') return
    setSelectedBall(item)
    setPhase('SELECTING')
    setShowPrize(true)
    pickWinner(item.id, 'MANUAL')
  }, [phase, setPhase, pickWinner])

  const handleClosePrize = useCallback(() => {
    if (selectedBall) {
      setHistory(prev => [
        ...prev,
        { id: crypto.randomUUID(), item: selectedBall, timestamp: Date.now() }
      ])
      const newItems = items.filter(item => item.id !== selectedBall.id)
      setItems(newItems)
      syncItems(newItems)
    }
    setShowPrize(false)
    setSelectedBall(null)
    setWinnerId(null)
    setPhase('IDLE')
    setGamePhase('IDLE')
  }, [selectedBall, items, setItems, syncItems, setPhase, setWinnerId, setGamePhase])

  const handleShake = useCallback(() => {
    triggerShake(8)
  }, [triggerShake])

  const handleReset = useCallback(() => {
    setShowResetDialog(true)
  }, [])

  const confirmReset = useCallback(() => {
    resetRoom()
    setShowResetDialog(false)
    setSelectedBall(null)
    setShowPrize(false)
  }, [resetRoom])

  const handleRandomDraw = useCallback(() => {
    if (items.length === 0 || phase !== 'IDLE') return
    const randomIndex = Math.floor(Math.random() * items.length)
    const randomItem = items[randomIndex]
    handleBallClick(randomItem)
  }, [items, phase, handleBallClick])

  const handleUpdateItem = useCallback((id: string, updates: Partial<GachaItem>) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    )
    setItems(newItems)
    syncItems(newItems)
  }, [items, setItems, syncItems])

  const handleDeleteItem = useCallback((id: string) => {
    const newItems = items.filter(item => item.id !== id)
    setItems(newItems)
    syncItems(newItems)
  }, [items, setItems, syncItems])

  const handleClearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return (
    <div className="relative w-full h-screen bg-gasha-bg overflow-hidden select-none font-body">
      
      {/* 左上角：返回按鈕 */}
      <motion.div 
        className="absolute top-5 left-5 z-20"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-1 px-4 py-2 bg-gasha-bg border-2 border-gasha-brown rounded-full text-gasha-brown font-bold text-sm hover:bg-gasha-brown/5 transition-colors"
        >
          <ChevronLeft size={18} />
          <span>返回</span>
        </button>
      </motion.div>

      {/* 頂部提示文字 */}
      <motion.div 
        className="absolute top-8 left-0 right-0 text-center pointer-events-none z-10"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h1 className="text-gasha-brown-light font-display text-sm sm:text-base tracking-[0.25em] uppercase">
          {items.length > 0 ? "Click Ball to Open" : "Machine Empty"}
        </h1>
      </motion.div>

      {/* 3D 物理場景 (Three.js + Rapier) */}
      <div className="absolute inset-0 z-0">
        <PhysicsPool 
          items={items}
          selectedId={selectedBall?.id || winnerId}
          phase={phase}
          onBallClick={handleBallClick}
        />
      </div>

      {/* 左下角：重來按鈕 */}
      <motion.div 
        className="absolute bottom-5 left-5 z-20 pb-safe-or-5"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <GachaButton 
          onClick={handleReset}
          variant="secondary"
          label="重來"
        />
      </motion.div>

      {/* 右下角：控制按鈕 */}
      <motion.div 
        className="absolute bottom-5 right-5 z-20 pb-safe-or-5 flex gap-3"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <GachaButton 
          onClick={() => setShowSettings(true)}
          variant="settings"
          label="設定"
        />
        <GachaButton 
          onClick={handleShake}
          variant="shake"
          label="搖動"
          disabled={items.length === 0}
        />
        <GachaButton 
          onClick={handleRandomDraw}
          variant="primary"
          label="抽獎"
          disabled={items.length === 0 || phase !== 'IDLE'}
        />
      </motion.div>

      {/* 結果顯示 - GACHAGO 風格 */}
      <AnimatePresence>
        {showPrize && winner && (
          <GachaResultOverlay 
            winner={winner}
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

      {/* Debug */}
      <div 
        className="absolute top-4 right-4 z-30 cursor-pointer"
        onClick={() => setShowDebug(prev => !prev)}
      >
        {showDebug && (
          <div className="bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
            <div>Room: {roomId}</div>
            <div>Connected: {isConnected ? '✅' : '❌'}</div>
            <div>Items: {items.length}</div>
            <div>Phase: {phase}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// GACHAGO 風格按鈕
interface GachaButtonProps {
  onClick: () => void
  variant: 'primary' | 'secondary' | 'settings' | 'shake'
  label: string
  disabled?: boolean
}

const variantStyles = {
  primary: 'bg-gasha-red border-gasha-brown text-white',
  secondary: 'bg-white border-gasha-brown text-gasha-brown',
  settings: 'bg-gasha-yellow border-gasha-brown text-gasha-brown-dark',
  shake: 'bg-gasha-blue border-gasha-brown text-white',
}

function GachaButton({ onClick, variant, label, disabled }: GachaButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantStyles[variant]}
        w-14 h-14 sm:w-16 sm:h-16
        border-4 rounded-full
        flex items-center justify-center
        font-bold font-body text-xs sm:text-sm
        shadow-md
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
      whileHover={disabled ? {} : { scale: 1.08 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
    >
      {label}
    </motion.button>
  )
}

// GACHAGO 風格結果顯示 - bounceInDown 動畫
interface GachaResultOverlayProps {
  winner: GachaItem
  onClose: () => void
}

function GachaResultOverlay({ winner, onClose }: GachaResultOverlayProps) {
  // bounceInDown 動畫關鍵幀
  const bounceInDown = {
    initial: { 
      opacity: 0, 
      y: -500,
      scale: 0.8,
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
        mass: 1,
      }
    },
    exit: {
      opacity: 0,
      y: -100,
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 半透明背景 - 背景球體會變淡 */}
      <motion.div 
        className="absolute inset-0 bg-gasha-bg/85 backdrop-blur-[1px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* 中央內容 - bounceInDown */}
      <motion.div 
        className="relative flex flex-col items-center"
        variants={bounceInDown}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* 扭蛋球 */}
        <motion.div 
          className="relative w-28 h-28 sm:w-36 sm:h-36"
          animate={{ 
            rotate: [0, -3, 3, -3, 0],
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2.5, 
            ease: 'easeInOut',
            delay: 0.5,
          }}
        >
          {/* 陰影 */}
          <motion.div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full"
            style={{ 
              backgroundColor: 'rgba(200, 175, 150, 0.5)',
              width: '80%',
              height: '20%',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          />
          
          {/* 球體 SVG */}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            {/* 白色背景 */}
            <circle cx="50" cy="50" r="44" fill="#FFFFFF" />
            {/* 下半彩色 */}
            <path 
              d="M 6 50 A 44 44 0 0 0 94 50 L 94 50 A 44 44 0 0 1 6 50" 
              fill={winner.color}
            />
            {/* 外框 */}
            <circle 
              cx="50" cy="50" r="44" 
              fill="none" 
              stroke="#725349" 
              strokeWidth="5"
            />
            {/* 中線 */}
            <line 
              x1="6" y1="50" x2="94" y2="50" 
              stroke="#725349" 
              strokeWidth="3"
            />
          </svg>
        </motion.div>
        
        {/* 名稱 */}
        <motion.h2 
          className="mt-3 text-2xl sm:text-3xl font-bold text-gasha-brown-dark"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          {winner.label}
        </motion.h2>
        
        {/* 好耶按鈕 */}
        <motion.button
          onClick={onClose}
          className="mt-5 px-10 py-3 bg-gasha-red border-4 border-gasha-brown rounded-full text-white font-bold text-lg shadow-md"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          好耶
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
