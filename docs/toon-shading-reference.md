# Toon Shading / Cel Shading 技術參考

本專案使用 Toon Shading (卡通渲染) 技術實現日系動畫風格的扭蛋球視覺效果。

## 目錄

- [技術原理](#技術原理)
- [本專案實作](#本專案實作)
- [參考資源](#參考資源)

---

## 技術原理

### 什麼是 Cel Shading / Toon Shading？

**Cel Shading**（又稱 Toon Shading）是一種非寫實渲染 (Non-Photorealistic Rendering, NPR) 技術，讓 3D 電腦圖形呈現出扁平、手繪的外觀，類似傳統卡通或漫畫風格。

「Cel」一詞源自傳統動畫使用的賽璐珞 (Celluloid) 透明片。

### 核心特徵

| 特徵 | 說明 |
|------|------|
| **扁平色塊** | 將漸層量化為有限的色階，產生分明的明暗區塊 |
| **粗邊描線** | 使用黑色或深色輪廓線強化 2D 漫畫感 |
| **簡化光影** | 陰影與高光呈現為獨立區域而非漸層 |

### 技術實現方式

1. **量化著色 (Quantized Shading)**
   - 計算 3D 模型的光照
   - 將最終顏色量化為少數色階（如：高光、中間調、陰影）
   
2. **描邊渲染 (Outline Rendering)**
   - **反向法線法**：將背面多邊形渲染為粗線
   - **邊緣檢測**：使用後處理濾鏡偵測邊緣
   - **頂點膨脹**：沿法線方向移動頂點繪製輪廓

3. **合成**：將著色模型與描邊合成

---

## 本專案實作

### 使用的技術棧

```
React Three Fiber (R3F) + Three.js MeshToonMaterial
```

### 實作細節

#### 1. Toon 材質 (MeshToonMaterial)

```typescript
// 建立 4 階柔和漸層貼圖
function createToonGradientMap(): THREE.DataTexture {
  const colors = new Uint8Array([80, 160, 220, 255])
  const gradientMap = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat)
  gradientMap.needsUpdate = true
  return gradientMap
}

// 使用 MeshToonMaterial
<meshToonMaterial
  color={ballColor}
  gradientMap={toonGradientMap}
/>
```

#### 2. 描邊效果 (Outline)

使用反向法線法 (Inverted Hull Method)：

```typescript
// 描邊層 - 放大模型並只渲染背面
<mesh scale={1 + OUTLINE_THICKNESS}>
  <sphereGeometry args={[radius, 32, 32]} />
  <meshBasicMaterial
    color={OUTLINE_COLOR}  // 深棕色 #4A3728
    side={THREE.BackSide}
  />
</mesh>
```

#### 3. 馬卡龍配色

```typescript
const MACARON_COLORS = [
  '#F8B4C4', // 淡粉
  '#A8D8EA', // 淡藍
  '#B8E0D2', // 淡綠
  '#D4A5D9', // 淡紫
  '#F6E3BA', // 淡黃
  '#F5C6A5', // 淡橘
  '#C5CAE9', // 淡靛
  '#E8D5B7', // 淡米
]
```

#### 4. 持續隨機運動

```typescript
// 每顆球的隨機運動配置
const motionConfig = useMemo(() => ({
  spinAxis: new THREE.Vector3(...).normalize(),  // 隨機自轉軸
  spinSpeed: 0.3 + Math.random() * 0.5,          // 自轉速度
  pushPhase: Math.random() * Math.PI * 2,        // 位移相位
  pushFrequency: 0.5 + Math.random() * 1.0,      // 位移頻率
  pushStrength: 0.02 + Math.random() * 0.03,     // 位移強度
}), [])

// 每幀施加力
useFrame((state) => {
  // 持續自轉
  rigidBody.applyTorqueImpulse({ x, y, z }, true)
  
  // 持續隨機位移
  const angle = time * pushFrequency + pushPhase
  rigidBody.applyImpulse({
    x: Math.cos(angle) * pushStrength,
    y: 0,
    z: Math.sin(angle) * pushStrength,
  }, true)
})
```

---

## 參考資源

### Wikipedia

- [Cel shading - Wikipedia](https://en.wikipedia.org/wiki/Cel_shading)
  - Cel Shading 技術的完整說明、歷史與應用
  
- [Non-photorealistic rendering - Wikipedia](https://en.wikipedia.org/wiki/Non-photorealistic_rendering)
  - 非寫實渲染的概覽，Cel Shading 屬於其中一種技術

### YouTube 教學

- [Stylized Cartoon Shader In THREE.JS (Full Explanation)](https://www.youtube.com/watch?v=V5UllFImvoE)
  - 完整解說如何在 Three.js 中使用 MeshToonMaterial 建立卡通風格
  
- [How to use MeshToonMaterial in ThreeJS](https://www.youtube.com/watch?v=DVoFaXgDVuw)
  - MeshToonMaterial 快速入門教學

### 技術文件與教程

- [MeshToonMaterial - SBCODE.net](https://sbcode.net/threejs/meshtoonmaterial/)
  - Three.js MeshToonMaterial 詳細教學與程式碼範例
  
- [Materials — Three.js Journey](https://threejs-journey.com/lessons/materials)
  - Three.js 材質系統教學，包含 Toon 材質說明

- [Three.js MeshToonMaterial Docs](https://threejs.org/docs/#api/en/materials/MeshToonMaterial)
  - Three.js 官方文件

### MToon Shader (VRM/Unity)

- [MToon | VRM.dev](https://vrm.dev/en/univrm/shaders/shader_mtoon/)
  - VRM 標準的 MToon 材質系統說明
  
- [GitHub - Santarh/MToon](https://github.com/Santarh/MToon)
  - MToon Shader 官方 GitHub 倉庫

### 延伸閱讀

- [Cel Shading: A Comprehensive Guide - GarageFarm](https://garagefarm.net/blog/cel-shading-a-comprehensive-guide)
- [Cel Shading - A Comprehensive Expert Guide | Adobe](https://www.adobe.com/uk/creativecloud/animation/discover/cel-shading.html)
- [Cel Shading Technique: Guide, Definition, and Tools | RebusFarm](https://rebusfarm.net/blog/how-to-do-cel-shading-techniques-tools)

---

## 知名應用案例

| 遊戲/作品 | 年份 | 說明 |
|-----------|------|------|
| Jet Set Radio | 2000 | 早期 Cel Shading 遊戲先驅 |
| The Legend of Zelda: The Wind Waker | 2003 | 經典卡通渲染風格 |
| Borderlands | 2009 | 漫畫風格 FPS |
| Ni no Kuni | 2011 | 吉卜力風格 RPG |
| Dragon Ball FighterZ | 2018 | 2.5D 動畫風格格鬥 |
| Spider-Man: Into the Spider-Verse | 2018 | 電影級風格化渲染 |

---

*最後更新：2024-12-31*
