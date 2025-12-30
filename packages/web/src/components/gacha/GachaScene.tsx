import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import type { GachaItem } from '@gasha/shared';

interface GachaSceneProps {
  items: GachaItem[];
  onBallClick: (item: GachaItem) => void;
  triggerShake: number;
  triggerReset: number;
}

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
  const itemsMapRef = useRef<Map<string, GachaItem>>(new Map());

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
      restitution: 0.5
    };
    
    const ground = Bodies.rectangle(width / 2, height + wallThickness / 2 - 20, width + wallThickness * 2, wallThickness, wallOptions);
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
      if (mouseConstraint.body) {
        startPoint = { ...event.mouse.position };
        clickedBody = mouseConstraint.body;
      }
    });

    Events.on(mouseConstraint, 'mouseup', (event) => {
      if (clickedBody && mouseConstraint.body === clickedBody) {
        const endPoint = event.mouse.position;
        const distance = Vector.magnitude(Vector.sub(endPoint, startPoint));
        
        if (distance < 10) {
          const id = (clickedBody as { customId?: string }).customId || '';
          const item = itemsMapRef.current.get(id);
          if (item) {
            onBallClick(item);
          }
        }
      }
      clickedBody = null;
    });

    Composite.add(engine.world, mouseConstraint);

    // GACHAGO Style Rendering
    Events.on(render, 'afterRender', () => {
      const context = render.context;
      const bodies = Composite.allBodies(engine.world);
      
      bodies.forEach((body) => {
        if (body.label === 'Ball') {
          const { x, y } = body.position;
          const radius = (body.circleRadius || 40); 
          const angle = body.angle;
          const color = (body.render as { customColor?: string }).customColor || '#e05a47';

          context.save();
          
          // 繪製橢圓陰影 (GACHAGO 風格)
          context.beginPath();
          context.fillStyle = 'rgba(200, 180, 160, 0.4)';
          context.ellipse(x, y + radius * 0.9, radius * 0.8, radius * 0.25, 0, 0, Math.PI * 2);
          context.fill();

          context.translate(x, y);
          
          // 球體主體 - 使用漸層模擬 3D 滾動效果
          // 根據角度計算分界線位置
          const splitAngle = angle % (Math.PI * 2);
          
          // 繪製完整圓形背景 (白色)
          context.beginPath();
          context.fillStyle = '#FFFFFF';
          context.arc(0, 0, radius, 0, Math.PI * 2);
          context.fill();
          
          // 繪製彩色部分 (下半，根據旋轉角度)
          context.save();
          context.rotate(splitAngle);
          
          // 下半彩色
          context.beginPath();
          context.fillStyle = color;
          context.arc(0, 0, radius - 2, 0, Math.PI, false);
          context.fill();
          
          context.restore();

          // 繪製邊框 (粗棕色)
          context.beginPath();
          context.strokeStyle = '#725349';
          context.lineWidth = Math.max(4, radius * 0.08);
          context.arc(0, 0, radius, 0, Math.PI * 2);
          context.stroke();
          
          // 繪製中線 (分隔上下半球)
          context.save();
          context.rotate(splitAngle);
          context.beginPath();
          context.strokeStyle = '#725349';
          context.lineWidth = Math.max(2, radius * 0.04);
          context.moveTo(-radius, 0);
          context.lineTo(radius, 0);
          context.stroke();
          context.restore();

          context.restore();
        }
      });
    });

    // 持續緩慢滾動效果
    Events.on(engine, 'afterUpdate', () => {
      ballsRef.current.forEach(body => {
        // 如果球幾乎靜止，施加微小的角速度
        const angularVelocity = body.angularVelocity;
        if (Math.abs(angularVelocity) < 0.01) {
          Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);
        }
        
        // 邊界檢查
        const pos = body.position;
        const margin = 100;
        if (pos.x < -margin || pos.x > width + margin || 
            pos.y < -height * 2 || pos.y > height + margin) {
          Matter.Body.setPosition(body, {
            x: width / 2 + (Math.random() - 0.5) * width * 0.5,
            y: -50
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
    
    addBallsFromItems(engine, items, sceneRef.current.clientWidth, sceneRef.current.clientHeight);
  }, [items]);

  const addBallsFromItems = useCallback((engine: Matter.Engine, currentItems: GachaItem[], width: number, height: number) => {
    const newBalls: Matter.Body[] = [];
    // 較大的球體
    const ballRadius = Math.min(width, height) * 0.1;

    currentItems.forEach((item, index) => {
      const x = Math.random() * (width - ballRadius * 4) + ballRadius * 2;
      const y = -ballRadius * 2 - (index * ballRadius * 0.8) - Math.random() * height * 0.2;
      
      const ball = Matter.Bodies.circle(x, y, ballRadius, {
        restitution: 0.5,
        friction: 0.05,
        frictionAir: 0.002,
        label: 'Ball',
        render: { visible: false }
      });
      
      (ball.render as { customColor?: string }).customColor = item.color;
      (ball as { customId?: string }).customId = item.id;
      
      // 初始角速度
      Matter.Body.setAngularVelocity(ball, (Math.random() - 0.5) * 0.1);
      
      newBalls.push(ball);
    });

    ballsRef.current = newBalls;
    Matter.Composite.add(engine.world, newBalls);
  }, []);

  // Shake
  useEffect(() => {
    if (triggerShake === 0 || !engineRef.current) return;
    
    ballsRef.current.forEach(body => {
      const forceMagnitude = 0.05 * body.mass;
      Matter.Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * forceMagnitude * 2,
        y: -forceMagnitude * 2
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.5);
    });
  }, [triggerShake]);

  // Reset
  useEffect(() => {
    if (triggerReset === 0 || !engineRef.current || !sceneRef.current) return;
    const engine = engineRef.current;
    
    Matter.Composite.remove(engine.world, ballsRef.current);
    ballsRef.current = [];
    addBallsFromItems(engine, items, sceneRef.current.clientWidth, sceneRef.current.clientHeight);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerReset]);

  return (
    <div ref={sceneRef} className="w-full h-full cursor-pointer relative" />
  );
};

export default GachaScene;
