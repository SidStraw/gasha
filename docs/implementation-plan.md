# 實作計畫：Gacha Streamer Pool

> 基於 [spec.md](./spec.md) 的詳細執行計畫

## 確認規格 (Confirmed Specifications)

| 項目 | 決策 |
|------|------|
| Monorepo | pnpm workspaces |
| 物理容器 | 方箱形 (Box) |
| 球體上限 | 100 顆 (InstancedMesh) |
| 房間 ID | NanoID + 手動刷新按鈕 |
| 持久化 | Cloudflare D1 |
| 部署 | Cloudflare Workers |

---

## 專案結構 (Project Structure)

```
gasha/
├── pnpm-workspace.yaml
├── package.json
├── packages/
│   ├── web/                    # 前端應用
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── three/      # R3F 3D 組件
│   │   │   │   │   ├── PhysicsPool.tsx
│   │   │   │   │   ├── GachaBalls.tsx (InstancedMesh)
│   │   │   │   │   ├── Container.tsx
│   │   │   │   │   └── RevealAnimation.tsx
│   │   │   │   └── ui/         # 控制端 UI
│   │   │   ├── hooks/
│   │   │   │   ├── useGachaSocket.ts
│   │   │   │   └── usePhysicsControl.ts
│   │   │   ├── stores/         # Zustand 狀態管理
│   │   │   ├── pages/
│   │   │   │   ├── Overlay.tsx   # OBS 顯示端
│   │   │   │   └── Controller.tsx # 控制端
│   │   │   └── types/
│   │   └── vite.config.ts
│   │
│   ├── party/                  # PartyKit Server
│   │   ├── src/
│   │   │   ├── server.ts       # 主要 WebSocket 邏輯
│   │   │   └── db.ts           # D1 操作
│   │   └── partykit.json
│   │
│   └── shared/                 # 共用類型與常數
│       └── src/
│           ├── types.ts
│           └── constants.ts
```

---

## 實作階段 (Implementation Phases)

### Phase 1: 基礎設施與通訊 (Infrastructure)

**目標：** 建立專案骨架、WebSocket 通訊、D1 資料庫連接

#### Step 1.1: 專案初始化
- [ ] 建立 `pnpm-workspace.yaml` 定義 workspace
- [ ] 初始化三個 packages: `web`, `party`, `shared`
- [ ] 設定 TypeScript 共用配置 (`tsconfig.base.json`)
- [ ] 安裝核心依賴

#### Step 1.2: 共用類型定義 (`packages/shared`)
- [ ] 定義 `GachaItem`, `GamePhase`, `WSEvent` 介面
- [ ] 定義 `RoomState` 完整狀態結構
- [ ] 導出常數 (物理參數、動畫時間等)

#### Step 1.3: PartyKit Server (`packages/party`)
- [ ] 實作 `onConnect`: 新連線時發送完整狀態
- [ ] 實作 `onMessage`: 處理 `SYNC_ITEMS`, `SET_PHASE`, `SHAKE_IMPULSE`, `PICK_WINNER`, `RESET`
- [ ] 實作 `broadcast`: 狀態變更廣播
- [ ] 整合 D1: `saveRoom()`, `loadRoom()` 持久化房間狀態

#### Step 1.4: 前端 Socket Hook (`packages/web`)
- [ ] 建立 `useGachaSocket(roomId)` Hook
- [ ] 實作 Type-safe 的事件發送 `send<T extends WSEvent>(event: T)`
- [ ] 處理斷線重連邏輯
- [ ] 整合 Zustand store 同步狀態

#### ✅ 驗證 (TC-01, TC-05)
```
□ 開兩個瀏覽器視窗連接同一房間
□ A 視窗發送訊息，B 視窗 console 印出
□ 重新整理 B 視窗，自動恢復房間狀態
□ 重啟 PartyKit server，狀態從 D1 恢復
```

---

### Phase 2: 3D 物理場景 (The Physics Pool)

**目標：** 建立 100 顆球的物理世界，支援攪拌功能

#### Step 2.1: R3F 基礎場景
- [ ] 設定 `Canvas` with `gl={{ alpha: true }}` (OBS 透明背景)
- [ ] 加入 `ambientLight`, `directionalLight`
- [ ] 設定 `Physics` provider (gravity, timeStep)

#### Step 2.2: 方箱容器 (`Container.tsx`)
- [ ] 使用 `RigidBody type="fixed"` 建立靜態碰撞器
- [ ] 5 面 `CuboidCollider` (底部 + 四面牆，無頂)
- [ ] 透明材質視覺化邊界

#### Step 2.3: InstancedMesh 球體 (`GachaBalls.tsx`)
- [ ] 使用 `InstancedRigidBodies` 管理 100 個物理實體
- [ ] `useMemo` 穩定 instances 陣列，避免重建
- [ ] 根據 `GachaItem[]` 動態更新顏色 (透過 `instanceColor`)
- [ ] 使用 `useRef<RapierRigidBody[]>` 存取物理 API

#### Step 2.4: 攪拌功能 (`usePhysicsControl.ts`)
- [ ] 監聽 `SHAKE_IMPULSE` 事件
- [ ] 對每個 RigidBody 施加隨機方向的 `applyImpulse`
- [ ] 力道根據 `strength` 參數調整
- [ ] 加入輕微隨機延遲，避免同步感太強

#### Step 2.5: 球體生成動畫
- [ ] 新增球體時從頂部隨機位置掉落
- [ ] 移除球體時淡出 (scale → 0)

#### ✅ 驗證 (TC-02, TC-03)
```
□ 輸入 100 筆名單，OBS 端掉下 100 顆球
□ FPS 保持 30+ (使用 Stats.js 監測)
□ 無物理穿透現象
□ 按攪拌，球體隨機方向彈跳 (非同方向)
□ 多次攪拌，物理表現正常
```

---

### Phase 3: 抽選與運鏡 (The Reveal) ⚠️ 關鍵階段

**目標：** 實現平滑的物理→動畫切換，這是最容易出錯的部分

#### Step 3.1: 選取邏輯
- [ ] 控制端 `PICK_WINNER` 發送 `winnerId`
- [ ] OBS 端收到後更新 `gamePhase` 為 `SELECTING`
- [ ] 標記目標球體 `selectedId`

#### Step 3.2: 物理模式切換 ⚠️ 核心實作
```
關鍵流程：
1. 讀取當前物理位置 rb.translation()
2. 設定 Spring 起點為當前位置 api.set()
3. 切換 RigidBody 為 kinematicPosition rb.setBodyType(2, true)
4. 啟動 Spring 動畫 api.start({ position: target })
5. 在 onChange 中呼叫 setNextKinematicTranslation()
```

#### Step 3.3: 揭曉動畫 (`RevealAnimation.tsx`)
- [ ] 使用 `@react-spring/three` 的 `useSpring` API 模式
- [ ] 目標位置: 攝影機正前方 `[0, 0, 3]`
- [ ] 同時加入旋轉動畫 (展示球體)
- [ ] 其餘球體: 降低 opacity 或加入模糊效果

#### Step 3.4: 運鏡系統
- [ ] 使用 `@react-three/drei` 的 `CameraControls`
- [ ] `REVEALING` 階段: 攝影機 Zoom-in 到目標球
- [ ] `RESULT` 階段: 攝影機固定

#### Step 3.5: 開獎動畫
- [ ] 球體上半部旋轉開啟
- [ ] 顯示內部獎品 (文字或圖片)
- [ ] 粒子特效 (可選)

#### Step 3.6: 重置流程
- [ ] 收到 `RESET` 事件
- [ ] 選中球體切回 `dynamic` 模式
- [ ] 攝影機回到原位
- [ ] 清除選取狀態

#### ✅ 驗證 (TC-04) ⚠️ 關鍵測試
```
□ 按下抽獎，選中球體從當前位置平滑飛行 (無瞬移)
□ 動畫過程中球體可見旋轉
□ 其餘球體視覺變暗
□ 開獎動畫正常播放
□ 重置後球體正常回到物理模式
□ 連續抽獎多次，無異常
```

---

### Phase 4: 控制端 UI 與 UX 優化 (Polish)

**目標：** 完成控制端介面，優化整體體驗

#### Step 4.1: 控制端 UI (`Controller.tsx`)
- [ ] RWD 設計，優先手機直式
- [ ] 名單輸入區 (Textarea 批量貼上)
- [ ] 動作按鈕: 攪拌、抽獎、重置
- [ ] 房間 ID 顯示 + 刷新按鈕
- [ ] 當前狀態指示器

#### Step 4.2: 路由設定
- [ ] `/overlay/:roomId` → OBS 顯示端
- [ ] `/controller/:roomId` → 控制端
- [ ] `/` → 建立新房間 (產生 NanoID)

#### Step 4.3: OBS 優化
- [ ] 背景完全透明
- [ ] 無 UI 元素干擾
- [ ] 可選: 顯示當前名單數量

#### ✅ 最終驗證
```
□ 完整流程測試: 建立房間 → 輸入名單 → 攪拌 → 抽獎 → 重置
□ 手機控制端操作流暢
□ OBS Browser Source 正常顯示
□ 斷線重連正常
```

---

## 技術風險與緩解策略

| 風險 | 影響 | 緩解策略 |
|------|------|----------|
| InstancedMesh + 物理整合複雜 | 效能問題 | 先實作 50 顆測試，確認穩定後擴展 |
| 物理→動畫切換跳動 | 視覺不佳 (TC-04) | 嚴格遵循流程: 讀取位置 → 設定起點 → 切換模式 |
| D1 冷啟動延遲 | 首次載入慢 | 加入 loading 狀態，優先顯示本地快取 |
| PartyKit 連線不穩 | 同步問題 | 實作 reconnect + 狀態校驗機制 |

---

## 依賴清單 (Dependencies)

```json
{
  "web": {
    "@react-three/fiber": "^8.x",
    "@react-three/drei": "^9.x",
    "@react-three/rapier": "^1.x",
    "@react-spring/three": "^9.x",
    "framer-motion": "^11.x",
    "zustand": "^4.x",
    "partysocket": "^1.x",
    "nanoid": "^5.x",
    "tailwindcss": "^3.x",
    "react-router-dom": "^6.x"
  },
  "party": {
    "partykit": "^0.x"
  }
}
```
