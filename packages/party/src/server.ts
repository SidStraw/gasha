import type * as Party from 'partykit/server';
import type {
  RoomState,
  ClientEvent,
  ServerEvent,
  GachaItem,
  GamePhase,
  WinnerRecord,
} from '@gasha/shared';

// 建立初始房間狀態
function createInitialState(roomId: string): RoomState {
  return {
    roomId,
    items: [],
    phase: 'IDLE',
    selectedId: null,
    winnerId: null,
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default class GashaServer implements Party.Server {
  readonly room: Party.Room;
  state: RoomState;

  constructor(room: Party.Room) {
    this.room = room;
    this.state = createInitialState(room.id);
  }

  // 從持久化儲存載入狀態
  async onStart() {
    const stored = await this.room.storage.get<RoomState>('state');
    if (stored) {
      this.state = stored;
      console.log(`[${this.room.id}] Restored state with ${this.state.items.length} items`);
    }
  }

  // 儲存狀態到持久化儲存
  async saveState() {
    this.state.updatedAt = Date.now();
    await this.room.storage.put('state', this.state);
  }

  // 廣播事件給所有連線
  broadcast(event: ServerEvent, exclude?: string[]) {
    const message = JSON.stringify(event);
    this.room.broadcast(message, exclude);
  }

  // 發送事件給單一連線
  send(conn: Party.Connection, event: ServerEvent) {
    conn.send(JSON.stringify(event));
  }

  // 新連線處理
  onConnect(conn: Party.Connection) {
    console.log(`[${this.room.id}] Client connected: ${conn.id}`);
    
    // 發送當前完整狀態給新連線
    this.send(conn, {
      type: 'STATE_SYNC',
      payload: this.state,
    });
  }

  // 斷線處理
  onClose(conn: Party.Connection) {
    console.log(`[${this.room.id}] Client disconnected: ${conn.id}`);
  }

  // 訊息處理
  async onMessage(message: string, sender: Party.Connection) {
    try {
      const event = JSON.parse(message) as ClientEvent;
      
      switch (event.type) {
        case 'REQUEST_STATE':
          this.send(sender, {
            type: 'STATE_SYNC',
            payload: this.state,
          });
          break;

        case 'SYNC_ITEMS':
          await this.handleSyncItems(event.payload);
          break;

        case 'SET_PHASE':
          await this.handleSetPhase(event.payload);
          break;

        case 'SHAKE_IMPULSE':
          this.handleShakeImpulse(event.strength);
          break;

        case 'PICK_WINNER':
          await this.handlePickWinner(event.winnerId, event.mode);
          break;

        case 'RESET':
          await this.handleReset();
          break;

        default:
          console.warn(`[${this.room.id}] Unknown event type:`, event);
      }
    } catch (error) {
      console.error(`[${this.room.id}] Error processing message:`, error);
      this.send(sender, {
        type: 'ERROR',
        message: 'Invalid message format',
      });
    }
  }

  // 處理同步物品清單
  private async handleSyncItems(items: GachaItem[]) {
    this.state.items = items;
    await this.saveState();
    
    this.broadcast({
      type: 'ITEMS_UPDATED',
      payload: items,
    });
    
    console.log(`[${this.room.id}] Items synced: ${items.length} items`);
  }

  // 處理階段變更
  private async handleSetPhase(phase: GamePhase) {
    this.state.phase = phase;
    await this.saveState();
    
    this.broadcast({
      type: 'PHASE_CHANGED',
      payload: phase,
    });
    
    console.log(`[${this.room.id}] Phase changed to: ${phase}`);
  }

  // 處理攪拌
  private handleShakeImpulse(strength: number) {
    // 攪拌不需要持久化，直接廣播
    this.broadcast({
      type: 'SHAKE_TRIGGERED',
      strength,
    });
    
    console.log(`[${this.room.id}] Shake triggered with strength: ${strength}`);
  }

  // 處理選取獲勝者
  private async handlePickWinner(winnerId: string, mode: 'RANDOM' | 'MANUAL') {
    const item = this.state.items.find(i => i.id === winnerId);
    if (!item) {
      console.error(`[${this.room.id}] Winner not found: ${winnerId}`);
      return;
    }

    this.state.selectedId = winnerId;
    this.state.winnerId = winnerId;
    this.state.phase = 'SELECTING';
    
    // 加入歷史紀錄
    const record: WinnerRecord = {
      id: `${Date.now()}-${winnerId}`,
      item,
      timestamp: Date.now(),
    };
    this.state.history.push(record);
    
    await this.saveState();
    
    this.broadcast({
      type: 'WINNER_PICKED',
      winnerId,
      mode,
    });
    
    console.log(`[${this.room.id}] Winner picked: ${item.label} (${mode})`);
  }

  // 處理重置
  private async handleReset() {
    this.state.phase = 'IDLE';
    this.state.selectedId = null;
    this.state.winnerId = null;
    await this.saveState();
    
    this.broadcast({
      type: 'ROOM_RESET',
    });
    
    console.log(`[${this.room.id}] Room reset`);
  }
}
