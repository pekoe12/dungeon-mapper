// Tool types
export type Tool = 'brush' | 'eraser' | 'fogRegion';

// Point interface for coordinates
export interface Point {
  x: number;
  y: number;
}

// Pan offset interface
export interface PanOffset {
  x: number;
  y: number;
}

// Region is an array of points
export type Region = Point[];

// SavedMap moved to src/types/map.ts (single source of truth)

// HistoryState interface for undo/redo functionality
export interface HistoryState {
  mapData: ImageData;
  fogRegions: Region[];
}
