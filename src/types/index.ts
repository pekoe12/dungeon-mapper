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

// SavedMap interface for map storage
export interface SavedMap {
  id: number;
  name: string;
  date: string;
  mapImage: string;
  fogRegions: Region[];
  revealedRegions: number[];
  dmNotes: string;
  showGrid: boolean;
}

// HistoryState interface for undo/redo functionality
export interface HistoryState {
  mapData: ImageData;
  fogRegions: Region[];
}
