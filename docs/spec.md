# 專案規格書：Gacha Streamer Pool (Live 互動轉蛋池)

## 1. 專案概述 (Overview)

本專案為一款提供直播主 (Streamer) 使用的互動式抽獎工具。不同於傳統轉盤，本產品採用 **3D 物理引擎**模擬一個裝滿扭蛋/球體的透明箱子。
核心互動包含：

1. **OBS 顯示端 (Overlay)：** 顯示所有參與抽獎的球體在箱內受物理碰撞翻滾。
2. **控制端 (Controller)：** 直播主透過手機或網頁操作，觸發攪拌、隨機抽選、指定開啟。
3. **視覺熱點：** 當選中某顆球時，該球體需從物理運算平滑切換至腳本動畫，飛至鏡頭前特寫打開。

## 2. 技術棧與環境 (Tech Stack)

* **Repo Structure:** Monorepo (TurboRepo or simply separate folders for `web` and `server`)
* **Frontend Framework:** React 18+, Vite, TypeScript
* **Styling:** TailwindCSS
* **3D Engine:** React Three Fiber (R3F), `@react-three/drei`
* **Physics Engine:** `@react-three/rapier` (必須使用 Rapier 以獲得最佳效能)
* **Animation:** `framer-motion` (用於 UI) + `@react-spring/three` (用於 3D 運鏡與轉場)
* **Real-time & Backend:** **PartyKit** (基於 Cloudflare Durable Objects) 或 Cloudflare Workers + WebSocket。
* *決策原因：需支援 WebSocket 廣播與房間狀態暫存。*


* **Persistence (Optional for MVP):** Cloudflare D1 (用於儲存 User Config, Presets)。

## 3. 系統架構 (System Architecture)

系統分為三個核心部分，透過 WebSocket (PartyKit) 進行狀態同步。

### 3.1 資料流 (Data Flow)

```mermaid
graph TD
    A[Admin Controller<br/>(Mobile/Desktop)] -->|WS: Actions (Shake, Pick)| B(PartyKit Server<br/>Room State)
    B -->|WS: Broadcast State| C[OBS Overlay<br/>(Browser Source)]
    C -->|Visual Feedback| D{Stream View}
    
    subgraph "OBS Overlay Logic"
    C1[Physics World] <--> C2[Animation Mode]
    end

```

### 3.2 關鍵實體定義 (Interfaces)

```typescript
// 轉蛋單體定義
interface GachaItem {
  id: string;          // UUID
  label: string;       // 顯示名稱 (e.g., 觀眾ID)
  prize?: string;      // 獎品內容 (圖片URL或文字)
  color: string;       // 球體顏色 (Hex)
  avatarUrl?: string;  // (Optional) 觀眾頭像貼圖
}

// 系統狀態機
type GamePhase = 
  | 'IDLE'        // 靜止/物理待機
  | 'SHAKING'     // 攪拌中 (施加物理力)
  | 'SELECTING'   // 抽選運算中 (顯示鎖定特效)
  | 'REVEALING'   // 揭曉中 (運鏡 + 打開動畫)
  | 'RESULT';     // 顯示結果 UI

// WebSocket 廣播事件
type WSEvent = 
  | { type: 'SYNC_ITEMS', payload: GachaItem[] }
  | { type: 'SET_PHASE', payload: GamePhase }
  | { type: 'SHAKE_IMPULSE', strength: number }
  | { type: 'PICK_WINNER', winnerId: string, mode: 'RANDOM' | 'MANUAL' }
  | { type: 'RESET' };

```

## 4. 詳細功能規格 (Feature Specifications)

### 4.1 控制端 (Controller)

* **名單管理：** 支援 Textarea 批量貼上名單 (一行一個)，自動轉換為 `GachaItem`。
* **動作控制板：**
* **攪拌 (Shake):** 發送脈衝訊號，讓 OBS 裡的球跳動。
* **抽獎 (Draw):** 隨機從清單選出一個 ID，發送 `PICK_WINNER`。
* **重置 (Reset):** 清除結果，將球丟回池子。


* **UI 需求：** RWD 設計，優先優化手機直式操作體驗。

### 4.2 顯示端 (Overlay) - 3D 核心

* **物理容器 (The Pool):**
* 建立一個透明的 `fixed` 物理容器 (圓柱或方箱)。
* 底部需有 `CuboidCollider` 防止穿透。


* **球體生成 (The Balls):**
* 根據 `items` 陣列生成對應數量的 `RigidBody`。
* **效能優化：** 若球數 > 100，需使用 `InstancedMesh` 搭配 Rapier 的 `InstancedRigidBodies` (MVP 可先做一般 Mesh，上限 50 顆)。


* **狀態切換邏輯 (The Switch):**
* **Normal Mode:** 球體受 Rapier 物理控制。
* **Reveal Mode:** 1.  被選中的球體 `RigidBody` 設定為 `type="kinematicPosition"` 或直接移除物理屬性。
2.  紀錄當前世界座標 (World Position)。
3.  使用 `useFrame` 或動畫庫將其插值 (Lerp) 移動到攝影機正前方 (`[0, 0, 5]`)。


* **運鏡系統 (Camera Rig):**
* 使用 `CameraControls`。
* 當進入 `REVEALING` 狀態，攝影機需平滑 Zoom-in 到目標球體。



## 5. 實作計劃 (Implementation Plan) for AI Agent

請依序執行以下階段，每個階段需通過驗證後才進行下一步。

### Phase 1: 基礎設施與通訊 (Infrastructure)

1. 初始化 Vite + React + TypeScript 專案。
2. 安裝 PartyKit 並設定 `server.ts`，實作基礎的廣播邏輯 (`broadcast`)。
3. 建立 `useGachaSocket` Hook，處理前後端連線與 Type 安全的事件發送。
4. **驗證：** 開兩個瀏覽器視窗，A 按按鈕，B console 印出 Log。

### Phase 2: 3D 物理場景 (The Physics Pool)

1. 設定 R3F 場景，加入燈光、環境光。
2. 建立物理容器 (Container) 與球體 (Capsule) 組件。
3. 實作 `GachaItem` 到 3D 物件的 Mapping。
4. 實作「攪拌」功能：收到 Socket 事件後，對所有球體施加 `applyImpulse`。
5. **驗證：** 控制端新增 10 個名單，OBS 端掉下 10 顆球；按攪拌，球會亂跳。

### Phase 3: 抽選與運鏡 (The Reveal)

1. 實作 `SelectionLogic`：控制端選出 ID，廣播給 OBS。
2. **關鍵實作：** 修改球體組件，增加 `isRevealing` prop。
* 若 `true`：切換物理模式，啟動 React Spring 動畫將 `position/rotation` 移至中心。


3. 實作 `CapsuleOpening` 動畫：球體到達中心後，上半部 Mesh 旋轉開啟，顯示內部獎品。
4. **驗證：** 按下抽獎，畫面中其餘球體變暗/模糊，中獎球飛到面前打開。

### Phase 4: UI/UX 優化 (Polish)

1. 控制端 UI 美化 (Tailwind)。
2. 增加音效 (撞擊聲、打開聲)。
3. OBS 端背景透明設定 (`gl={{ alpha: true }}`)。

## 6. 驗證案例 (Validation Cases)

| ID | 測試場景 | 預期結果 |
| --- | --- | --- |
| TC-01 | 連線同步 | 手機端開啟網頁，OBS 端不需刷新即可自動連線並同步當前房間狀態。 |
| TC-02 | 大量物件 | 輸入 50 筆名單，FPS 保持在 30 以上，物理運算無穿透 (Tunneling) 現象。 |
| TC-03 | 攪拌同步 | 按下攪拌，所有球體受力方向隨機，不會全部往同一個方向飛。 |
| TC-04 | 揭曉切換 | **關鍵測試：** 選中球體時，該球體不應瞬間瞬移 (Snap)，必須從地板位置平滑飛行至鏡頭前。 |
| TC-05 | 斷線重連 | OBS 重新整理後，應保留原本的名單與設定，不需要重新輸入。 |

---

### 給 AI Agent 的提示 (Prompt Tip)

> "開始實作時，請優先建立 `Phase 1` 的通訊架構。對於 Phase 3 的物理切換動畫，請使用 `useSpring` 的 api 模式來接管 Rapier 的數值，這是最容易出錯的地方，請特別注意座標系的轉換。"
