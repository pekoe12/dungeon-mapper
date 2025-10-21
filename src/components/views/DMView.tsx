import React from 'react';
import { useAppContext } from '../../context/AppContext';
import CanvasArea from '../canvas/CanvasArea';
import CanvasControls from '../canvas/CanvasControls';
import ViewToggle from '../canvas/ViewToggle';
import { useFogRegions } from '../../hooks/useFogRegions';
import { drawBrushStroke } from '../../utils/canvas';
import { Point } from '../../types';

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
  
  const { addPointToRegion, saveToHistory, checkAndRevealRegion } = useFogRegions();

  // Handle drawing start
  const handleDrawStart = (e: React.MouseEvent<HTMLDivElement>) => {
    // Handle player clicks in player view
    if (!isDMView) {
      handlePlayerClick(e);
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    }
  };

  // Handle drawing
  const handleDrawMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !isDMView || tool === 'fogRegion') return;
    if (!containerRef.current || !lastPos) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
  };

  // Handle drawing end
  const handleDrawEnd = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPos(null);
      saveToHistory();
    }
  };

  // Handle player clicks
  const handlePlayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDMView) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    checkAndRevealRegion({ x, y });
  };

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
