import { useEffect, useCallback, useRef } from 'react'
import usePartySocket from 'partysocket/react'
import type { ClientEvent, ServerEvent, GachaItem, GamePhase } from '@gasha/shared'
import { useGachaStore } from '@/stores/gachaStore'

// PartyKit 本機開發預設 host
const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'

export function useGachaSocket(roomId: string) {
  const {
    setConnected,
    setItems,
    setPhase,
    setSelectedId,
    setWinnerId,
    syncState,
    reset,
  } = useGachaStore()
  
  const reconnectAttempts = useRef(0)
  const maxReconnects = 5

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
    party: 'main',
    
    onOpen() {
      console.log('[Socket] Connected to room:', roomId)
      setConnected(true)
      reconnectAttempts.current = 0
    },
    
    onMessage(event) {
      try {
        const data = JSON.parse(event.data) as ServerEvent
        handleServerEvent(data)
      } catch (error) {
        console.error('[Socket] Failed to parse message:', error)
      }
    },
    
    onClose() {
      console.log('[Socket] Disconnected')
      setConnected(false)
    },
    
    onError(error) {
      console.error('[Socket] Error:', error)
      reconnectAttempts.current++
      
      if (reconnectAttempts.current >= maxReconnects) {
        console.error('[Socket] Max reconnect attempts reached')
      }
    },
  })

  // 處理服務端事件
  const handleServerEvent = useCallback((event: ServerEvent) => {
    console.log('[Socket] Received:', event.type)
    
    switch (event.type) {
      case 'STATE_SYNC':
        syncState(event.payload)
        break
        
      case 'ITEMS_UPDATED':
        setItems(event.payload)
        break
        
      case 'PHASE_CHANGED':
        setPhase(event.payload)
        break
        
      case 'SHAKE_TRIGGERED':
        // Shake 事件由 usePhysicsControl 處理
        window.dispatchEvent(new CustomEvent('gasha:shake', { 
          detail: { strength: event.strength } 
        }))
        break
        
      case 'WINNER_PICKED':
        setSelectedId(event.winnerId)
        setWinnerId(event.winnerId)
        setPhase('SELECTING')
        break
        
      case 'ROOM_RESET':
        reset()
        break
        
      case 'ERROR':
        console.error('[Socket] Server error:', event.message)
        break
    }
  }, [syncState, setItems, setPhase, setSelectedId, setWinnerId, reset])

  // 發送事件
  const send = useCallback((event: ClientEvent) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(event))
      console.log('[Socket] Sent:', event.type)
    } else {
      console.warn('[Socket] Cannot send, socket not open')
    }
  }, [socket])

  // 便捷方法
  const syncItems = useCallback((items: GachaItem[]) => {
    send({ type: 'SYNC_ITEMS', payload: items })
  }, [send])

  const setGamePhase = useCallback((phase: GamePhase) => {
    send({ type: 'SET_PHASE', payload: phase })
  }, [send])

  const triggerShake = useCallback((strength: number = 5) => {
    send({ type: 'SHAKE_IMPULSE', strength })
  }, [send])

  const pickWinner = useCallback((winnerId: string, mode: 'RANDOM' | 'MANUAL' = 'RANDOM') => {
    send({ type: 'PICK_WINNER', winnerId, mode })
  }, [send])

  const resetRoom = useCallback(() => {
    send({ type: 'RESET' })
  }, [send])

  const requestState = useCallback(() => {
    send({ type: 'REQUEST_STATE' })
  }, [send])

  // 連線後請求完整狀態
  useEffect(() => {
    if (socket.readyState === WebSocket.OPEN) {
      requestState()
    }
  }, [socket.readyState, requestState])

  return {
    socket,
    send,
    syncItems,
    setGamePhase,
    triggerShake,
    pickWinner,
    resetRoom,
    requestState,
  }
}
