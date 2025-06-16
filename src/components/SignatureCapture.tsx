import { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import type { Point, SignaturePadStroke } from '../types/signature';

interface SignatureCaptureProps {
  onSignatureComplete: (data: Point[], width: number, height: number) => void;
  isRecording: boolean;
  width?: number;
  height?: number;
  penColor?: string;
}

const SignatureCapture = ({ 
  onSignatureComplete, 
  isRecording,
  width = 400,
  height = 200,
  penColor = 'rgb(37, 99, 235)'
}: SignatureCaptureProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle canvas resizing
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Get the current signature image (if any)
    const oldImage = canvas.toDataURL();

    // Get container width while respecting max-width
    const containerWidth = container.clientWidth;
    const containerHeight = (containerWidth * height) / width;

    // Set canvas size with device pixel ratio for sharp rendering
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = containerWidth * ratio;
    canvas.height = containerHeight * ratio;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);

    // Reinitialize SignaturePad if it exists
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      signaturePadRef.current.off();
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor,
        minWidth: 0.5 * (containerWidth / width),
        maxWidth: 2.5 * (containerWidth / width),
        throttle: 16,
        minDistance: 1 * (containerWidth / width),
        velocityFilterWeight: 0.7,
      });
      signaturePadRef.current.addEventListener('beginStroke', () => {
        setIsEmpty(false);
      });
      // Restore the old image (if any)
      const img = new window.Image();
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, containerWidth, containerHeight);
      };
      img.src = oldImage;
    }
  };

  // Initialize canvas and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    signaturePadRef.current = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor,
      minWidth: 0.5,
      maxWidth: 2.5,
      throttle: 16,
      minDistance: 1,
      velocityFilterWeight: 0.7,
    });
    signaturePadRef.current.addEventListener('beginStroke', () => {
      setIsEmpty(false);
    });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
    };
  }, [width, height, penColor]);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleComplete = () => {
    if (!signaturePadRef.current || isEmpty) return;
    try {
      const data = signaturePadRef.current.toData();
      if (!Array.isArray(data)) return;
      const container = containerRef.current;
      if (!container) return;
      const cssWidth = container.clientWidth;
      const cssHeight = (cssWidth * height) / width;
      const flatData: Point[] = [];
      data.forEach((stroke: SignaturePadStroke) => {
        if (!stroke?.points?.length) return;
        stroke.points.forEach((point) => {
          if (typeof point.x !== 'number' || typeof point.y !== 'number' || typeof point.time !== 'number') return;
          flatData.push({
            x: point.x,
            y: point.y,
            timestamp: point.time,
            pressure: point.pressure || 0.5
          });
        });
      });
      if (flatData.length > 0) {
        onSignatureComplete(flatData, cssWidth, cssHeight);
      }
    } catch (error) {
      console.error('Error processing signature:', error);
    }
  };

  const handleDownload = () => {
    if (!signaturePadRef.current || isEmpty) return;
    const data = signaturePadRef.current.toData();
    const container = containerRef.current;
    if (!container) return;
    const cssWidth = container.clientWidth;
    const cssHeight = (cssWidth * height) / width;
    // Create a temporary canvas at CSS pixel size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cssWidth;
    tempCanvas.height = cssHeight;
    // Create a new SignaturePad instance with transparent background
    const tempPad = new SignaturePad(tempCanvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: penColor,
      minWidth: 0.5,
      maxWidth: 2.5,
      throttle: 16,
      minDistance: 1,
      velocityFilterWeight: 0.7,
    });
    tempPad.fromData(data);
    const link = document.createElement('a');
    link.download = 'signature.png';
    link.href = tempPad.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    if (!isRecording && signaturePadRef.current && !isEmpty) {
      handleComplete();
    }
  }, [isRecording]);

  return (
    <div className="w-full min-w-[300px] sm:min-w-[400px] md:min-w-[600px] lg:min-w-[800px] xl:min-w-[1000px] 2xl:min-w-[1200px]" ref={containerRef}>
      <h3 className="text-lg font-medium mb-2">Draw Signature</h3>
      <div className="relative w-full">
        <canvas
          ref={canvasRef}
          className="w-full border-2 border-gray-300 rounded-lg cursor-crosshair bg-white touch-none"
          style={{ 
            touchAction: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleClear}
          className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 active:bg-gray-700 touch-manipulation"
        >
          Clear
        </button>
        <button
          onClick={handleComplete}
          disabled={isEmpty}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed touch-manipulation"
        >
          Process Signature
        </button>
        <button
          onClick={handleDownload}
          disabled={isEmpty}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 active:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed touch-manipulation"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
};

export default SignatureCapture;