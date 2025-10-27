import { useEffect, useRef, useCallback } from 'react';
import { drawGrid, scaleCanvas } from '../utils/canvas';
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

    // DPR-safe scale for all layers
    [bgCanvas, mapCanvas, overlayCanvas].forEach((canvas) => {
      scaleCanvas(canvas, canvasWidth, canvasHeight);
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

    // Initialize history with empty state matching backing store
    if (mapCtx) {
      const snapshot = mapCtx.getImageData(0, 0, mapCanvas.width, mapCanvas.height);
      setHistory([{ mapData: snapshot, fogRegions: [] }]);
      setHistoryStep(0);
    }
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
    setCanvasHeight,
    canvasWidth,
    canvasHeight,
    isCanvasSizeLocked,
    setHistory,
    setHistoryStep,
    fogRegions,
    setFogRegions,
    zoom
  } = useAppContext();
  // Persist original bitmap and fog during an active drag so deltas are relative to the same source
  const dragSrcRef = useRef<HTMLCanvasElement | null>(null);
  const fogBeforeRef = useRef<typeof fogRegions | null>(null);

  const resizeCanvas = (width: number, height: number) => {
    // Optionally snap to grid when canvas size lock is enabled
    const snappedGrid = Math.max(5, Math.round(gridSize / 5) * 5);
    const snappedWidth = isCanvasSizeLocked ? Math.round(width / snappedGrid) * snappedGrid : Math.round(width);
    const snappedHeight = isCanvasSizeLocked ? Math.round(height / snappedGrid) * snappedGrid : Math.round(height);

    // Clamp to maximum canvas size
    const MAX_SIZE = 2000;
    const clampedWidth = Math.min(snappedWidth, MAX_SIZE);
    const clampedHeight = Math.min(snappedHeight, MAX_SIZE);

    setCanvasWidth(clampedWidth);
    setCanvasHeight(clampedHeight);

    // Update all canvases with DPR-safe scaling
    [backgroundCanvasRef, mapCanvasRef, overlayCanvasRef].forEach(ref => {
      if (ref.current) {
        scaleCanvas(ref.current, clampedWidth, clampedHeight);
      }
    });

    // Redraw grid
    const bgCtx = backgroundCanvasRef.current?.getContext('2d');
    if (bgCtx) {
      drawGrid(bgCtx, clampedWidth, clampedHeight, gridSize, true);
    }
  };

  // Edge-based resize with copy/crop. Deltas are in CSS pixels.
  // Resize using base width/height from drag start to avoid compounding
  const resizeMap = (
    deltas: { addLeft?: number; addRight?: number; addTop?: number; addBottom?: number },
    base?: { width: number; height: number }
  ) => {
    // Convert screen deltas to world (CSS) pixels by removing zoom scale
    const dxL = (deltas.addLeft ?? 0) / (zoom || 1);
    const dxR = (deltas.addRight ?? 0) / (zoom || 1);
    const dyT = (deltas.addTop ?? 0) / (zoom || 1);
    const dyB = (deltas.addBottom ?? 0) / (zoom || 1);

    // Work from original size on each drag update for stability
    const addLeft = Math.round(dxL);
    const addRight = Math.round(dxR);
    const addTop = Math.round(dyT);
    const addBottom = Math.round(dyB);

    const originW = base?.width ?? canvasWidth;
    const originH = base?.height ?? canvasHeight;

    // Snap deltas to grid step so grids align
    const step = Math.max(5, Math.round(gridSize / 5) * 5);
    const sAddLeft = Math.round(addLeft / step) * step;
    const sAddRight = Math.round(addRight / step) * step;
    const sAddTop = Math.round(addTop / step) * step;
    const sAddBottom = Math.round(addBottom / step) * step;

    let targetW = originW + sAddLeft + sAddRight;
    let targetH = originH + sAddTop + sAddBottom;

    // Snap to grid when locked
    const snappedGrid = Math.max(5, Math.round(gridSize / 5) * 5);
    if (isCanvasSizeLocked) {
      targetW = Math.round(targetW / snappedGrid) * snappedGrid;
      targetH = Math.round(targetH / snappedGrid) * snappedGrid;
    }

    // Clamp to reasonable bounds
    const MAX_SIZE = 2000;
    targetW = Math.max(50, Math.min(MAX_SIZE, targetW));
    targetH = Math.max(50, Math.min(MAX_SIZE, targetH));

    const bgCanvas = backgroundCanvasRef.current;
    const mapCanvas = mapCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!bgCanvas || !mapCanvas || !overlayCanvas) return;

    // Snapshot the original bitmap once at drag start (first invocation)
    if (!dragSrcRef.current) {
      const snap = document.createElement('canvas');
      snap.width = mapCanvas.width; // device pixels
      snap.height = mapCanvas.height;
      const sctx = snap.getContext('2d');
      if (!sctx) return;
      sctx.drawImage(mapCanvas, 0, 0);
      dragSrcRef.current = snap;
      // also capture fog regions to offset smoothly during drag
      fogBeforeRef.current = fogRegions.map(r => r.map(p => ({ x: p.x, y: p.y })));
    }
    const srcCanvas = dragSrcRef.current as HTMLCanvasElement;

    const dpr = (window.devicePixelRatio || 1);

    // Apply new sizes to all layers
    setCanvasWidth(targetW);
    setCanvasHeight(targetH);
    [bgCanvas, mapCanvas, overlayCanvas].forEach((c) => scaleCanvas(c, targetW, targetH));

    // Compute src/dst rectangles in DEVICE pixels for exact copy/crop
    const srcXDev = sAddLeft < 0 ? -sAddLeft * dpr : 0;
    const srcYDev = sAddTop < 0 ? -sAddTop * dpr : 0;
    const dstXDev = sAddLeft > 0 ? sAddLeft * dpr : 0;
    const dstYDev = sAddTop > 0 ? sAddTop * dpr : 0;
    const drawWDev = Math.max(0, Math.min(srcCanvas.width - srcXDev, mapCanvas.width - dstXDev));
    const drawHDev = Math.max(0, Math.min(srcCanvas.height - srcYDev, mapCanvas.height - dstYDev));

    // Redraw preserved pixels into the resized live map canvas
    const mapCtx2 = mapCanvas.getContext('2d');
    if (mapCtx2) {
      mapCtx2.save();
      mapCtx2.setTransform(1, 0, 0, 1, 0, 0);
      // Clear fully first to avoid ghosted pixels
      mapCtx2.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
      if (drawWDev > 0 && drawHDev > 0) {
        mapCtx2.drawImage(
          srcCanvas,
          srcXDev, srcYDev, drawWDev, drawHDev,
          dstXDev, dstYDev, drawWDev, drawHDev
        );
      }
      mapCtx2.restore();
    }

    // Redraw grid to match new size
    const bgCtx = bgCanvas.getContext('2d');
    if (bgCtx) {
      drawGrid(bgCtx, targetW, targetH, gridSize, true);
    }
    // Live update fog from the captured original so it stays aligned with the bitmap during drag
    if (fogBeforeRef.current) {
      const shifted = fogBeforeRef.current.map(region => region.map(p => ({ x: p.x + sAddLeft, y: p.y + sAddTop })));
      setFogRegions(shifted);
    }
  };

  // Finalize deferred updates at the end of a drag
  useEffect(() => {
    const onResizeEnd = () => {
      const mapCanvas = mapCanvasRef.current;
      if (!mapCanvas) return;
      const ctx = mapCanvas.getContext('2d');
      if (!ctx) return;
      // clear per-drag snapshots
      dragSrcRef.current = null;
      fogBeforeRef.current = null;

      const snapshot = ctx.getImageData(0, 0, mapCanvas.width, mapCanvas.height);
      setHistory([{ mapData: snapshot, fogRegions }]);
      setHistoryStep(0);
    };
    window.addEventListener('resize-handles-up', onResizeEnd);
    return () => window.removeEventListener('resize-handles-up', onResizeEnd);
  }, [fogRegions, mapCanvasRef, setFogRegions, setHistory, setHistoryStep]);

  return { resizeCanvas, resizeMap };
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