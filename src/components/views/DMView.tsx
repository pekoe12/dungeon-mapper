import React from 'react';
import { useAppContext } from '../../context/AppContext';
import CanvasArea from '../canvas/CanvasArea';
import CanvasControls from '../canvas/CanvasControls';
import ViewToggle from '../canvas/ViewToggle';
import { useFogRegions } from '../../hooks/useFogRegions';
import { useCanvasPanning } from '../../hooks/useCanvas';
import { drawBrushStroke } from '../../utils/canvas';
import { useRealtimeSession } from '../../realtime/useRealtimeSession';

const DMView: React.FC = () => {
  const {
    tool,
    isDrawing,
    setIsDrawing,
    lastPos,
    setLastPos,
    brushColor,
    brushSize,
    mapCanvasRef,
    containerRef,
    isDMView,
  } = useAppContext();
  
  const { addPointToRegion, saveToHistory, checkAndRevealRegion, completeFogRegion, cancelFogRegion } = useFogRegions();
  const { toWorld, isPanTrigger } = useCanvasPanning();
  const realtime = useRealtimeSession();

  // Handle drawing start
  const handleDrawStart = (e: React.MouseEvent<HTMLDivElement>) => {
    // Handle player clicks in player view
    if (!isDMView) {
      handlePlayerClick(e);
      return;
    }

    if (isPanTrigger(e)) {
      return;
    }

    const { x, y } = toWorld(e.clientX, e.clientY);

    if (tool === 'fogRegion') {
      addPointToRegion({ x, y });
    } else {
      setIsDrawing(true);
      setLastPos({ x, y });

      // Draw initial point
      const mapCanvas = mapCanvasRef.current;
      if (!mapCanvas) return;

      const ctx = mapCanvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.fillStyle = brushColor;
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Broadcast begin draw if hosting
      if (realtime.role === 'dm' && realtime.status === 'live') {
        realtime.send({ type: 'draw_begin', color: brushColor, size: brushSize, mode: tool === 'eraser' ? 'eraser' : 'brush', at: { x, y } });
      }
    }
  };

  // Handle drawing
  const handleDrawMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !isDMView || tool === 'fogRegion') return;
    if (!containerRef.current || !lastPos) return;

    if (isPanTrigger(e as any)) return;

    const { x, y } = toWorld((e as any).clientX, (e as any).clientY);

    const mapCanvas = mapCanvasRef.current;
    if (!mapCanvas) return;

    const ctx = mapCanvas.getContext('2d');
    if (!ctx) return;

    drawBrushStroke(
      ctx,
      lastPos,
      { x, y },
      brushColor,
      brushSize,
      tool === 'eraser'
    );

    setLastPos({ x, y });

    // Broadcast segment if hosting
    if (realtime.role === 'dm' && realtime.status === 'live') {
      realtime.send({ type: 'draw_seg', from: lastPos, to: { x, y }, color: brushColor, size: brushSize, mode: tool === 'eraser' ? 'eraser' : 'brush' });
    }
  };

  // Handle drawing end
  const handleDrawEnd = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPos(null);
      saveToHistory();
      if (realtime.role === 'dm' && realtime.status === 'live') {
        realtime.send({ type: 'draw_end' });
      }
    }
  };

  // Handle player clicks
  const handlePlayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDMView) return;
    // Only DM in preview mode can trigger reveals
    if (!(realtime.role === 'dm')) return;
    if (!containerRef.current) return;

    const { x, y } = toWorld(e.clientX, e.clientY);

    checkAndRevealRegion({ x, y });
  };

  // Allow global 'T' to complete a fog region explicitly (not on 3rd point automatically)
  React.useEffect(() => {
    const onComplete = () => {
      if (tool === 'fogRegion') completeFogRegion();
    };
    const onCancel = () => {
      if (tool === 'fogRegion') cancelFogRegion();
    };
    window.addEventListener('complete-fog-region', onComplete as EventListener);
    window.addEventListener('cancel-fog-region', onCancel as EventListener);
    return () => {
      window.removeEventListener('complete-fog-region', onComplete as EventListener);
      window.removeEventListener('cancel-fog-region', onCancel as EventListener);
    };
  }, [tool, completeFogRegion, cancelFogRegion]);

  return (
    <>
      <CanvasArea 
        onDrawStart={handleDrawStart} 
        onDrawMove={handleDrawMove}
        onDrawEnd={handleDrawEnd}
      />
      <CanvasControls />
      <ViewToggle />
    </>
  );
};

export default DMView;
