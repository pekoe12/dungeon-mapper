import { Region } from '../types';
import { SavedMap } from '../types/map';

// Local Storage key
const STORAGE_KEY = 'dndMaps';

// Load saved maps from local storage
export const loadSavedMaps = (): SavedMap[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as SavedMap[];
    }
  } catch (e) {
    console.error('Failed to load saved maps:', e);
  }
  return [];
};

// Save maps to local storage
export const saveMapsToStorage = (maps: SavedMap[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
  } catch (e) {
    console.error('Failed to save maps:', e);
  }
};

// Create a new saved map entry
export const createMapData = (
  mapCanvas: HTMLCanvasElement,
  fogRegions: Region[],
  revealedRegions: Set<number>,
  dmNotes: string,
  showGrid: boolean,
  mapName: string,
  width: number,
  height: number,
  cellSize: number | null
): SavedMap => {
  return {
    id: Date.now(),
    name: mapName || 'Untitled Map',
    date: new Date().toISOString(),
    mapImage: mapCanvas.toDataURL(),
    fogRegions: fogRegions,
    revealedRegions: Array.from(revealedRegions),
    dmNotes: dmNotes,
    showGrid: showGrid,
    width,
    height,
    cellSize
  };
};

// Save a map to storage
export const saveMap = (
  mapCanvas: HTMLCanvasElement,
  fogRegions: Region[],
  revealedRegions: Set<number>,
  dmNotes: string,
  showGrid: boolean,
  mapName: string,
  savedMaps: SavedMap[],
  width: number,
  height: number,
  cellSize: number | null
): SavedMap[] => {
  const mapData = createMapData(
    mapCanvas,
    fogRegions,
    revealedRegions,
    dmNotes,
    showGrid,
    mapName,
    width,
    height,
    cellSize
  );

  const newSavedMaps = [...savedMaps, mapData];
  saveMapsToStorage(newSavedMaps);
  return newSavedMaps;
};

// Delete a map from storage
export const deleteMap = (mapId: number, savedMaps: SavedMap[]): SavedMap[] => {
  const newSavedMaps = savedMaps.filter(m => m.id !== mapId);
  saveMapsToStorage(newSavedMaps);
  return newSavedMaps;
};
