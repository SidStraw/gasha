# Gasha 轉蛋機測試指南

## 概述

本文件說明如何測試 Gasha 轉蛋機的完整功能，包含 2D Matter.js 物理引擎、WebSocket 即時同步、以及 Gashapon 風格 UI。

## 前置準備

### 1. 安裝依賴

```bash
# 在專案根目錄
pnpm install
```

### 2. 啟動服務

需要同時啟動兩個服務：

#### Terminal 1: 啟動 PartyKit 後端服務
```bash
cd packages/party
pnpm dev
```

預期輸出：
```
🎈 PartyKit v0.0.111
[pk:inf] Ready on http://0.0.0.0:1999
```

#### Terminal 2: 啟動 Web 前端開發伺服器
```bash
cd packages/web
pnpm dev
```

預期輸出：
```
VITE v6.4.1  ready in 652 ms
➜  Local:   http://localhost:3000/
```

---

## 測試流程

### 階段 1: Controller 頁面基本功能

1. **開啟 Controller**
   - 瀏覽器訪問: `http://localhost:3000/`
   - 應自動重導向至 `/controller/{隨機房間ID}`
   - 確認頁面顯示：
     - ✅ 綠色「已連線」狀態指示器
     - 房間 ID (8 位英數字)
     - 「📋 複製 OBS Overlay URL」按鈕

2. **輸入參與名單**
   - 在「參與名單」文字框輸入（一行一個）：
     ```
     Alice
     Bob
     Charlie
     David
     Eve
     ```
   - 確認「已輸入: 5 人」顯示正確
   - 點擊「✅ 同步名單」按鈕
   - 確認「球數」更新為 `5`

3. **複製 Overlay URL**
   - 點擊「📋 複製 OBS Overlay URL」
   - 預期彈出「已複製 Overlay URL！」提示
   - 複製的 URL 格式應為: `http://localhost:3000/overlay/{房間ID}`

### 階段 2: Overlay 頁面物理場景

1. **開啟 Overlay**
   - 新開分頁貼上剛才複製的 Overlay URL
   - 或直接訪問: `http://localhost:3000/overlay/{房間ID}`

2. **確認 UI 元素**
   - ✅ 米白色背景 (`#FDFBF7`)
   - ✅ 頂部標題顯示「CLICK BALL TO OPEN」
   - ✅ 副標題顯示「Remaining: 5」
   - ✅ 左下角「Reset」按鈕（白色圓形）
   - ✅ 右下角「Settings」按鈕（黃色圓形、齒輪圖標）
   - ✅ 右下角「Shake」按鈕（藍色圓形）

3. **驗證 2D 物理球體**
   - 應看到 5 個 Gashapon 風格球體從上方落下
   - 球體特徵：
     - 上半部彩色（紅、青、藍、綠、黃等）
     - 下半部白色
     - 黑色描邊 (`#4A3B32`)
     - 左上角白色高光效果
   - 球體會因重力落到底部並堆疊

4. **測試物理互動**
   
   **A. Shake（攪拌）功能**
   - 點擊右下角「Shake」按鈕
   - 預期行為：
     - 所有球體獲得隨機向上和橫向的力
     - 球體會彈跳並重新排列
     - 產生旋轉效果

   **B. Reset（重置）功能**
   - 點擊左下角「Reset」按鈕
   - 預期行為：
     - 所有球體消失
     - 重新從頂部隨機位置掉落
     - 物理狀態完全重置

   **C. 滑鼠拖曳球體**
   - 用滑鼠點擊並拖曳任一球體
   - 預期行為：
     - 球體會跟隨滑鼠移動
     - 釋放後球體恢復物理行為
     - 其他球體會與被拖曳球體碰撞

### 階段 3: 隨機抽獎流程

1. **從 Controller 發起抽獎**
   - 切回 Controller 分頁
   - 確認「階段」顯示為 `IDLE`
   - 點擊「🎲 隨機抽獎！」按鈕
   - 預期行為：
     - 「階段」立即變為 `SELECTING`
     - 下方顯示「🎉 獲勝者」區塊
     - 顯示隨機抽中的名字（例如：Charlie）

2. **在 Overlay 查看抽獎動畫**
   - 切到 Overlay 分頁
   - 預期顯示中獎彈窗：
   
   **Loading 狀態（極短暫）**
   - 深色半透明遮罩 + 背景模糊
   - 米白色圓角卡片
   - 棕色旋轉 Loading 動畫
   - 「抽選中...」文字

   **結果顯示**
   - 🎉 「恭喜中獎！」黃色徽章
   - 圓形圖標：
     - 背景顏色 = 獲勝球體的顏色
     - 中央白色圓角框內顯示獎盃圖標
   - 獲勝者名字（大號粗體，例如：**Charlie**）
   - 底部「✨ Gasha 轉蛋機 ✨」標誌
   - 右上角紅色 X 關閉按鈕

3. **關閉彈窗**
   - 點擊右上角紅色 X 按鈕
   - 預期行為：
     - 彈窗消失
     - 回到物理場景
     - 球體數量不變（尚未實作移除機制）

### 階段 4: 攪拌力道調整

1. **在 Controller 調整力道**
   - 拖動「攪拌力道」滑桿（範圍 3-10）
   - 預期數值即時更新

2. **測試不同力道**
   - 設定力道 = 3（最小）
     - 點擊「🔀 攪拌！」
     - 預期：球體輕微晃動
   
   - 設定力道 = 10（最大）
     - 點擊「🔀 攪拌！」
     - 預期：球體大幅彈跳，可能飛出螢幕上方

3. **驗證 Overlay 同步**
   - 在 Controller 點擊「🔀 攪拌！」
   - 切到 Overlay 分頁
   - 預期：球體同步產生攪拌效果

### 階段 5: 重置房間

1. **從 Controller 重置**
   - 確認當前階段為 `SELECTING` 或其他非 `IDLE` 狀態
   - 點擊「↩️ 重置」按鈕
   - 預期行為：
     - 「階段」變回 `IDLE`
     - 「🎉 獲勝者」區塊消失
     - 「球數」保持不變

2. **驗證 Overlay 同步重置**
   - 切到 Overlay 分頁
   - 預期：
     - 若彈窗開啟則自動關閉
     - 球體重新從頂部掉落

### 階段 6: Debug 資訊檢查

1. **開啟 Debug 面板**
   - 在 Overlay 頁面點擊右下角「Settings」按鈕（黃色齒輪）
   - 預期：左上角顯示 Debug 資訊面板

2. **確認資訊正確**
   ```
   Room: {房間ID}
   Connected: ✅
   Items: 5
   Phase: IDLE
   Winner: none
   ```

3. **測試階段同步**
   - 從 Controller 進行抽獎
   - Debug 面板應即時更新：
     - `Phase: SELECTING`
     - `Winner: {獲勝者名字}`

---

## 多視窗同步測試

### 測試目的
驗證多個 Overlay 視窗是否能同步顯示相同狀態

### 步驟

1. **開啟多個 Overlay**
   - 複製 Overlay URL
   - 在 2-3 個不同瀏覽器分頁開啟相同 URL

2. **從 Controller 同步名單**
   - 所有 Overlay 應同時顯示相同數量的球體
   - 球體顏色和位置可能不同（物理隨機性）

3. **測試攪拌同步**
   - Controller 點擊「攪拌」
   - 所有 Overlay 的球體應同時產生物理效果

4. **測試抽獎同步**
   - Controller 點擊「隨機抽獎」
   - 所有 Overlay 應同時顯示相同獲勝者的彈窗

---

## 異常情況測試

### 1. 斷線重連
- **步驟：**
  - 停止 PartyKit 服務 (Ctrl+C)
  - 觀察 Controller 連線狀態變為紅色「連線中...」
  - 重新啟動 PartyKit 服務
- **預期：**
  - 自動重連成功
  - 狀態恢復為綠色「已連線」
  - 球體數量保持一致

### 2. 空名單處理
- **步驟：**
  - Controller 清空文字框
  - 點擊「同步名單」
- **預期：**
  - 球數變為 0
  - Overlay 標題顯示「MACHINE EMPTY」
  - 「攪拌」和「抽獎」按鈕變為灰色 disabled 狀態

### 3. 大量球體 (壓力測試)
- **步驟：**
  - 輸入 50-100 個名字
  - 同步名單
- **預期：**
  - 球體正常顯示（可能較小）
  - 物理效能維持 60 FPS
  - 攪拌功能正常運作

---

## 瀏覽器相容性測試

建議測試以下瀏覽器：
- ✅ Chrome 120+ (主要開發環境)
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

### 檢查項目
- WebSocket 連線穩定性
- Matter.js Canvas 渲染效能
- Tailwind CSS 樣式顯示
- Lucide React 圖標顯示

---

## 效能監控

### 開發者工具檢查

1. **Network 面板**
   - WebSocket 連線狀態為 `101 Switching Protocols`
   - 訊息往返延遲 < 100ms

2. **Performance 面板**
   - FPS 穩定在 60
   - Matter.js 引擎 CPU 使用率 < 30%

3. **Console**
   - 無錯誤訊息
   - Socket 訊息日誌正常：
     ```
     [Socket] Connected to room: CFUtwX5M
     [Socket] Received: STATE_SYNC
     [Socket] Sent: SHAKE_IMPULSE
     ```

---

## 已知限制

1. **球體不會被移除**
   - 目前抽獎後球體仍保留在場景中
   - 未來可新增移除動畫

2. **無獎品內容**
   - `GachaItem.prize` 欄位目前未使用
   - 可整合 Gemini API 生成創意獎品描述

3. **無球體點擊抽獎**
   - `handleBallClick` 目前僅 console.log
   - 未來可實作手動點擊球體進行抽獎

---

## TypeScript 驗證

執行以下指令確保無類型錯誤：

```bash
cd packages/web
pnpm run typecheck
```

預期輸出：無錯誤訊息

---

## 問題排查

### Q: Overlay 頁面空白
**A:** 檢查 PartyKit 服務是否啟動，瀏覽器 Console 是否有錯誤

### Q: 球體不顯示
**A:** 確認已從 Controller 同步名單，檢查「球數」是否 > 0

### Q: WebSocket 斷線
**A:** 確認 `VITE_PARTYKIT_HOST` 環境變數設定為 `localhost:1999`

### Q: 攪拌無效果
**A:** 檢查球體是否在畫面外，使用 Reset 按鈕重置場景

---

## 結語

完成以上測試流程後，應確認：
- ✅ 2D Matter.js 物理引擎運作正常
- ✅ WebSocket 即時同步穩定
- ✅ Gashapon 風格 UI 完整呈現
- ✅ Controller / Overlay 雙向控制流暢
- ✅ 中獎彈窗動畫流暢

有問題請檢查 Console 日誌或聯繫開發團隊。
