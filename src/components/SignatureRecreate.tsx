import { useRef, useEffect, useState } from 'react';
import type { Point } from '../types/signature';

interface SignatureRecreateProps {
  signatureData: Point[];
  width?: number;
  height?: number;
  penColor?: string;
  baseLineWidth?: number;
  animationSpeed?: number; // milliseconds per point
}

const SignatureRecreate = ({ 
  signatureData, 
  width = 400, 
  height = 200,
  penColor = 'rgb(37, 99, 235)',
  baseLineWidth = 2,
}: SignatureRecreateProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(ratio, ratio);

    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  // Animate signature when new data arrives
  useEffect(() => {
    if (!signatureData?.length) return;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
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

  // Draw current points
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas and fill with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // If we have points to draw, draw them
    if (currentPoints.length > 0) {
      // Set drawing style
      ctx.strokeStyle = penColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw signature
      ctx.beginPath();
      let isFirstPoint = true;
      
      for (const point of currentPoints) {
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') continue;
        
        // Adjust line width based on pressure
        const lineWidth = baseLineWidth * (1 + (point.pressure || 0.5));
        ctx.lineWidth = lineWidth;
        
        if (isFirstPoint) {
          ctx.moveTo(point.x, point.y);
          isFirstPoint = false;
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      
      ctx.stroke();
    }
  }, [currentPoints, width, height, penColor, baseLineWidth]);

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium mb-2">Recreated Signature</h3>
      <canvas
        ref={canvasRef}
        className="w-full border-2 border-gray-300 rounded-lg bg-white"
        style={{ touchAction: 'none' }}
      />
      {isAnimating && signatureData.length > 0 && (
        <div className="mt-2 text-sm text-gray-400">
          Drawing signature... {Math.round((currentPoints.length / signatureData.length) * 100)}%
        </div>
      )}
    </div>
  );
};

export default SignatureRecreate;
