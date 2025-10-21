import { Point, Tool } from './index';

export interface CanvasProps {
  width: number;
  height: number;
  tool: Tool;
  brushSize: number;
  brushColor: string;
  gridSize: number;
  showGrid: boolean;
  isDMView: boolean;
  zoom: number;
  panOffset: { x: number; y: number };
  onDrawStart?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onDrawMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onDrawEnd?: () => void;
}

export interface CanvasRef {
  clearCanvas: () => void;
  getContext: () => CanvasRenderingContext2D | null;
  getImageData: () => ImageData | null;
  putImageData: (data: ImageData) => void;
}

export interface CanvasDrawOptions {
  tool: Tool;
  color: string;
  size: number;
  x: number;
  y: number;
  lastPos: Point | null;
}

export interface CanvasState {
  backgroundCanvasRef: React.RefObject<HTMLCanvasElement>;
  mapCanvasRef: React.RefObject<HTMLCanvasElement>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
}
