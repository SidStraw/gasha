import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import type { GachaItem } from '@gasha/shared';

interface GachaSceneProps {
  items: GachaItem[];
  onBallClick: (item: GachaItem) => void;
  triggerShake: number;
  triggerReset: number;
}

// 3D 向量類型
interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// 四元數類型 (用於 3D 旋轉)
interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

// 球體擴展數據
interface BallData {
  id: string;
  color: string;
  rotation: Quaternion;      // 3D 旋轉四元數
  angularVelocity: Vec3;     // 3D 角速度
  height: number;            // 離地高度 (用於陰影計算)
  isExiting: boolean;        // 是否正在退場
  exitProgress: number;      // 退場動畫進度
}

// 四元數操作
const Quat = {
  identity: (): Quaternion => ({ w: 1, x: 0, y: 0, z: 0 }),
  
  fromAxisAngle: (axis: Vec3, angle: number): Quaternion => {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    return {
      w: Math.cos(halfAngle),
      x: axis.x * s,
      y: axis.y * s,
      z: axis.z * s,
    };
  },
  
  multiply: (a: Quaternion, b: Quaternion): Quaternion => ({
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  }),
  
  normalize: (q: Quaternion): Quaternion => {
    const len = Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
    return { w: q.w / len, x: q.x / len, y: q.y / len, z: q.z / len };
  },
  
  // 將四元數轉換為旋轉後的"上"向量 (用於確定彩色區域朝向)
  rotateVector: (q: Quaternion, v: Vec3): Vec3 => {
    const qv = { w: 0, x: v.x, y: v.y, z: v.z };
    const qConj = { w: q.w, x: -q.x, y: -q.y, z: -q.z };
    const result = Quat.multiply(Quat.multiply(q, qv), qConj);
    return { x: result.x, y: result.y, z: result.z };
  },
};

const GachaScene: React.FC<GachaSceneProps> = ({ 
  items,
  onBallClick, 
  triggerShake, 
  triggerReset
}) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const ballsRef = useRef<Matter.Body[]>([]);
  const ballDataRef = useRef<Map<string, BallData>>(new Map());
  const itemsMapRef = useRef<Map<string, GachaItem>>(new Map());
  const lastTimeRef = useRef<number>(Date.now());

  // 更新 items map
  useEffect(() => {
    itemsMapRef.current.clear();
    items.forEach(item => itemsMapRef.current.set(item.id, item));
  }, [items]);

  // Initialize Physics World
  useEffect(() => {
    if (!sceneRef.current) return;

    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint,
          Events = Matter.Events,
          Vector = Matter.Vector;

    const engine = Engine.create();
    engineRef.current = engine;

    const width = sceneRef.current.clientWidth;
    const height = sceneRef.current.clientHeight;
    
    // 地面高度 (球在這個 Y 值以下時，陰影最大)
    const groundY = height - 100;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        background: 'transparent',
        wireframes: false,
        pixelRatio: window.devicePixelRatio 
      }
    });
    renderRef.current = render;

    // Walls
    const wallThickness = 100;
    const wallOptions = { 
      isStatic: true, 
      render: { visible: false },
      restitution: 0.6
    };
    
    const ground = Bodies.rectangle(width / 2, groundY + wallThickness / 2, width + wallThickness * 2, wallThickness, wallOptions);
    const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 3, wallOptions);
    const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 3, wallOptions);
    const ceiling = Bodies.rectangle(width / 2, -height - wallThickness / 2, width + wallThickness * 2, wallThickness, wallOptions);

    Composite.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    // Mouse Interaction
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });

    // Detect Clicks
    let startPoint = { x: 0, y: 0 };
    let clickedBody: Matter.Body | null = null;

    Events.on(mouseConstraint, 'mousedown', (event) => {
      if (mouseConstraint.body && mouseConstraint.body.label === 'Ball') {
        startPoint = { ...event.mouse.position };
        clickedBody = mouseConstraint.body;
      }
    });

    Events.on(mouseConstraint, 'mouseup', (event) => {
      if (clickedBody && mouseConstraint.body === clickedBody) {
        const endPoint = event.mouse.position;
        const distance = Vector.magnitude(Vector.sub(endPoint, startPoint));
        
        if (distance < 15) {
          const id = (clickedBody as { customId?: string }).customId || '';
          const item = itemsMapRef.current.get(id);
          const ballData = ballDataRef.current.get(id);
          
          if (item && ballData && !ballData.isExiting) {
            // 開始退場動畫
            ballData.isExiting = true;
            ballData.exitProgress = 0;
            
            // 延遲觸發回調
            setTimeout(() => {
              onBallClick(item);
            }, 300);
          }
        }
      }
      clickedBody = null;
    });

    Composite.add(engine.world, mouseConstraint);

    // 渲染 - 偽 3D 扭蛋球
    Events.on(render, 'afterRender', () => {
      const context = render.context;
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      
      // 按 Y 座標排序 (遠的先畫)
      const sortedBalls = [...ballsRef.current].sort((a, b) => a.position.y - b.position.y);
      
      sortedBalls.forEach((body) => {
        if (body.label !== 'Ball') return;
        
        const id = (body as { customId?: string }).customId || '';
        const ballData = ballDataRef.current.get(id);
        if (!ballData) return;
        
        const { x, y } = body.position;
        const radius = (body.circleRadius || 50);
        const velocity = body.velocity;
        
        // 計算離地高度 (用於陰影)
        const distanceFromGround = Math.max(0, groundY - y - radius);
        ballData.height = distanceFromGround;
        
        // 根據 2D 速度更新 3D 角速度 (球在地面滾動)
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > 0.5) {
          // 滾動方向垂直於移動方向
          const rollAxis: Vec3 = { 
            x: -velocity.y / speed, 
            y: velocity.x / speed, 
            z: 0 
          };
          ballData.angularVelocity = {
            x: rollAxis.x * speed * 0.02,
            y: rollAxis.y * speed * 0.02,
            z: rollAxis.z * speed * 0.02,
          };
        } else {
          // 緩慢衰減
          ballData.angularVelocity.x *= 0.98;
          ballData.angularVelocity.y *= 0.98;
          ballData.angularVelocity.z *= 0.98;
          
          // 加一點隨機微小旋轉
          if (Math.random() < 0.02) {
            ballData.angularVelocity.x += (Math.random() - 0.5) * 0.01;
            ballData.angularVelocity.y += (Math.random() - 0.5) * 0.01;
          }
        }
        
        // 更新四元數旋轉
        const angSpeed = Math.sqrt(
          ballData.angularVelocity.x ** 2 + 
          ballData.angularVelocity.y ** 2 + 
          ballData.angularVelocity.z ** 2
        );
        
        if (angSpeed > 0.0001) {
          const axis: Vec3 = {
            x: ballData.angularVelocity.x / angSpeed,
            y: ballData.angularVelocity.y / angSpeed,
            z: ballData.angularVelocity.z / angSpeed,
          };
          const deltaRotation = Quat.fromAxisAngle(axis, angSpeed * deltaTime * 60);
          ballData.rotation = Quat.normalize(Quat.multiply(deltaRotation, ballData.rotation));
        }
        
        // 計算"上"向量在旋轉後的方向
        const upVector = Quat.rotateVector(ballData.rotation, { x: 0, y: 0, z: 1 });
        
        // 處理退場動畫
        let scale = 1;
        let alpha = 1;
        if (ballData.isExiting) {
          ballData.exitProgress += deltaTime * 3;
          scale = Math.max(0, 1 - ballData.exitProgress);
          alpha = Math.max(0, 1 - ballData.exitProgress);
          if (ballData.exitProgress >= 1) {
            return; // 不繪製已完全退場的球
          }
        }
        
        context.save();
        context.globalAlpha = alpha;
        
        // 繪製陰影 (在地面上)
        const shadowY = groundY;
        const shadowScale = Math.max(0.3, 1 - distanceFromGround / 300);
        const shadowAlpha = Math.max(0.1, 0.4 * shadowScale);
        
        context.beginPath();
        context.fillStyle = `rgba(200, 175, 150, ${shadowAlpha})`;
        context.ellipse(
          x, 
          shadowY, 
          radius * 0.9 * shadowScale * scale, 
          radius * 0.3 * shadowScale * scale, 
          0, 0, Math.PI * 2
        );
        context.fill();
        
        // 繪製球體
        const drawRadius = radius * scale;
        context.translate(x, y);
        
        // 計算彩色區域的角度 (根據 upVector 的 z 分量)
        // upVector.z > 0 表示彩色面朝上，< 0 表示白色面朝上
        // upVector.x, upVector.y 決定傾斜方向
        
        // 簡化：使用 upVector.z 來決定彩色/白色的比例
        // 使用 atan2(upVector.y, upVector.x) 來決定分界線角度
        const splitAngle = Math.atan2(upVector.y, upVector.x) + Math.PI / 2;
        const colorRatio = (upVector.z + 1) / 2; // 0 到 1，表示彩色面可見程度
        
        // 繪製白色底層
        context.beginPath();
        context.fillStyle = '#FFFFFF';
        context.arc(0, 0, drawRadius, 0, Math.PI * 2);
        context.fill();
        
        // 繪製彩色部分 (根據旋轉)
        if (colorRatio > 0.02) {
          context.save();
          context.rotate(splitAngle);
          
          // 彩色半球的可見範圍
          const visibleAngle = Math.PI * Math.min(1, colorRatio);
          
          context.beginPath();
          context.fillStyle = ballData.color;
          context.moveTo(0, 0);
          context.arc(0, 0, drawRadius - 2, -visibleAngle / 2, visibleAngle / 2);
          context.closePath();
          context.fill();
          
          context.restore();
        }
        
        // 繪製邊框
        context.beginPath();
        context.strokeStyle = '#725349';
        context.lineWidth = Math.max(3, drawRadius * 0.07);
        context.arc(0, 0, drawRadius, 0, Math.PI * 2);
        context.stroke();
        
        // 繪製分界線 (如果兩種顏色都可見)
        if (colorRatio > 0.05 && colorRatio < 0.95) {
          context.save();
          context.rotate(splitAngle);
          
          context.beginPath();
          context.strokeStyle = '#725349';
          context.lineWidth = Math.max(2, drawRadius * 0.04);
          
          // 繪製弧形分界線
          const arcRadius = drawRadius * 0.95;
          context.arc(0, 0, arcRadius, -0.1, 0.1);
          context.stroke();
          
          context.restore();
        }
        
        context.restore();
      });
    });

    // 邊界檢查
    Events.on(engine, 'afterUpdate', () => {
      ballsRef.current.forEach(body => {
        const pos = body.position;
        const margin = 150;
        if (pos.x < -margin || pos.x > width + margin || 
            pos.y < -height * 2 || pos.y > height + margin) {
          Matter.Body.setPosition(body, {
            x: width / 2 + (Math.random() - 0.5) * width * 0.5,
            y: -100
          });
          Matter.Body.setVelocity(body, { x: 0, y: 0 });
        }
      });
    });

    Render.run(render);
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    addBallsFromItems(engine, items, width, height);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Handle items change
  useEffect(() => {
    if (!engineRef.current || !sceneRef.current) return;
    const engine = engineRef.current;
    
    Matter.Composite.remove(engine.world, ballsRef.current);
    ballsRef.current = [];
    ballDataRef.current.clear();
    
    addBallsFromItems(engine, items, sceneRef.current.clientWidth, sceneRef.current.clientHeight);
  }, [items]);

  const addBallsFromItems = useCallback((engine: Matter.Engine, currentItems: GachaItem[], width: number, height: number) => {
    const newBalls: Matter.Body[] = [];
    const ballRadius = Math.min(width, height) * 0.09;

    currentItems.forEach((item, index) => {
      const x = width * 0.2 + Math.random() * width * 0.6;
      const y = -ballRadius * 2 - (index * ballRadius) - Math.random() * 100;
      
      const ball = Matter.Bodies.circle(x, y, ballRadius, {
        restitution: 0.6,
        friction: 0.1,
        frictionAir: 0.01,
        label: 'Ball',
        render: { visible: false }
      });
      
      (ball as { customId?: string }).customId = item.id;
      
      // 初始化 3D 旋轉數據
      const ballData: BallData = {
        id: item.id,
        color: item.color,
        rotation: Quat.fromAxisAngle(
          { x: Math.random(), y: Math.random(), z: Math.random() },
          Math.random() * Math.PI * 2
        ),
        angularVelocity: { x: 0, y: 0, z: 0 },
        height: 0,
        isExiting: false,
        exitProgress: 0,
      };
      ballDataRef.current.set(item.id, ballData);
      
      newBalls.push(ball);
    });

    ballsRef.current = newBalls;
    Matter.Composite.add(engine.world, newBalls);
  }, []);

  // Shake
  useEffect(() => {
    if (triggerShake === 0 || !engineRef.current) return;
    
    ballsRef.current.forEach(body => {
      const forceMagnitude = 0.08 * body.mass;
      Matter.Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * forceMagnitude * 2,
        y: -forceMagnitude * 2.5
      });
      
      // 增加 3D 角速度
      const id = (body as { customId?: string }).customId || '';
      const ballData = ballDataRef.current.get(id);
      if (ballData) {
        ballData.angularVelocity.x += (Math.random() - 0.5) * 0.3;
        ballData.angularVelocity.y += (Math.random() - 0.5) * 0.3;
        ballData.angularVelocity.z += (Math.random() - 0.5) * 0.1;
      }
    });
  }, [triggerShake]);

  // Reset
  useEffect(() => {
    if (triggerReset === 0 || !engineRef.current || !sceneRef.current) return;
    const engine = engineRef.current;
    
    Matter.Composite.remove(engine.world, ballsRef.current);
    ballsRef.current = [];
    ballDataRef.current.clear();
    addBallsFromItems(engine, items, sceneRef.current.clientWidth, sceneRef.current.clientHeight);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerReset]);

  return (
    <div ref={sceneRef} className="w-full h-full cursor-pointer relative" />
  );
};

export default GachaScene;
