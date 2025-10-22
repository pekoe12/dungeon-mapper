import { useEffect, useRef, useCallback } from 'react';
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
    // Setup background canvas with grid (HiDPI aware)
    const bgCanvas = backgroundCanvasRef.current;
    const mapCanvas = mapCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (!bgCanvas || !mapCanvas || !overlayCanvas) return;

    const dpr = (window.devicePixelRatio || 1);

    // Set backing store size and CSS size
    [bgCanvas, mapCanvas, overlayCanvas].forEach((canvas) => {
      canvas.width = Math.max(1, Math.floor(canvasWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvasHeight * dpr));
      // Keep CSS size in CSS pixels
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Prefer higher quality when scaling
        // Note: strokes remain crisp due to DPR transform above
        (ctx as any).imageSmoothingEnabled = true;
        try { (ctx as any).imageSmoothingQuality = 'high'; } catch {}
      }
    });

    // Draw parchment background with grid
    const bgCtx = bgCanvas.getContext('2d');
    if (bgCtx) {
      drawGrid(bgCtx, canvasWidth, canvasHeight, gridSize, showGrid);
    }

    // Clear map canvas
    const mapCtx = mapCanvas.getContext('2d');
    if (mapCtx) {
      // Clear using device pixels (ignore current transform)
      mapCtx.save();
      mapCtx.setTransform(1, 0, 0, 1, 0, 0);
      mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
      mapCtx.restore();
    }

    // Initialize history with empty state
    const initialHistoryState = {
      mapData: mapCtx?.getImageData(0, 0, mapCanvas.width, mapCanvas.height) as ImageData,
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

  // Constants for pleasant zooming
  const MIN_ZOOM = 0.75;
  const MAX_ZOOM = 2;
  const ZOOM_SENS = 1.0015; // slow accel, larger absolute delta => faster zoom

  // Pan trigger helper (MMB or Shift+LMB)
  const isPanTrigger = (evt: { button: number; shiftKey: boolean }) =>
    evt.button === 1 || (evt.button === 0 && evt.shiftKey);

  const getViewportRect = () => {
    const el = containerRef.current;
    const parent = el?.parentElement ?? undefined;
    return (parent?.getBoundingClientRect() ?? el?.getBoundingClientRect()) as DOMRect | undefined;
  };

  const zoomAt = (clientX: number, clientY: number, wheelDeltaY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleFactor = Math.pow(ZOOM_SENS, -wheelDeltaY);
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * scaleFactor));

    // Screen point relative to container
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    // World coords under cursor before zoom (CSS transform already applied to rect)
    const wx = sx / zoom;
    const wy = sy / zoom;

    // Compute pan to keep same world point under cursor after zoom
    let nextPan = {
      x: sx - wx * nextZoom,
      y: sy - wy * nextZoom
    };

    setPanOffset(nextPan);
    setZoom(nextZoom);
  };

  const zoomByFactor = (factor: number, pivotClientX: number, pivotClientY: number) => {
    // convert factor to a synthetic wheel delta and reuse zoomAt
    const deltaY = -Math.log(factor) / Math.log(ZOOM_SENS);
    zoomAt(pivotClientX, pivotClientY, deltaY);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Always zoom with wheel; prevent page scroll
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY);
  };

  // Track initial mouse position and pan offset when panning starts
  const panStartRef = useRef<{ mouseX: number; mouseY: number; offsetX: number; offsetY: number } | null>(null);

  const handlePanStart = (e: React.MouseEvent) => {
    if (isPanTrigger(e)) {
      e.preventDefault();
      setIsPanning(true);
      // Store the initial mouse position and current pan offset
      panStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        offsetX: panOffset.x,
        offsetY: panOffset.y
      };
    }
  };

  const handlePanMove = useCallback((e: MouseEvent) => {
    if (!isPanning || !panStartRef.current) return;
    
    // Calculate delta from initial position
    const dx = e.clientX - panStartRef.current.mouseX;
    const dy = e.clientY - panStartRef.current.mouseY;
    
    // Apply delta to initial offset - NO CLAMPING
    const next = {
      x: panStartRef.current.offsetX + dx,
      y: panStartRef.current.offsetY + dy
    };
    
    setPanOffset(next);
  }, [isPanning, setPanOffset]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
  }, [setIsPanning]);

  // Add event listeners for panning
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
      document.body.style.cursor = 'grabbing';

      return () => {
        document.removeEventListener('mousemove', handlePanMove);
        document.removeEventListener('mouseup', handlePanEnd);
        document.body.style.cursor = 'default';
      };
    }
  }, [isPanning, handlePanMove, handlePanEnd]);

  // Center the canvas in the viewport and set zoom to 1 (100%)
  const centerView = () => {
    const rect = getViewportRect();
    if (!rect) return;
    const nextZoom = 1;
    setZoom(nextZoom);
    
    // Actually center the canvas
    const viewW = rect.width;
    const viewH = rect.height;
    const scaledW = canvasWidth * nextZoom;
    const scaledH = canvasHeight * nextZoom;
    
    const centered = {
      x: (viewW - scaledW) / 2,
      y: (viewH - scaledH) / 2
    };
    
    setPanOffset(centered);
  };

  // Reset zoom and panning  
  const resetView = () => {
    const rect = getViewportRect();
    const nextZoom = 1;
    setZoom(nextZoom);
    if (rect) {
      const viewW = rect.width;
      const viewH = rect.height;
      const scaledW = canvasWidth * nextZoom;
      const scaledH = canvasHeight * nextZoom;
      
      setPanOffset({
        x: (viewW - scaledW) / 2,
        y: (viewH - scaledH) / 2
      });
    } else {
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const fitToScreen = () => {
    const rect = getViewportRect();
    if (!rect) return;
    const viewW = rect.width;
    const viewH = rect.height;
    const scale = Math.min(viewW / canvasWidth, viewH / canvasHeight);
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
    setZoom(nextZoom);
    
    // Center for fit to screen
    const scaledW = canvasWidth * nextZoom;
    const scaledH = canvasHeight * nextZoom;
    
    setPanOffset({
      x: (viewW - scaledW) / 2,
      y: (viewH - scaledH) / 2
    });
  };

  return {
    zoom,
    panOffset,
    handleWheel,
    handlePanStart,
    isPanTrigger,
    zoomAt,
    zoomByFactor,
    centerView,
    resetView,
    fitToScreen,
    isPanning,
    // Convert a mouse event on the container to world coords
    toWorld: (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      return {
        x: sx / zoom,
        y: sy / zoom
      };
    }
  };
};