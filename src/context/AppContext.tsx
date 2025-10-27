import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { SavedMap } from '../types/map';
import { HistoryState, Point, Region, Tool } from '../types';

interface AppContextProps {
  // Map state
  isDMView: boolean;
  setIsDMView: React.Dispatch<React.SetStateAction<boolean>>;
  tool: Tool;
  setTool: React.Dispatch<React.SetStateAction<Tool>>;
  brushSize: number;
  setBrushSize: React.Dispatch<React.SetStateAction<number>>;
  brushColor: string;
  setBrushColor: React.Dispatch<React.SetStateAction<string>>;
  isDrawing: boolean;
  setIsDrawing: React.Dispatch<React.SetStateAction<boolean>>;
  lastPos: Point | null;
  setLastPos: React.Dispatch<React.SetStateAction<Point | null>>;
  
  // Fog regions
  fogRegions: Region[];
  setFogRegions: React.Dispatch<React.SetStateAction<Region[]>>;
  currentRegion: Region;
  setCurrentRegion: React.Dispatch<React.SetStateAction<Region>>;
  revealedRegions: Set<number>;
  setRevealedRegions: React.Dispatch<React.SetStateAction<Set<number>>>;
  showFogRegions: boolean;
  setShowFogRegions: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Grid settings
  showGrid: boolean;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  gridSize: number;
  setGridSize: React.Dispatch<React.SetStateAction<number>>;
  // Grid size lock
  isGridSizeLocked: boolean;
  setIsGridSizeLocked: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Canvas controls
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  panOffset: { x: number, y: number };
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
  isPanning: boolean;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  canvasWidth: number;
  setCanvasWidth: React.Dispatch<React.SetStateAction<number>>;
  canvasHeight: number;
  setCanvasHeight: React.Dispatch<React.SetStateAction<number>>;
  // Canvas sizing behavior
  canvasCellSize: number | null;
  setCanvasCellSize: React.Dispatch<React.SetStateAction<number | null>>;
  // User-controlled canvas size lock
  isCanvasSizeLocked: boolean;
  setIsCanvasSizeLocked: React.Dispatch<React.SetStateAction<boolean>>;
  
  // DM notes
  dmNotes: string;
  setDmNotes: React.Dispatch<React.SetStateAction<string>>;
  
  // History for undo/redo
  history: HistoryState[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryState[]>>;
  historyStep: number;
  setHistoryStep: React.Dispatch<React.SetStateAction<number>>;
  
  // Map management
  savedMaps: SavedMap[];
  setSavedMaps: React.Dispatch<React.SetStateAction<SavedMap[]>>;
  mapName: string;
  setMapName: React.Dispatch<React.SetStateAction<string>>;
  
  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarWidth: number;
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
  isResizing: boolean;
  setIsResizing: React.Dispatch<React.SetStateAction<boolean>>;
  // Map resize state
  isResizingMap: boolean;
  setIsResizingMap: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Canvas references
  backgroundCanvasRef: React.RefObject<HTMLCanvasElement>;
  mapCanvasRef: React.RefObject<HTMLCanvasElement>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  sidebarRef: React.RefObject<HTMLDivElement>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Constants
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Canvas refs
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // State variables
  const [isDMView, setIsDMView] = useState<boolean>(true);
  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [brushColor, setBrushColor] = useState<string>('#000000');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [lastPos, setLastPos] = useState<Point | null>(null);
  const [fogRegions, setFogRegions] = useState<Region[]>([]);
  const [currentRegion, setCurrentRegion] = useState<Region>([]);
  const [revealedRegions, setRevealedRegions] = useState<Set<number>>(new Set());
  const [showFogRegions, setShowFogRegions] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [dmNotes, setDmNotes] = useState<string>('');
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
  const [mapName, setMapName] = useState<string>('Untitled Map');
  const [gridSize, setGridSize] = useState<number>(25);
  const [isGridSizeLocked, setIsGridSizeLocked] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(384);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [canvasWidth, setCanvasWidth] = useState<number>(CANVAS_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState<number>(CANVAS_HEIGHT);
  const [canvasCellSize, setCanvasCellSize] = useState<number | null>(null);
  const [isCanvasSizeLocked, setIsCanvasSizeLocked] = useState<boolean>(false);
  const [isResizingMap, setIsResizingMap] = useState<boolean>(false);

  // Load saved maps on mount
  useEffect(() => {
    const saved = localStorage.getItem('dndMaps');
    if (saved) {
      try {
        setSavedMaps(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved maps:', e);
      }
    }
  }, []);

  const value = {
    isDMView, setIsDMView,
    tool, setTool,
    brushSize, setBrushSize,
    brushColor, setBrushColor,
    isDrawing, setIsDrawing,
    lastPos, setLastPos,
    fogRegions, setFogRegions,
    currentRegion, setCurrentRegion,
    revealedRegions, setRevealedRegions,
    showFogRegions, setShowFogRegions,
    showGrid, setShowGrid,
    dmNotes, setDmNotes,
    history, setHistory,
    historyStep, setHistoryStep,
    savedMaps, setSavedMaps,
    mapName, setMapName,
    gridSize, setGridSize,
    isGridSizeLocked, setIsGridSizeLocked,
    sidebarCollapsed, setSidebarCollapsed,
    sidebarWidth, setSidebarWidth,
    isResizing, setIsResizing,
    isResizingMap, setIsResizingMap,
    zoom, setZoom,
    panOffset, setPanOffset,
    isPanning, setIsPanning,
    canvasWidth, setCanvasWidth,
    canvasHeight, setCanvasHeight,
    canvasCellSize, setCanvasCellSize,
    isCanvasSizeLocked, setIsCanvasSizeLocked,
    backgroundCanvasRef,
    mapCanvasRef,
    overlayCanvasRef,
    containerRef,
    sidebarRef
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
