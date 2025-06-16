import { useState, useRef, useEffect } from 'react';
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
    const [signatureData, setSignatureData] = useState<Point[]>([]);
    const [isEmpty, setIsEmpty] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
  
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
      }
    };

    // Initialize canvas and handle resize
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Initialize SignaturePad
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor,
        minWidth: 0.5,
        maxWidth: 2.5,
        throttle: 16,
        minDistance: 1,
        velocityFilterWeight: 0.7,
      });

      // Add event listeners
      signaturePadRef.current.addEventListener('beginStroke', () => {
        setIsEmpty(false);
      });

      // Initial resize
      resizeCanvas();

      // Handle resize
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
        setSignatureData([]);
        setIsEmpty(true);
      }
    };
  
    const handleComplete = () => {
      if (!signaturePadRef.current || isEmpty) return;

      try {
        const data = signaturePadRef.current.toData();
        if (!Array.isArray(data)) return;
        
        // Convert to flat array of points with timestamps for 3D animation
        const flatData: Point[] = [];
        data.forEach((stroke: SignaturePadStroke) => {
          if (!stroke?.points?.length) return;
          
          stroke.points.forEach((point) => {
            if (typeof point.x !== 'number' || typeof point.y !== 'number' || typeof point.time !== 'number') return;
            
            // Scale points back to original size
            const container = containerRef.current;
            if (!container) return;
            
            const scaleX = width / container.clientWidth;
            const scaleY = height / container.clientHeight;
            
            flatData.push({
              x: point.x * scaleX,
              y: point.y * scaleY,
              timestamp: point.time,
              pressure: point.pressure || 0.5
            });
          });
        });
        
        if (flatData.length > 0) {
          onSignatureComplete(flatData, width, height);
          setSignatureData(flatData);
        }
      } catch (error) {
        console.error('Error processing signature:', error);
      }
    };
  
    const handleDownload = () => {
      if (!signaturePadRef.current || isEmpty) return;

      // Store the current signature data
      const data = signaturePadRef.current.toData();
      
      // Create a temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasRef.current?.width || width;
      tempCanvas.height = canvasRef.current?.height || height;
      
      // Create a new SignaturePad instance with transparent background
      const tempPad = new SignaturePad(tempCanvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: penColor
      });
      
      // Restore the signature data to the temporary pad
      tempPad.fromData(data);
      
      // Convert to PNG and trigger download
      const link = document.createElement('a');
      link.download = 'signature.png';
      link.href = tempPad.toDataURL('image/png');
      link.click();
    };
  
    // Auto-complete when recording stops
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
        {signatureData.length > 0 && (
          <div className="mt-2 text-sm text-gray-400">
            Captured {signatureData.length} points
          </div>
        )}
      </div>
    );
  };

export default SignatureCapture;