// 物理世界常數
export const PHYSICS = {
  GRAVITY: [0, -9.81, 0] as const,
  TIME_STEP: 1 / 60,
  
  // 容器尺寸 (方箱)
  CONTAINER: {
    WIDTH: 8,
    HEIGHT: 10,
    DEPTH: 8,
    WALL_THICKNESS: 0.2,
  },
  
  // 球體設定
  BALL: {
    RADIUS: 0.4,
    MASS: 1,
    RESTITUTION: 0.5,   // 彈性
    FRICTION: 0.3,
  },
  
  // 攪拌力道
  SHAKE: {
    MIN_STRENGTH: 3,
    MAX_STRENGTH: 10,
    DEFAULT_STRENGTH: 5,
  },
} as const;

// 動畫常數
export const ANIMATION = {
  // 揭曉動畫
  REVEAL: {
    DURATION_MS: 1500,
    TARGET_POSITION: [0, 0, 3] as const,
    SPRING_CONFIG: {
      tension: 200,
      friction: 30,
    },
  },
  
  // 開獎動畫
  OPEN: {
    DURATION_MS: 800,
    ROTATION_ANGLE: Math.PI * 0.6,  // 108 度
  },
  
  // 攝影機運鏡
  CAMERA: {
    ZOOM_DURATION_MS: 1000,
    DEFAULT_POSITION: [0, 5, 15] as const,
    DEFAULT_LOOK_AT: [0, 0, 0] as const,
  },
} as const;

// 顏色預設
export const COLORS = {
  DEFAULT_BALL_COLORS: [
    '#FF6B6B', // 紅
    '#4ECDC4', // 青
    '#45B7D1', // 藍
    '#96CEB4', // 綠
    '#FFEAA7', // 黃
    '#DDA0DD', // 紫
    '#F39C12', // 橙
    '#E91E63', // 粉紅
  ],
  
  // 根據索引取得顏色
  getColor: (index: number) => {
    return COLORS.DEFAULT_BALL_COLORS[index % COLORS.DEFAULT_BALL_COLORS.length];
  },
} as const;

// 系統限制
export const LIMITS = {
  MAX_BALLS: 100,
  MIN_BALLS: 1,
  ROOM_ID_LENGTH: 8,
  MAX_LABEL_LENGTH: 50,
  MAX_PRIZE_LENGTH: 200,
} as const;

// WebSocket 設定
export const WS_CONFIG = {
  RECONNECT_INTERVAL_MS: 1000,
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL_MS: 30000,
} as const;
