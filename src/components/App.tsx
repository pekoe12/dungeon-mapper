import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from '../context/AppContext';
import Sidebar from './sidebar/Sidebar';
import DMView from './views/DMView';
import Footer from './Footer';
import { drawFogRegions, drawCurrentRegion, applyFogOfWar } from '../utils/canvas';

// Inner component that uses the context
const AppContent: React.FC = () => {
  const {
    isDMView,
    fogRegions,
    revealedRegions,
    showFogRegions,
    currentRegion,
    tool,
    overlayCanvasRef,
    mapCanvasRef,
    canvasWidth,
    canvasHeight
  } = useAppContext();

  // Redraw overlay
  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const mapCanvas = mapCanvasRef.current;
    if (!overlayCanvas || !mapCanvas) return;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

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
  }, [isDMView, fogRegions, revealedRegions, showFogRegions, currentRegion, tool, canvasWidth, canvasHeight]);

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
      
      {/* Footer with GitHub link */}
      <Footer />
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
