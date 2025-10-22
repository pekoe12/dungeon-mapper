import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from '../context/AppContext';
import Sidebar from './sidebar/Sidebar';
import DMView from './views/DMView';
import { drawFogRegions, drawCurrentRegion, applyFogOfWar } from '../utils/canvas';
import { useCanvasPanning } from '../hooks/useCanvas';

// Inner component that uses the context
const AppContent: React.FC = () => {
  const {
    isDMView,
    setTool,
    fogRegions,
    revealedRegions,
    showFogRegions,
    currentRegion,
    tool,
    overlayCanvasRef,
    mapCanvasRef,
    canvasWidth,
    canvasHeight,
    zoom,
    panOffset
  } = useAppContext();
  const { } = useCanvasPanning();

  // Global shortcuts for tools
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        setTool('brush');
      } else if (e.key === 'x' || e.key === 'X') {
        setTool('eraser');
      } else if (e.key === 'r' || e.key === 'R') {
        // Toggle fog region tool; if already active, cancel current in-progress polygon
        if (tool === 'fogRegion') {
          window.dispatchEvent(new CustomEvent('cancel-fog-region'));
        } else {
          setTool('fogRegion');
        }
      } else if (e.key === 't' || e.key === 'T') {
        // Signal DMView effect to complete region via custom event
        window.dispatchEvent(new CustomEvent('complete-fog-region'));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setTool, tool]);

  // Redraw overlay (fog DM view or fog of war in player), and keep grid as-is for now
  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const mapCanvas = mapCanvasRef.current;
    if (!overlayCanvas || !mapCanvas) return;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;
    // Clear using device pixels ignoring current transform
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    ctx.restore();

    if (isDMView) {
      // Draw fog regions for DM
      if (showFogRegions) {
        drawFogRegions(ctx, fogRegions, revealedRegions, showFogRegions);
        
        // Draw current region being created
        if (tool === 'fogRegion' && currentRegion.length > 0) {
          drawCurrentRegion(ctx, currentRegion);
        }
      }
    } else {
      // Player view - apply fog of war
      applyFogOfWar(ctx, mapCanvas, fogRegions, revealedRegions, canvasWidth, canvasHeight);
    }
  }, [isDMView, fogRegions, revealedRegions, showFogRegions, currentRegion, tool, canvasWidth, canvasHeight, zoom, panOffset]);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 relative bg-gray-800 flex items-center justify-center overflow-hidden">
          <DMView />
        </div>

        {/* Control Panel */}
        <Sidebar />
      </div>
      
      <a 
      href="https://github.com/pekoe12/dungeon-mapper" 
      target="_blank" 
      rel="noopener noreferrer"
      className="absolute bottom-4 left-4 z-10 p-2 rounded-full bg-gray-800/80 backdrop-blur border border-gray-700 shadow-lg hover:bg-gray-700 transition-colors duration-200"
      title="View source on GitHub"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="text-white"
      >
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
      </svg>
    </a>
    </div>
  );
};

// Wrapper component that provides the context
const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
