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

    // Walls (Invisible boundaries)
    const wallOptions = { 
      isStatic: true, 
      render: { visible: false },
      restitution: 0.8 
    };
    const ground = Bodies.rectangle(width / 2, height + 50, width, 100, wallOptions);
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height, wallOptions);
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height, wallOptions);
    const ceiling = Bodies.rectangle(width / 2, -500, width, 100, wallOptions); 

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

    currentItems.forEach((item) => {
      const x = Math.random() * (width - 100) + 50;
      const y = -Math.random() * 500 - 50; 
      
      const ball = Matter.Bodies.circle(x, y, ballRadius, {
        restitution: 0.9,
        friction: 0.005,
        frictionAir: 0.001,
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
      const forceMagnitude = 0.05 * body.mass;
      Matter.Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * forceMagnitude * 3,
        y: -forceMagnitude * 2 
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.5);
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
