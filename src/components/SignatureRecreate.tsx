import { useRef, useEffect, useState } from 'react';
import type { Point } from '../types/signature';

interface SignatureRecreateProps {
  signatureData: Point[];
  penColor?: string;
  baseLineWidth?: number;
  originalWidth: number;
  originalHeight: number;
}

const getResponsiveBaseLineWidth = (defaultWidth: number) => {
  if (typeof window !== 'undefined' && window.innerWidth < 600) {
    return defaultWidth * 0.5; // Thinner on mobile
  }
  return defaultWidth;
};

const SignatureRecreate = ({ 
  signatureData, 
  penColor = 'rgb(37, 99, 235)',
  baseLineWidth = 2,
  originalWidth,
  originalHeight,
}: SignatureRecreateProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  // Responsive line width
  const responsiveBaseLineWidth = getResponsiveBaseLineWidth(baseLineWidth);

  // Draw signature using quadratic Bézier curves
  const drawSignature = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    canvasWidth: number,
    canvasHeight: number,
    background: 'white' | 'transparent' = 'white'
  ) => {
    if (points.length === 0) return;
    if (background === 'white') {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
    ctx.strokeStyle = penColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      if (!current || !next || typeof current.x !== 'number' || typeof current.y !== 'number' || typeof next.x !== 'number' || typeof next.y !== 'number') continue;
      const currentX = current.x;
      const currentY = current.y;
      const nextX = next.x;
      const nextY = next.y;
      const midX = (currentX + nextX) / 2;
      const midY = (currentY + nextY) / 2;
      const lineWidth = responsiveBaseLineWidth * (1 + (current.pressure || 0.5));
      ctx.lineWidth = lineWidth;
      if (i === 0) {
        ctx.moveTo(currentX, currentY);
      }
      ctx.quadraticCurveTo(currentX, currentY, midX, midY);
    }
    ctx.stroke();
  };

  const handleDownload = () => {
    if (!canvasRef.current || currentPoints.length === 0) return;
    // Create a temporary canvas
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCanvas.width = originalWidth;
    tempCanvas.height = originalHeight;
    drawSignature(tempCtx, currentPoints, originalWidth, originalHeight, 'transparent');
    const link = document.createElement('a');
    link.download = 'recreated-signature.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  // Draw when points change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawSignature(ctx, currentPoints, originalWidth, originalHeight);
    }
  }, [currentPoints, originalWidth, originalHeight]);

  // Animate signature when new data arrives
  useEffect(() => {
    if (!signatureData?.length) return;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
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
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [signatureData]);

  return (
    <div className="w-full min-w-[300px] sm:min-w-[400px] md:min-w-[600px] lg:min-w-[800px] xl:min-w-[1000px] 2xl:min-w-[1200px]">
      <h3 className="text-lg font-medium mb-2">Recreated Signature</h3>
      <div className="relative w-full">
        <canvas
          ref={canvasRef}
          width={originalWidth}
          height={originalHeight}
          className="w-full border-2 border-gray-300 rounded-lg bg-white touch-none"
          style={{ 
            width: '100%',
            height: 'auto',
            maxWidth: '100%',
            borderRadius: '0.5rem',
            border: '2px solid #d1d5db',
            background: 'white',
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
      {!isAnimating && currentPoints.length > 0 && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 active:bg-green-700 touch-manipulation"
          >
            Download PNG
          </button>
        </div>
      )}
    </div>
  );
};

export default SignatureRecreate;
