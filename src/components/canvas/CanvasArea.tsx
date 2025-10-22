import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useCanvasPanning, useCanvasSetup } from '../../hooks/useCanvas';
// removed unused imports

interface CanvasAreaProps {
  onDrawStart: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDrawMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDrawEnd: () => void;
}

const CanvasArea: React.FC<CanvasAreaProps> = ({ onDrawStart, onDrawMove, onDrawEnd }) => {
  const {
    containerRef,
    backgroundCanvasRef,
    mapCanvasRef,
    overlayCanvasRef,
    zoom,
    panOffset,
    isPanning,
    canvasWidth,
    canvasHeight,
    isDMView,
    tool
  } = useAppContext();

  // Initialize canvases
  useCanvasSetup();
  
  // Pan and zoom functionality
  const { handleWheel, handlePanStart, isPanTrigger } = useCanvasPanning();

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        border: '4px solid #374151',
        cursor: isPanning ? 'grabbing' : undefined,
        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
        transformOrigin: '0 0'
      }}
      onWheel={handleWheel}
      onMouseDown={(e) => {
        if (isPanTrigger(e as any)) {
          handlePanStart(e);
          return;
        }
        onDrawStart(e);
      }}
      onMouseMove={onDrawMove}
      onMouseUp={onDrawEnd}
      onMouseLeave={onDrawEnd}
    >
      {/* Background layer with grid */}
      <canvas
        ref={backgroundCanvasRef}
        className="absolute top-0 left-0"
        style={{ zIndex: 0, pointerEvents: 'none' }}
      />

      {/* Map drawing layer */}
      <canvas
        ref={mapCanvasRef}
        className="absolute top-0 left-0"
        style={{ zIndex: 1, pointerEvents: 'none' }}
      />

      {/* Overlay layer for fog and regions */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0"
        style={{
          zIndex: 2,
          pointerEvents: 'none',
          cursor: isDMView
            ? (tool === 'eraser' ? 'grab' : 'crosshair')
            : 'pointer'
        }}
      />
    </div>
  );
};

export default CanvasArea;
