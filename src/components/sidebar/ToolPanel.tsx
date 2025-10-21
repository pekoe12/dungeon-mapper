import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useFogRegions } from '../../hooks/useFogRegions';
import { Tool } from '../../types';

const ToolPanel: React.FC = () => {
  const {
    tool,
    setTool,
    brushSize,
    setBrushSize,
    brushColor,
    setBrushColor,
    currentRegion
  } = useAppContext();
  
  const { completeFogRegion, cancelFogRegion } = useFogRegions();

  const handleToolChange = (newTool: Tool) => {
    setTool(newTool);
  };

  return (
    <div className="mb-4 p-3 bg-gray-700 rounded">
      <h3 className="font-bold mb-2 text-yellow-300">Drawing Tools:</h3>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => handleToolChange('brush')}
          className={`px-3 py-2 rounded ${tool === 'brush' ? 'bg-blue-600' : 'bg-gray-600'} hover:bg-blue-500`}
        >
          🖌️ Brush
        </button>
        <button
          onClick={() => handleToolChange('eraser')}
          className={`px-3 py-2 rounded ${tool === 'eraser' ? 'bg-blue-600' : 'bg-gray-600'} hover:bg-blue-500`}
        >
          🧹 Eraser
        </button>
        <button
          onClick={() => handleToolChange('fogRegion')}
          className={`px-3 py-2 rounded ${tool === 'fogRegion' ? 'bg-green-600' : 'bg-gray-600'} hover:bg-green-500`}
        >
          🌫️ Fog Region
        </button>
      </div>

      {tool === 'fogRegion' ? (
        <div className="space-y-2">
          <p className="text-sm text-yellow-200">
            Click to add points to define a revealable area.
          </p>
          <button
            onClick={completeFogRegion}
            disabled={currentRegion.length < 3}
            className="px-3 py-1 bg-green-600 rounded disabled:bg-gray-600 disabled:opacity-50"
          >
            Complete Region ({currentRegion.length} points)
          </button>
          <button
            onClick={cancelFogRegion}
            className="ml-2 px-3 py-1 bg-red-600 rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          {/* Brush Size */}
          <div className="mb-3">
            <label className="text-sm">Brush Size: {brushSize}</label>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Color Picker */}
          <div className="mb-3">
            <label className="text-sm block mb-2">Color:</label>
            <div className="space-y-2">
              {/* Main color picker */}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <input
                  type="text"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="px-2 py-1 bg-gray-600 rounded text-xs w-24"
                  placeholder="#000000"
                />
              </div>

              {/* Quick color presets */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setBrushColor('#000000')}
                  className="w-8 h-8 bg-black border border-gray-400"
                  title="Black"
                />
                <button
                  onClick={() => setBrushColor('#FFFFFF')}
                  className="w-8 h-8 bg-white border border-gray-400"
                  title="White"
                />
                <button
                  onClick={() => setBrushColor('#8B4513')}
                  className="w-8 h-8 border border-gray-400"
                  style={{ backgroundColor: '#8B4513' }}
                  title="Brown"
                />
                <button
                  onClick={() => setBrushColor('#808080')}
                  className="w-8 h-8 bg-gray-500 border border-gray-400"
                  title="Gray"
                />
                <button
                  onClick={() => setBrushColor('#FF0000')}
                  className="w-8 h-8 bg-red-500 border border-gray-400"
                  title="Red"
                />
                <button
                  onClick={() => setBrushColor('#00FF00')}
                  className="w-8 h-8 bg-green-500 border border-gray-400"
                  title="Green"
                />
                <button
                  onClick={() => setBrushColor('#0000FF')}
                  className="w-8 h-8 bg-blue-500 border border-gray-400"
                  title="Blue"
                />
                <button
                  onClick={() => setBrushColor('#FFD700')}
                  className="w-8 h-8 border border-gray-400"
                  style={{ backgroundColor: '#FFD700' }}
                  title="Gold"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ToolPanel;
