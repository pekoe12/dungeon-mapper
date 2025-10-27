import { useAppContext } from '../context/AppContext';
import { deleteMap, saveMap, createMapData, saveMapsToStorage } from '../utils/storage';
import { scaleCanvas, drawGrid } from '../utils/canvas';
import { SavedMap } from '../types/map';

export const useMapStorage = () => {
  const {
    mapCanvasRef,
    fogRegions,
    revealedRegions,
    dmNotes,
    showGrid,
    mapName,
    savedMaps,
    setSavedMaps,
    setMapName,
    setFogRegions,
    setRevealedRegions,
    setDmNotes,
    setShowGrid,
    canvasWidth,
    canvasHeight,
    gridSize,
    backgroundCanvasRef,
    overlayCanvasRef,
    setCanvasWidth,
    setCanvasHeight,
    canvasCellSize,
    setCanvasCellSize,
    setHistory,
    setHistoryStep
  } = useAppContext();

  // Save the current map to storage
  const saveCurrentMap = () => {
    const mapCanvas = mapCanvasRef.current;
    if (!mapCanvas) return;

    const nameKey = (mapName || '').trim().toLowerCase();
    const existingIndex = savedMaps.findIndex(m => (m.name || '').trim().toLowerCase() === nameKey);

    if (existingIndex >= 0) {
      const shouldOverwrite = window.confirm(`A map named "${mapName}" already exists. Overwrite it?`);
      if (!shouldOverwrite) return false;
      const existing = savedMaps[existingIndex];
      const updated = createMapData(
        mapCanvas,
        fogRegions,
        revealedRegions,
        dmNotes,
        showGrid,
        mapName,
        canvasWidth,
        canvasHeight,
        canvasCellSize
      );
      // Preserve original id for stability
      (updated as any).id = existing.id;
      const next = savedMaps.slice();
      next[existingIndex] = updated;
      saveMapsToStorage(next);
      setSavedMaps(next);
    } else {
      const newSavedMaps = saveMap(
        mapCanvas,
        fogRegions,
        revealedRegions,
        dmNotes,
        showGrid,
        mapName,
        savedMaps,
        canvasWidth,
        canvasHeight,
        canvasCellSize
      );
      setSavedMaps(newSavedMaps);
    }
    return true;
  };

  // Delete a map from storage
  const deleteMapById = (mapId: number) => {
    const newSavedMaps = deleteMap(mapId, savedMaps);
    setSavedMaps(newSavedMaps);
  };

  // Load a saved map
  const loadMap = (mapData: SavedMap) => {
    const mapCanvas = mapCanvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!mapCanvas || !bgCanvas || !overlayCanvas) return;

    // Apply saved dimensions first (fallback to current if missing)
    const cssW = mapData.width ?? canvasWidth;
    const cssH = mapData.height ?? canvasHeight;
    setCanvasWidth(cssW);
    setCanvasHeight(cssH);
    setCanvasCellSize(mapData.cellSize ?? null);

    // DPR-safe scale all layers
    scaleCanvas(bgCanvas, cssW, cssH);
    scaleCanvas(mapCanvas, cssW, cssH);
    scaleCanvas(overlayCanvas, cssW, cssH);

    const bgCtx = bgCanvas.getContext('2d');
    if (bgCtx) {
      drawGrid(bgCtx, cssW, cssH, gridSize, showGrid);
    }

    // Clear and draw saved bitmap at origin
    const ctx = mapCanvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    ctx.restore();

    const img = new Image();
    img.onload = () => {
      // Draw using CSS units because the context is DPR-scaled
      ctx.drawImage(img, 0, 0, cssW, cssH);
      setFogRegions(mapData.fogRegions || []);
      setRevealedRegions(new Set(mapData.revealedRegions || []));
      setDmNotes(mapData.dmNotes || '');
      setShowGrid(mapData.showGrid !== undefined ? mapData.showGrid : true);
      setMapName(mapData.name);

      // Reset history to the loaded bitmap
      const snapshot = ctx.getImageData(0, 0, mapCanvas.width, mapCanvas.height);
      setHistory([{ mapData: snapshot, fogRegions: mapData.fogRegions || [] }]);
      setHistoryStep(0);
    };
    img.src = mapData.mapImage;

    return true;
  };

  // Clear the current map
  const clearMap = () => {
    const mapCanvas = mapCanvasRef.current;
    if (!mapCanvas) return;

    const ctx = mapCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    return true;
  };

  return {
    saveCurrentMap,
    deleteMapById,
    loadMap,
    clearMap
  };
};
