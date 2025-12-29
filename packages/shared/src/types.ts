// 轉蛋單體定義
export interface GachaItem {
  id: string;          // UUID / NanoID
  label: string;       // 顯示名稱 (e.g., 觀眾ID)
  prize?: string;      // 獎品內容 (圖片URL或文字)
  color: string;       // 球體顏色 (Hex)
  avatarUrl?: string;  // (Optional) 觀眾頭像貼圖
}

// 系統狀態機
export type GamePhase =
  | 'IDLE'        // 靜止/物理待機
  | 'SHAKING'     // 攪拌中 (施加物理力)
  | 'SELECTING'   // 抽選運算中 (顯示鎖定特效)
  | 'REVEALING'   // 揭曉中 (運鏡 + 打開動畫)
  | 'RESULT';     // 顯示結果 UI

// 房間完整狀態
export interface RoomState {
  roomId: string;
  items: GachaItem[];
  phase: GamePhase;
  selectedId: string | null;   // 當前選中的球體 ID
  winnerId: string | null;     // 最終獲勝者 ID
  history: WinnerRecord[];     // 歷史紀錄
  createdAt: number;
  updatedAt: number;
}

// 獲勝者紀錄
export interface WinnerRecord {
  id: string;
  item: GachaItem;
  timestamp: number;
}

// WebSocket 事件類型 - 客戶端發送
export type ClientEvent =
  | { type: 'SYNC_ITEMS'; payload: GachaItem[] }
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'SHAKE_IMPULSE'; strength: number }
  | { type: 'PICK_WINNER'; winnerId: string; mode: 'RANDOM' | 'MANUAL' }
  | { type: 'RESET' }
  | { type: 'REQUEST_STATE' };

// WebSocket 事件類型 - 服務端廣播
export type ServerEvent =
  | { type: 'STATE_SYNC'; payload: RoomState }
  | { type: 'ITEMS_UPDATED'; payload: GachaItem[] }
  | { type: 'PHASE_CHANGED'; payload: GamePhase }
  | { type: 'SHAKE_TRIGGERED'; strength: number }
  | { type: 'WINNER_PICKED'; winnerId: string; mode: 'RANDOM' | 'MANUAL' }
  | { type: 'ROOM_RESET' }
  | { type: 'ERROR'; message: string };

// 通用 WebSocket 訊息
export type WSMessage = ClientEvent | ServerEvent;
