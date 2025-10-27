import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useHistory } from '../../hooks/useHistory';
import { useMapStorage } from '../../hooks/useMapStorage';
import { exportMapAsImage } from '../../utils/export';

const MapControls: React.FC = () => {
  const {
    mapName,
    setMapName,
    showGrid,
    setShowGrid,
    gridSize,
    setGridSize,
    backgroundCanvasRef,
    mapCanvasRef,
    overlayCanvasRef,
    isDMView,
    isCanvasSizeLocked,
    setIsCanvasSizeLocked,
    isGridSizeLocked,
    setIsGridSizeLocked
  } = useAppContext();
  
  const { undo, redo, canUndo, canRedo } = useHistory();
  const { saveCurrentMap, clearMap } = useMapStorage();

  const handleExport = () => {
    if (backgroundCanvasRef.current && mapCanvasRef.current) {
      exportMapAsImage(
        backgroundCanvasRef.current,
        mapCanvasRef.current,
        overlayCanvasRef.current,
        isDMView,
        true, // Always show fog regions in export
        mapName
      );
    }
  };

  return (
    <>
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <h3 className="font-bold mb-2 text-yellow-300">Map Controls:</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-600 rounded text-sm"
              placeholder="Map name..."
            />
            <button
              onClick={saveCurrentMap}
              className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
            >
              💾 Save
            </button>
          </div>
          <button
            onClick={handleExport}
            className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 w-full"
          >
            Export as PNG
          </button>
          <button
            onClick={clearMap}
            className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 w-full"
          >
            Clear Map
          </button>
          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="px-3 py-1 bg-blue-600 rounded disabled:bg-gray-600 flex-1"
            >
              ↶ Undo
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="px-3 py-1 bg-blue-600 rounded disabled:bg-gray-600 flex-1"
            >
              ↷ Redo
            </button>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="mr-2"
            />
            Show Grid
          </label>

          {/* Grid Size Control */}
          <div className="space-y-1">
            <label className="text-sm">Grid Size: {gridSize}px</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="10"
                max="100"
                step={5}
                value={gridSize}
                onChange={(e) => {
                  const value = Math.max(5, Math.round(Number(e.target.value) / 5) * 5);
                  if (!isGridSizeLocked) setGridSize(value);
                }}
                className="flex-1"
              />
              {/* Read-only numeric display (no arrows/edit) */}
              <span className="w-16 text-center">{gridSize}</span>
            </div>
          </div>

          {/* Grid size lock */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isGridSizeLocked}
              onChange={(e) => setIsGridSizeLocked(e.target.checked)}
              className="mr-2"
            />
            Lock Grid Size
          </label>

          {/* Canvas size lock toggle */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isCanvasSizeLocked}
              onChange={(e) => setIsCanvasSizeLocked(e.target.checked)}
              className="mr-2"
            />
            Lock Canvas Size
          </label>
        </div>
      </div>

    </>
  );
};

export default MapControls;
