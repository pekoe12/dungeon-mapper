import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useHistory } from '../../hooks/useHistory';
import { useMapStorage } from '../../hooks/useMapStorage';
import { useFogRegions } from '../../hooks/useFogRegions';
import { exportMapAsImage } from '../../utils/export';

const MapControls: React.FC = () => {
  const {
    mapName,
    setMapName,
    showGrid,
    setShowGrid,
    gridSize,
    setGridSize,
    showFogRegions,
    setShowFogRegions,
    backgroundCanvasRef,
    mapCanvasRef,
    overlayCanvasRef,
    isDMView,
    savedMaps
  } = useAppContext();
  
  const { undo, redo, canUndo, canRedo } = useHistory();
  const { saveCurrentMap, clearMap, loadMap, deleteMapById } = useMapStorage();
  const { clearFogRegions } = useFogRegions();

  const handleExport = () => {
    if (backgroundCanvasRef.current && mapCanvasRef.current) {
      exportMapAsImage(
        backgroundCanvasRef.current,
        mapCanvasRef.current,
        overlayCanvasRef.current,
        isDMView,
        showFogRegions,
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
            📥 Export as Image
          </button>
          <button
            onClick={clearMap}
            className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 w-full"
          >
            Clear Map
          </button>
          <button
            onClick={clearFogRegions}
            className="px-3 py-1 bg-orange-600 rounded hover:bg-orange-700 w-full"
          >
            Clear All Fog Regions
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
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min="10"
                max="100"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-16 px-2 py-1 bg-gray-600 rounded text-sm"
              />
            </div>
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showFogRegions}
              onChange={(e) => setShowFogRegions(e.target.checked)}
              className="mr-2"
            />
            Show Fog Regions
          </label>
        </div>
      </div>

      {/* Saved Maps */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <h3 className="font-bold mb-2 text-yellow-300">Saved Maps ({savedMaps.length}):</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {savedMaps.length === 0 ? (
            <p className="text-sm text-gray-400">No saved maps yet</p>
          ) : (
            savedMaps.map((map) => (
              <div key={map.id} className="bg-gray-600 p-2 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">{map.name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(map.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => loadMap(map)}
                    className="px-2 py-1 bg-green-600 rounded text-xs flex-1"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${map.name}"?`)) {
                        deleteMapById(map.id);
                      }
                    }}
                    className="px-2 py-1 bg-red-600 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default MapControls;
