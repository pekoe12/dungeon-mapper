import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useCanvasPanning, useCanvasResize } from '../../hooks/useCanvas';

const CanvasControls: React.FC = () => {
  const {
    zoom,
    setZoom,
    gridSize,
    canvasWidth,
    canvasHeight,
  } = useAppContext();
  
  const { centerView, resetView } = useCanvasPanning();
  const { resizeCanvas } = useCanvasResize();

  return (
    <>
      {/* Canvas Zoom Controls */}
      <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur p-2 rounded-lg shadow-lg border border-gray-700 z-10">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setZoom(Math.min(4, zoom * 1.2))}
            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            +
          </button>
          <span className="text-white text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.max(0.25, zoom * 0.8))}
            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            -
          </button>
          <button
            onClick={centerView}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Center
          </button>
          <button
            onClick={resetView}
            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Ctrl+Scroll: Zoom | Shift+Drag: Pan
        </div>
      </div>

      {/* Canvas Size Controls */}
      <div className="absolute bottom-4 right-4 bg-gray-800/90 backdrop-blur p-2 rounded-lg shadow-lg border border-gray-700 z-10">
        <div className="flex gap-2 items-center text-white text-sm">
          <label>Canvas:</label>
          <input
            type="number"
            value={canvasWidth}
            onChange={(e) => resizeCanvas(Number(e.target.value), canvasHeight)}
            className="w-20 px-2 py-1 bg-gray-700 rounded"
            step={gridSize}
          />
          <span>×</span>
          <input
            type="number"
            value={canvasHeight}
            onChange={(e) => resizeCanvas(canvasWidth, Number(e.target.value))}
            className="w-20 px-2 py-1 bg-gray-700 rounded"
            step={gridSize}
          />
        </div>
      </div>
    </>
  );
};

export default CanvasControls;
