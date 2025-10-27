import { HistoryState, Region, Tool } from './index';

export interface MapState {
  isDMView: boolean;
  tool: Tool;
  brushSize: number;
  brushColor: string;
  isDrawing: boolean;
  lastPos: { x: number, y: number } | null;
  fogRegions: Region[];
  currentRegion: Region;
  revealedRegions: Set<number>;
  showFogRegions: boolean;
  showGrid: boolean;
  dmNotes: string;
  history: HistoryState[];
  historyStep: number;
  savedMaps: SavedMap[];
  mapName: string;
  gridSize: number;
  zoom: number;
  panOffset: { x: number, y: number };
  isPanning: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export interface SavedMap {
  id: number;
  name: string;
  date: string;
  mapImage: string;
  fogRegions: Region[];
  revealedRegions: number[];
  dmNotes: string;
  showGrid: boolean;
  // extended fields for exact restoration
  width?: number;
  height?: number;
  cellSize?: number | null;
}

export interface SidebarState {
  collapsed: boolean;
  width: number;
  isResizing: boolean;
}
