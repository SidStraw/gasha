import { create } from 'zustand'
import type { RoomState, GachaItem, GamePhase } from '@gasha/shared'

interface GachaStore {
  // 房間狀態
  roomId: string | null
  items: GachaItem[]
  phase: GamePhase
  selectedId: string | null
  winnerId: string | null
  
  // 連線狀態
  isConnected: boolean
  
  // Actions
  setRoomId: (roomId: string) => void
  setItems: (items: GachaItem[]) => void
  setPhase: (phase: GamePhase) => void
  setSelectedId: (id: string | null) => void
  setWinnerId: (id: string | null) => void
  setConnected: (connected: boolean) => void
  
  // 同步完整狀態
  syncState: (state: RoomState) => void
  
  // 重置
  reset: () => void
}

const initialState = {
  roomId: null,
  items: [],
  phase: 'IDLE' as GamePhase,
  selectedId: null,
  winnerId: null,
  isConnected: false,
}

export const useGachaStore = create<GachaStore>((set) => ({
  ...initialState,
  
  setRoomId: (roomId) => set({ roomId }),
  setItems: (items) => set({ items }),
  setPhase: (phase) => set({ phase }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setWinnerId: (winnerId) => set({ winnerId }),
  setConnected: (isConnected) => set({ isConnected }),
  
  syncState: (state) => set({
    roomId: state.roomId,
    items: state.items,
    phase: state.phase,
    selectedId: state.selectedId,
    winnerId: state.winnerId,
  }),
  
  reset: () => set({
    phase: 'IDLE',
    selectedId: null,
    winnerId: null,
  }),
}))
