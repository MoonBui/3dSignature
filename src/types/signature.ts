export interface Point {
  x: number;
  y: number;
  timestamp: number;
  pressure: number;
}

export interface SignaturePadPoint {
  x: number;
  y: number;
  time: number;
  pressure: number;
}

export interface SignaturePadStroke {
  points: SignaturePadPoint[];
} 