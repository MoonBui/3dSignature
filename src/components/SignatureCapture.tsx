import { useState, useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad';
import type { Point, SignaturePadStroke } from '../types/signature';

interface SignatureCaptureProps {
  onSignatureComplete: (data: Point[]) => void;
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
  
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Set canvas size
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.getContext('2d')?.scale(ratio, ratio);
      
      // Initialize SignaturePad
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor,
        minWidth: 1,
        maxWidth: 3,
        throttle: 0,
        minDistance: 2,
        velocityFilterWeight: 0.7
      });

      // Add event listeners for isEmpty state
      signaturePadRef.current.addEventListener('beginStroke', () => {
        setIsEmpty(false);
      });
  
      return () => {
        if (signaturePadRef.current) {
          signaturePadRef.current.off();
        }
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
            
            flatData.push({
              x: point.x,
              y: point.y,
              timestamp: point.time,
              pressure: point.pressure || 0.5 // Use actual pressure or default to 0.5
            });
          });
        });
        
        if (flatData.length > 0) {
          setSignatureData(flatData);
          onSignatureComplete(flatData);
        }
      } catch (error) {
        console.error('Error processing signature:', error);
      }
    };
  
    // Auto-complete when recording stops
    useEffect(() => {
      if (!isRecording && signaturePadRef.current && !isEmpty) {
        handleComplete();
      }
    }, [isRecording]);
  
    return (
      <div className="w-full">
        <h3 className="text-lg font-medium mb-2">Draw Signature</h3>
        <canvas
          ref={canvasRef}
          className="w-full border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
          style={{ touchAction: 'none' }}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear
          </button>
          <button
            onClick={handleComplete}
            disabled={isEmpty}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Process Signature
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