import { useAppContext } from '../context/AppContext';

export const useHistory = () => {
  const {
    history,
    historyStep,
    setHistoryStep,
    mapCanvasRef,
    setFogRegions,
  } = useAppContext();

  // Undo the last action
  const undo = () => {
    if (historyStep > 0) {
      const step = historyStep - 1;
      const state = history[step];

      const mapCanvas = mapCanvasRef.current;
      if (!mapCanvas) return;

      const ctx = mapCanvas.getContext('2d');
      if (!ctx) return;

      ctx.putImageData(state.mapData, 0, 0);
      setFogRegions(state.fogRegions);
      setHistoryStep(step);
    }
  };

  // Redo the last undone action
  const redo = () => {
    if (historyStep < history.length - 1) {
      const step = historyStep + 1;
      const state = history[step];

      const mapCanvas = mapCanvasRef.current;
      if (!mapCanvas) return;

      const ctx = mapCanvas.getContext('2d');
      if (!ctx) return;

      ctx.putImageData(state.mapData, 0, 0);
      setFogRegions(state.fogRegions);
      setHistoryStep(step);
    }
  };

  return {
    undo,
    redo,
    canUndo: historyStep > 0,
    canRedo: historyStep < history.length - 1
  };
};
