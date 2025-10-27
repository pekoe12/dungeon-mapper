import React, { useRef } from 'react';
import { useCanvasResize } from '../../hooks/useCanvas';
import { useAppContext } from '../../context/AppContext';

const HANDLE_SIZE = 10;

const Handle: React.FC<{
  position: 'N' | 'S' | 'E' | 'W';
  onDrag: (dx: number, dy: number, base: { width: number; height: number }) => void;
}> = ({ position, onDrag }) => {
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const baseRef = useRef<{ width: number; height: number } | null>(null);
  const { canvasWidth, canvasHeight } = useAppContext();

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { x: e.clientX, y: e.clientY };
    baseRef.current = { width: canvasWidth, height: canvasHeight };
    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      // Use total delta from drag start for stable sizing
      const dx = ev.clientX - dragRef.current.x;
      const dy = ev.clientY - dragRef.current.y;
      onDrag(dx, dy, baseRef.current || { width: canvasWidth, height: canvasHeight });
    };
    const up = () => {
      dragRef.current = null;
      // Signal end of resizing
      const evt = new Event('resize-handles-up');
      window.dispatchEvent(evt);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    background: '#10b981',
    border: '2px solid #064e3b',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    zIndex: 3,
    cursor: position === 'N' || position === 'S' ? 'ns-resize' : 'ew-resize',
  };

  switch (position) {
    case 'N':
      Object.assign(style, { top: -(HANDLE_SIZE + 5), left: '50%', transform: 'translateX(-50%)' });
      break;
    case 'S':
      Object.assign(style, { bottom: -(HANDLE_SIZE + 10), left: '50%', transform: 'translateX(-50%)' });
      break;
    case 'E':
      Object.assign(style, { right: -(HANDLE_SIZE + 10), top: '50%', transform: 'translateY(-50%)' });
      break;
    case 'W':
      Object.assign(style, { left: -(HANDLE_SIZE + 5), top: '50%', transform: 'translateY(-50%)' });
      break;
  }

  return <div style={style} onMouseDown={onMouseDown} />;
};

const ResizeHandles: React.FC = () => {
  const { resizeMap } = useCanvasResize();
  const { isResizingMap, setIsResizingMap, isCanvasSizeLocked } = useAppContext();

  const wrapDrag = (fn: (dx: number, dy: number, base: { width: number; height: number }) => void) => (dx: number, dy: number, base: { width: number; height: number }) => {
    if (isCanvasSizeLocked) return; // fully disable when locked
    if (!isResizingMap) setIsResizingMap(true);
    fn(dx, dy, base);
  };

  // Listen for mouseup dispatched from handles to end resizing state
  React.useEffect(() => {
    const onUp = () => setIsResizingMap(false);
    window.addEventListener('resize-handles-up', onUp);
    return () => window.removeEventListener('resize-handles-up', onUp);
  }, [setIsResizingMap]);

  return (
    <>
      {/* Each handle affects only one side; positive drag grows in the drag direction */}
      <Handle position="N" onDrag={wrapDrag((_, dy, base) => resizeMap({ addTop: -dy }, base))} />
      <Handle position="S" onDrag={wrapDrag((_, dy, base) => resizeMap({ addBottom: dy }, base))} />
      <Handle position="E" onDrag={wrapDrag((dx, _, base) => resizeMap({ addRight: dx }, base))} />
      <Handle position="W" onDrag={wrapDrag((dx, _, base) => resizeMap({ addLeft: -dx }, base))} />
    </>
  );
};

export default ResizeHandles;


