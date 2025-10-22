import { useAppContext } from '../context/AppContext';
import { isPointInPolygon } from '../utils/canvas';
import { Point } from '../types';

export const useFogRegions = () => {
  const {
    fogRegions,
    setFogRegions,
    currentRegion,
    setCurrentRegion,
    setRevealedRegions,
    mapCanvasRef,
    history,
    setHistory,
    historyStep,
    setHistoryStep,
    canvasWidth,
    canvasHeight
  } = useAppContext();

  // Add a point to the current region
  const addPointToRegion = (point: Point) => {
    setCurrentRegion(prev => [...prev, point]);
  };

  // Complete the current fog region
  const completeFogRegion = () => {
    if (currentRegion.length > 2) {
      setFogRegions(prev => [...prev, currentRegion]);
      setCurrentRegion([]);
      saveToHistory();
    }
  };

  // Cancel the current fog region
  const cancelFogRegion = () => {
    setCurrentRegion([]);
  };

  // Delete a fog region
  const deleteFogRegion = (index: number) => {
    setFogRegions(prev => prev.filter((_, i) => i !== index));
    setRevealedRegions(prev => {
      const newSet = new Set<number>();
      prev.forEach(i => {
        if (i < index) newSet.add(i);
        else if (i > index) newSet.add(i - 1);
      });
      return newSet;
    });
    saveToHistory();
  };

  // Toggle a region's revealed state
  const toggleRegionReveal = (index: number) => {
    setRevealedRegions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Check if a point is in any fog region and reveal it
  const checkAndRevealRegion = (point: Point) => {
    fogRegions.forEach((region, index) => {
      if (isPointInPolygon(point, region)) {
        setRevealedRegions(prev => new Set([...prev, index]));
      }
    });
  };

  // Clear all fog regions
  const clearFogRegions = () => {
    setFogRegions([]);
    setCurrentRegion([]);
    setRevealedRegions(new Set());
    saveToHistory();
  };

  // Reset all revealed regions (hide fog again)
  const resetRevealedRegions = () => {
    setRevealedRegions(new Set());
  };

  // Save the current state to history
  const saveToHistory = () => {
    const mapCanvas = mapCanvasRef.current;
    if (!mapCanvas) return;

    const mapCtx = mapCanvas.getContext('2d');
    if (!mapCtx) return;

    const imageData = mapCtx.getImageData(0, 0, canvasWidth, canvasHeight);

    // Remove any history after current step
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push({
      mapData: imageData,
      fogRegions: [...fogRegions]
    });

    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  return {
    addPointToRegion,
    completeFogRegion,
    cancelFogRegion,
    deleteFogRegion,
    toggleRegionReveal,
    checkAndRevealRegion,
    clearFogRegions,
    resetRevealedRegions,
    saveToHistory
  };
};
