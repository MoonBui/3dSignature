import { useRef, useEffect, useState } from 'react';
import type { Point } from '../types/signature';

interface SignatureRecreateProps {
  signatureData: Point[];
  width?: number;
  height?: number;
  penColor?: string;
  baseLineWidth?: number;
}

const SignatureRecreate = ({ 
  signatureData, 
  width = 400, 
  height = 200,
  penColor = 'rgb(37, 99, 235)',
  baseLineWidth = 2,
}: SignatureRecreateProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  // Draw signature using quadratic Bézier curves
  const drawSignature = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || currentPoints.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = container.clientWidth;
    const containerHeight = (containerWidth * height) / width;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw signature
    ctx.strokeStyle = penColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    for (let i = 0; i < currentPoints.length - 1; i++) {
      const current = currentPoints[i];
      const next = currentPoints[i + 1];
      
      if (!current || !next || 
          typeof current.x !== 'number' || typeof current.y !== 'number' ||
          typeof next.x !== 'number' || typeof next.y !== 'number') continue;

      // Scale points to container size
      const currentX = (current.x / width) * containerWidth;
      const currentY = (current.y / height) * containerHeight;
      const nextX = (next.x / width) * containerWidth;
      const nextY = (next.y / height) * containerHeight;

      // Calculate control point for the quadratic curve
      const midX = (currentX + nextX) / 2;
      const midY = (currentY + nextY) / 2;
      
      // Adjust line width based on pressure and container size
      const lineWidth = baseLineWidth * (containerWidth / width) * (1 + (current.pressure || 0.5));
      ctx.lineWidth = lineWidth;

      if (i === 0) {
        // Move to the first point
        ctx.moveTo(currentX, currentY);
      }
      
      // Draw quadratic curve to the midpoint
      ctx.quadraticCurveTo(currentX, currentY, midX, midY);
    }
    
    ctx.stroke();
  };

  // Handle canvas resizing
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Get container width while respecting max-width
    const containerWidth = container.clientWidth;
    const containerHeight = (containerWidth * height) / width;

    // Set canvas size with device pixel ratio for sharp rendering
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = containerWidth * ratio;
    canvas.height = containerHeight * ratio;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    canvas.getContext('2d')?.scale(ratio, ratio);

    // Redraw current points
    drawSignature();
  };

  // Initialize canvas and handle resize
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height]);

  // Draw when points change
  useEffect(() => {
    drawSignature();
  }, [currentPoints]);

  // Animate signature when new data arrives
  useEffect(() => {
    if (!signatureData?.length) return;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    setIsAnimating(true);
    setCurrentPoints([]);

    let currentIndex = 0;
    const animate = () => {
      if (currentIndex >= signatureData.length) {
        setIsAnimating(false);
        return;
      }

      setCurrentPoints(prev => [...prev, signatureData[currentIndex]]);
      currentIndex++;
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [signatureData]);

  return (
    <div className="w-full min-w-[300px] sm:min-w-[400px] md:min-w-[600px] lg:min-w-[800px] xl:min-w-[1000px] 2xl:min-w-[1200px]" ref={containerRef}>
      <h3 className="text-lg font-medium mb-2">Recreated Signature</h3>
      <div className="relative w-full">
        <canvas
          ref={canvasRef}
          className="w-full border-2 border-gray-300 rounded-lg bg-white touch-none"
          style={{ 
            touchAction: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        />
      </div>
      {isAnimating && signatureData.length > 0 && (
        <div className="mt-2 text-sm text-gray-400">
          Drawing signature... {Math.round((currentPoints.length / signatureData.length) * 100)}%
        </div>
      )}
    </div>
  );
};

export default SignatureRecreate;
