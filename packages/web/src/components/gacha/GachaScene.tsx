import { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import type { GachaItem } from '@gasha/shared';

interface GachaSceneProps {
  items: GachaItem[];
  onBallClick: (ballId: string, color: string, name: string) => void;
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

    // Walls (Invisible boundaries) - 完全封閉的容器
    const wallThickness = 100;
    const wallOptions = { 
      isStatic: true, 
      render: { visible: false },
      restitution: 0.6  // 降低彈性避免過度彈跳
    };
    
    // 地板 - 在畫面底部
    const ground = Bodies.rectangle(
      width / 2, 
      height + wallThickness / 2, 
      width + wallThickness * 2,  // 加寬確保角落密封
      wallThickness, 
      wallOptions
    );
    
    // 左牆 - 從天花板到地板的完整高度
    const leftWall = Bodies.rectangle(
      -wallThickness / 2, 
      height / 2, 
      wallThickness, 
      height * 3,  // 足夠高度覆蓋上方空間
      wallOptions
    );
    
    // 右牆 - 從天花板到地板的完整高度
    const rightWall = Bodies.rectangle(
      width + wallThickness / 2, 
      height / 2, 
      wallThickness, 
      height * 3,  // 足夠高度覆蓋上方空間
      wallOptions
    );
    
    // 天花板 - 在畫面上方適當位置，防止球飛出
    const ceiling = Bodies.rectangle(
      width / 2, 
      -height - wallThickness / 2,  // 上方 1 個螢幕高度處
      width + wallThickness * 2,  // 加寬確保角落密封
      wallThickness, 
      wallOptions
    ); 

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
        
        if (distance < 5) {
          const color = (clickedBody.render as { customColor?: string }).customColor || '#000000';
          const name = (clickedBody as { customName?: string }).customName || 'Unknown';
          const id = (clickedBody as { customId?: string }).customId || '';
          onBallClick(id, color, name);
        }
      }
      clickedBody = null;
    });

    Composite.add(engine.world, mouseConstraint);

    // Custom Rendering - Gashapon Ball Style
    Events.on(render, 'afterRender', () => {
      const context = render.context;
      const bodies = Composite.allBodies(engine.world);
      
      bodies.forEach((body) => {
        if (body.label === 'Ball') {
          const { x, y } = body.position;
          const radius = (body.circleRadius || 25); 
          const angle = body.angle;
          const color = (body.render as { customColor?: string }).customColor || '#FF6B6B';

          context.save();
          context.translate(x, y);
          context.rotate(angle);

          // Draw White Bottom Half
          context.beginPath();
          context.fillStyle = '#FFFFFF';
          context.arc(0, 0, radius, 0, Math.PI, false);
          context.fill();
          context.closePath();

          // Draw Colored Top Half
          context.beginPath();
          context.fillStyle = color;
          context.arc(0, 0, radius, Math.PI, 0, false);
          context.fill();
          context.closePath();

          // Draw Outline
          context.beginPath();
          context.strokeStyle = '#4A3B32'; 
          context.lineWidth = 4;
          context.arc(0, 0, radius, 0, 2 * Math.PI);
          context.stroke();
          
          // Draw Highlight
          context.beginPath();
          context.fillStyle = 'rgba(255, 255, 255, 0.4)';
          context.ellipse(-radius * 0.3, -radius * 0.3, radius * 0.3, radius * 0.15, -Math.PI / 4, 0, 2 * Math.PI);
          context.fill();

          context.restore();
        }
      });
    });

    // 邊界檢查 - 防止球飛出畫面外
    Events.on(engine, 'afterUpdate', () => {
      ballsRef.current.forEach(body => {
        const pos = body.position;
        const margin = 100;
        
        // 如果球超出邊界太遠，重置到畫面中央上方
        if (pos.x < -margin || pos.x > width + margin || 
            pos.y < -height * 2 || pos.y > height + margin) {
          Matter.Body.setPosition(body, {
            x: width / 2 + (Math.random() - 0.5) * width * 0.5,
            y: -50
          });
          Matter.Body.setVelocity(body, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(body, 0);
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

  const addBallsFromItems = (engine: Matter.Engine, currentItems: GachaItem[], width: number, height: number) => {
    const newBalls: Matter.Body[] = [];
    const ballRadius = Math.min(width, height) * 0.08; 

    currentItems.forEach((item, index) => {
      // 在天花板下方生成，錯開時間避免重疊
      const x = Math.random() * (width - ballRadius * 4) + ballRadius * 2;
      const y = -ballRadius * 2 - (index * ballRadius * 0.5) - Math.random() * height * 0.3; 
      
      const ball = Matter.Bodies.circle(x, y, ballRadius, {
        restitution: 0.7,  // 降低彈性
        friction: 0.1,
        frictionAir: 0.005,  // 增加空氣阻力
        label: 'Ball',
        render: {
          visible: false,
        }
      });
      (ball.render as { customColor?: string }).customColor = item.color;
      (ball as { customName?: string }).customName = item.label;
      (ball as { customId?: string }).customId = item.id;
      
      newBalls.push(ball);
    });

    ballsRef.current = newBalls;
    Matter.Composite.add(engine.world, newBalls);
  };

  // React to Shake Trigger
  useEffect(() => {
    if (triggerShake === 0 || !engineRef.current) return;
    
    ballsRef.current.forEach(body => {
      const forceMagnitude = 0.03 * body.mass;  // 降低力道
      Matter.Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * forceMagnitude * 2,
        y: -forceMagnitude * 1.5  // 降低向上力道
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);
    });
  }, [triggerShake]);

  // React to Reset
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
