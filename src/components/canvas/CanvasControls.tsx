import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useCanvasPanning, useCanvasResize } from '../../hooks/useCanvas';

const CanvasControls: React.FC = () => {
  const {
    zoom,
    gridSize,
    canvasWidth,
    canvasHeight,
  } = useAppContext();
  
  const { centerView, zoomByFactor } = useCanvasPanning();
  const { resizeCanvas } = useCanvasResize();

  return (
    <>
      {/* Canvas Zoom Controls */}
      <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur p-2 rounded-lg shadow-lg border border-gray-700 z-10">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => zoomByFactor(1.2, window.innerWidth - 1, 1)}
            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            +
          </button>
          <span className="text-white text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => zoomByFactor(0.8, 1, 1)}
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
          {/* Remove Reset per UX; Center now sets zoom=100% and centers */}
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Scroll: Zoom | Shift+Click: Pan
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
