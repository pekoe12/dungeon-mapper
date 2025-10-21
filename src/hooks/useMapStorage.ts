import { useAppContext } from '../context/AppContext';
import { deleteMap, saveMap } from '../utils/storage';
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
    setShowGrid
  } = useAppContext();

  // Save the current map to storage
  const saveCurrentMap = () => {
    const mapCanvas = mapCanvasRef.current;
    if (!mapCanvas) return;

    const newSavedMaps = saveMap(
      mapCanvas,
      fogRegions,
      revealedRegions,
      dmNotes,
      showGrid,
      mapName,
      savedMaps
    );

    setSavedMaps(newSavedMaps);
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
    if (!mapCanvas) return;

    // Clear current map
    const ctx = mapCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

    // Load map image
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      setFogRegions(mapData.fogRegions || []);
      setRevealedRegions(new Set(mapData.revealedRegions || []));
      setDmNotes(mapData.dmNotes || '');
      setShowGrid(mapData.showGrid !== undefined ? mapData.showGrid : true);
      setMapName(mapData.name);
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
