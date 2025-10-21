import { useEffect, useRef } from 'react';
import { drawGrid } from '../utils/canvas';
import { useAppContext } from '../context/AppContext';

export const useCanvasSetup = () => {
  const {
    backgroundCanvasRef, 
    mapCanvasRef, 
    overlayCanvasRef,
    showGrid,
    gridSize,
    canvasWidth,
    canvasHeight,
    setHistory,
    setHistoryStep
  } = useAppContext();

  // Initialize canvases
  useEffect(() => {
    // Setup background canvas with grid
    const bgCanvas = backgroundCanvasRef.current;
    const mapCanvas = mapCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (!bgCanvas || !mapCanvas || !overlayCanvas) return;

    // Set canvas sizes
    [bgCanvas, mapCanvas, overlayCanvas].forEach(canvas => {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    });

    // Draw parchment background with grid
    const bgCtx = bgCanvas.getContext('2d');
    if (bgCtx) {
      drawGrid(bgCtx, canvasWidth, canvasHeight, gridSize, showGrid);
    }

    // Clear map canvas
    const mapCtx = mapCanvas.getContext('2d');
    if (mapCtx) {
      mapCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    }

    // Initialize history with empty state
    const initialHistoryState = {
      mapData: mapCtx?.getImageData(0, 0, canvasWidth, canvasHeight) as ImageData,
      fogRegions: []
    };

    setHistory([initialHistoryState]);
    setHistoryStep(0);
  }, []);

  // Update grid when settings change
  useEffect(() => {
    const bgCanvas = backgroundCanvasRef.current;
    if (!bgCanvas) return;
    
    const bgCtx = bgCanvas.getContext('2d');
    if (bgCtx) {
      drawGrid(bgCtx, canvasWidth, canvasHeight, gridSize, showGrid);
    }
  }, [showGrid, gridSize, canvasWidth, canvasHeight]);

  return {
    backgroundCanvasRef,
    mapCanvasRef,
    overlayCanvasRef
  };
};

export const useCanvasResize = () => {
  const {
    gridSize,
    backgroundCanvasRef,
    mapCanvasRef,
    overlayCanvasRef,
    setCanvasWidth,
    setCanvasHeight
  } = useAppContext();

  const resizeCanvas = (width: number, height: number) => {
    // Snap to grid
    const snappedWidth = Math.round(width / gridSize) * gridSize;
    const snappedHeight = Math.round(height / gridSize) * gridSize;

    setCanvasWidth(snappedWidth);
    setCanvasHeight(snappedHeight);

    // Update all canvases
    [backgroundCanvasRef, mapCanvasRef, overlayCanvasRef].forEach(ref => {
      if (ref.current) {
        ref.current.width = snappedWidth;
        ref.current.height = snappedHeight;
      }
    });

    // Redraw grid
    const bgCtx = backgroundCanvasRef.current?.getContext('2d');
    if (bgCtx) {
      drawGrid(bgCtx, snappedWidth, snappedHeight, gridSize, true);
    }
  };

  return { resizeCanvas };
};

export const useCanvasPanning = () => {
  const {
    zoom, 
    setZoom, 
    panOffset, 
    setPanOffset, 
    isPanning, 
    setIsPanning,
    containerRef,
    canvasWidth,
    canvasHeight
  } = useAppContext();

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.25, Math.min(4, zoom * delta));

      // Zoom towards mouse position
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dx = (x - panOffset.x) / zoom;
        const dy = (y - panOffset.y) / zoom;

        setPanOffset({
          x: x - dx * newZoom,
          y: y - dy * newZoom
        });
      }
      
      setZoom(newZoom);
    }
  };

  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
    }
  };

  const handlePanMove = (e: MouseEvent) => {
    if (!isPanning) return;
    setPanOffset(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Add event listeners for panning
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
      document.body.style.cursor = 'grab';

      return () => {
        document.removeEventListener('mousemove', handlePanMove);
        document.removeEventListener('mouseup', handlePanEnd);
        document.body.style.cursor = 'default';
      };
    }
  }, [isPanning]);

  // Center the canvas in the viewport
  const centerView = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPanOffset({
        x: (rect.width - canvasWidth * zoom) / 2,
        y: (rect.height - canvasHeight * zoom) / 2
      });
    }
  };

  // Reset zoom and panning
  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return {
    zoom,
    panOffset,
    handleWheel,
    handlePanStart,
    centerView,
    resetView,
    isPanning
  };
};
