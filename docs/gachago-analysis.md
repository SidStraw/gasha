# GACHAGO! Gashapon 頁面技術分析

> 分析日期: 2025-12-30  
> 分析網址: https://www.gachago.net/Gashapon

---

## 1. 技術棧總覽

| 類別 | 技術 |
|------|------|
| **框架** | Next.js (App Router) |
| **打包工具** | Turbopack |
| **3D 渲染** | Three.js r181 |
| **動畫庫** | Framer Motion |
| **樣式方案** | Tailwind CSS + CSS Modules + styled-jsx |
| **字體** | Geist, Geist Mono, Chiron GoRound TC, Bungee |
| **圖標** | Font Awesome 5 |
| **分析** | Google Analytics (G-LFS2JLNHFP) |

---

## 2. 頁面結構分析

### 2.1 HTML 結構

```html
<html lang="zh-TW">
  <body>
    <!-- 自訂游標 -->
    <div class="pointer-events-none fixed top-0 left-0 z-99999">
      <!-- cursor.svg 背景 -->
    </div>
    
    <main class="h-screen w-full overflow-hidden">
      <!-- 返回按鈕 (CornerControls) -->
      <div class="fixed z-10 top-5 left-5">
        <a href="/">返回</a>
      </div>
      
      <!-- 主容器 -->
      <div class="gashapon-module__container">
        <!-- 提示文字 -->
        <div>CLICK BALL TO OPEN</div>
        
        <!-- Three.js Canvas -->
        <canvas data-engine="three.js r181"></canvas>
        
        <!-- UI 控制區 -->
        <div class="gashapon-module__uiContainer">
          <!-- 控制按鈕 -->
          <button>重來</button>
          <button>設定</button>
          <button>搖動</button>
          <button>抽獎</button>
        </div>
        
        <!-- 結果顯示 Overlay -->
        <div class="gashapon-module__resultOverlay">
          <div class="gashapon-module__sphereWrapper">
            <div class="gashapon-module__sphereDisplay"></div>
          </div>
          <div class="gashapon-module__resultText"></div>
          <button>好耶</button>
        </div>
        
        <!-- 確認對話框 -->
        <div class="alert-dialog-overlay">...</div>
      </div>
      
      <!-- 設定面板 (Modal) -->
      <div class="fixed inset-0 z-100">
        <!-- 標籤: 列表、紀錄、編輯、分享 -->
      </div>
    </main>
    
    <!-- 載入動畫 -->
    <div class="spinner">載入中...</div>
  </body>
</html>
```

### 2.2 元件層級

```
App
├── CustomCursor (自訂游標)
├── LoadingOverlay (載入動畫)
└── GashaponPage
    ├── BackButton (返回按鈕)
    ├── GashaponContainer
    │   ├── HintText ("CLICK BALL TO OPEN")
    │   ├── ThreeJSCanvas (3D 扭蛋機)
    │   ├── UIContainer
    │   │   ├── ResetButton (重來)
    │   │   ├── SettingsButton (設定)
    │   │   ├── ShakeButton (搖動)
    │   │   └── DrawButton (抽獎)
    │   ├── ResultOverlay (結果顯示)
    │   │   ├── SphereDisplay (扭蛋球顯示)
    │   │   ├── ResultText (結果文字)
    │   │   └── ConfirmButton (好耶)
    │   └── ResetDialog (重來確認)
    └── SettingsModal
        ├── ListTab (列表)
        ├── HistoryTab (紀錄)
        ├── EditTab (編輯)
        └── ShareTab (分享)
```

---

## 3. CSS 模組分析

### 3.1 CSS Modules 類名

| 類名 | 用途 |
|------|------|
| `gashapon-module__container` | 主容器，全屏固定定位 |
| `gashapon-module__uiContainer` | UI 控制層，pointer-events: none |
| `gashapon-module__resultOverlay` | 結果顯示遮罩 |
| `gashapon-module__sphereWrapper` | 扭蛋球容器 |
| `gashapon-module__sphereDisplay` | 扭蛋球 CSS 樣式 |
| `gashapon-module__resultText` | 結果文字 |
| `gashapon-module__itemList` | 獎項列表 |

### 3.2 主要樣式定義

```css
/* 主容器 */
.gashapon-module__container {
  z-index: 1;
  user-select: none;
  background-color: #f6f3eb;
  width: 100vw;
  height: 100dvh;
  font-family: "Chiron GoRound TC", sans-serif;
  font-weight: 900;
  position: fixed;
  overflow: hidden;
}

/* 結果遮罩 */
.gashapon-module__resultOverlay {
  pointer-events: auto;
  z-index: 50;
  opacity: 0;
  visibility: hidden;
  background: #f6f3ebe6;
  transition: opacity .2s, visibility 0s linear .2s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* 扭蛋球 */
.gashapon-module__sphereDisplay {
  background: linear-gradient(0deg, var(--bg-color) 50%, #fff 50%);
  border: 7px solid #725349;
  border-radius: 50%;
  width: 150px;
  height: 150px;
  animation: sway 2s ease-in-out infinite;
}

/* 關鍵動畫 */
@keyframes sphereEnter {
  0% { opacity: 0; transform: translateY(-300px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes sway {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}
```

### 3.3 色彩系統

| 色彩 | 用途 |
|------|------|
| `#f6f3eb` | 背景色 (米白) |
| `#725349` | 主要棕色 (邊框、文字) |
| `#e05a47` | 強調紅色 (主按鈕) |
| `#f2c94c` | 黃色 (設定按鈕) |
| `#4d9bea` | 藍色 (搖動按鈕) |
| `#5fb376` | 綠色 (獎項標記) |
| `#eaa14d` | 橙色 (獎項標記) |
| `#6f534a` | 深棕色 (文字) |
| `#a3948c` | 淺棕色 (次要文字) |

---

## 4. JavaScript 邏輯分析

### 4.1 載入的 JS Chunks

| 檔案 | 大小 (壓縮) | 主要內容 |
|------|------------|---------|
| `turbopack-*.js` | 4.2KB | Turbopack 運行時 |
| `bed65dcf*.js` | 151KB | 主要頁面邏輯、UI 元件 |
| `d7dd320c*.js` | 25KB | Cannon.js 物理引擎 |
| `af946d88*.js` | 6KB | Next.js Link、路由 |
| `18a3139*.js` | 10KB | Tailwind Merge |

### 4.2 核心功能模組

#### 4.2.1 物理引擎 (Cannon.js)

從 `d7dd320ca8473079.js` 分析：

```javascript
// 3D 向量類
class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z;
  }
  // 向量運算: cross, dot, normalize, scale...
}

// 3x3 矩陣類
class Mat3 {
  // 矩陣運算: vmult, mmult, transpose, inverse...
}

// 四元數類
class Quaternion {
  // 旋轉計算: setFromAxisAngle, slerp...
}

// AABB 碰撞盒
class AABB {
  // 碰撞檢測: overlaps, contains...
}
```

#### 4.2.2 UI 元件

從 `bed65dcf85c7441a.js` 分析：

```javascript
// 角落控制按鈕
function CornerControls({ children, position }) {
  // position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  return (
    <motion.div
      className={`fixed z-10 flex pointer-events-auto ${positionClasses[position]}`}
      initial={{ x: direction, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

// 返回按鈕
function BackButton() {
  const [isHovered, setHovered] = useState(false);
  return (
    <CornerControls position="top-left">
      <Link href="/" title="返回" style={buttonStyle}>
        <i className="fas fa-angle-left" />
        返回
      </Link>
    </CornerControls>
  );
}
```

#### 4.2.3 styled-jsx 樣式系統

```javascript
// 動態樣式注入
class StyleSheetRegistry {
  add(styleId, rules) { /* 動態插入樣式規則 */ }
  remove(styleId) { /* 移除樣式規則 */ }
}

// 使用方式
<style jsx>{`
  .spinner {
    border: 5px solid #e05a47;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
`}</style>
```

### 4.3 React Server Components (RSC)

頁面使用 Next.js App Router 的 RSC 架構：

```javascript
// RSC Payload 格式
self.__next_f.push([1, `
  0:{"P":null,"b":"buildId","c":["","Gashapon"],"q":"","i":false,"f":[
    // 路由樹結構
    [["",{"children":["Gashapon",{"children":["__PAGE__",{}]}]}]]
  ]}
`]);

// 元件引用
// I[moduleId, [chunks], exportName]
I[13494, ["chunks/a553d743af654dfc.js"], "default"] // FadeTransition
I[55608, ["chunks/a553d743af654dfc.js"], ""]         // Script
I[90126, ["chunks/bd4395c2ffb82ec8.js"], "default"]  // OuterLayoutRouter
```

---

## 5. Three.js 3D 場景分析

### 5.1 場景設定

- **引擎版本**: Three.js r181
- **Canvas 尺寸**: 1200 x 736 (響應式)
- **渲染器**: WebGLRenderer
- **觸控支援**: `touch-action: none`

### 5.2 推測的場景結構

```
Scene
├── Camera (PerspectiveCamera)
├── Lights
│   ├── AmbientLight
│   └── DirectionalLight
├── GashaponMachine (Group)
│   ├── Body (機身)
│   ├── Globe (透明球體)
│   ├── Handle (把手)
│   └── Base (底座)
├── GachaBalls[] (扭蛋球陣列)
│   └── Sphere (彩色球體)
└── Physics (Cannon.js World)
```

### 5.3 互動邏輯

1. **點擊球體** → 觸發開啟動畫 → 顯示結果
2. **搖動按鈕** → 物理引擎施加力 → 球體隨機移動
3. **抽獎按鈕** → 隨機選取球體 → 播放出球動畫
4. **重來按鈕** → 重置物理世界 → 重新填充球體

---

## 6. 資料結構分析

### 6.1 獎項資料

```typescript
interface GachaItem {
  id: string;
  name: string;           // 獎項名稱
  color: string;          // 球體顏色 (hex)
  quantity: number;       // 初始數量
  remaining: number;      // 剩餘數量
}

// 範例資料
const defaultItems: GachaItem[] = [
  { name: "饅頭", color: "#eaa14d", quantity: 2, remaining: 2 },
  { name: "肉包", color: "#f2c94c", quantity: 2, remaining: 2 },
  { name: "菜包", color: "#e05a47", quantity: 1, remaining: 1 },
  { name: "豆漿", color: "#4d9bea", quantity: 1, remaining: 1 },
  { name: "蛋餅", color: "#5fb376", quantity: 3, remaining: 3 },
];
```

### 6.2 狀態管理

```typescript
interface GashaponState {
  items: GachaItem[];           // 所有獎項
  history: DrawResult[];        // 抽獎紀錄
  isDrawing: boolean;           // 是否正在抽獎
  showResult: boolean;          // 是否顯示結果
  currentResult: GachaItem | null;  // 當前結果
  isSettingsOpen: boolean;      // 設定面板狀態
  activeTab: 'list' | 'history' | 'edit' | 'share';
}
```

---

## 7. 動畫系統

### 7.1 Framer Motion 動畫

```javascript
// 角落按鈕進場動畫
const cornerAnimation = {
  initial: { x: -100, opacity: 0 },  // 從左側進入
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut", delay: 0.1 }
};

// 淡入淡出容器
const fadeTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.5 }
};
```

### 7.2 CSS 動畫

```css
/* 載入 Spinner */
@keyframes spin {
  0% { transform: rotate(0); }
  100% { transform: rotate(360deg); }
}

/* 扭蛋球掉落 */
@keyframes sphereEnter {
  0% { opacity: 0; transform: translateY(-300px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* 扭蛋球搖擺 */
@keyframes sway {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}
```

---

## 8. 關鍵實作要點

### 8.1 自訂游標

```javascript
// 追蹤滑鼠位置
document.addEventListener('mousemove', (e) => {
  cursorElement.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
});

// CSS 游標隱藏
body.custom-cursor-active {
  cursor: none;
}

// 游標圖片
.custom-cursor {
  background-image: url("/cursor.svg");
  background-size: contain;
  will-change: transform;
  pointer-events: none;
}
```

### 8.2 安全區域適配 (PWA)

```css
/* 底部安全區域 */
.pb-safe-or-5 {
  padding-bottom: max(env(safe-area-inset-bottom), 1.25rem);
}
```

### 8.3 響應式設計

```css
/* 桌面端提示位置 */
@media (min-width: 640px) {
  .hint-text {
    top: 30px;
    bottom: auto;
  }
}

/* 移動端提示位置 */
.hint-text {
  bottom: 110px;
}
```

---

## 9. 效能優化

1. **程式碼分割**: Turbopack 自動分割多個小 chunks
2. **字體預載**: `<link rel="preload" as="font">`
3. **CSS 優先載入**: `<link rel="stylesheet" precedence="next">`
4. **異步腳本**: `<script async>`

---

## 10. 總結

GACHAGO! 的 Gashapon 頁面是一個技術成熟的 Next.js 應用，結合了：

- **Three.js** 提供沉浸式 3D 扭蛋機體驗
- **Cannon.js** 物理引擎模擬真實的球體碰撞
- **Framer Motion** 流暢的 UI 動畫
- **Tailwind CSS** 快速響應式設計
- **CSS Modules** 避免樣式衝突

整體架構清晰，使用者體驗優秀，可作為類似應用的參考實作。
