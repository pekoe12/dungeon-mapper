import { Point, Region } from '../types';

// Draw grid on canvas
export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number,
  showGrid: boolean
): void => {
  if (!showGrid) {
    ctx.fillStyle = '#F5E6D3';
    ctx.fillRect(0, 0, width, height);
    return;
  }

  ctx.save();
  ctx.fillStyle = '#F5E6D3';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(139, 90, 43, 0.15)'; // Light brown for parchment feel
  ctx.lineWidth = 0.5;

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
};

// Draw fog regions on overlay canvas
export const drawFogRegions = (
  ctx: CanvasRenderingContext2D,
  fogRegions: Region[],
  revealedRegions: Set<number>,
  showFogRegions: boolean
): void => {
  if (!showFogRegions) return;

  fogRegions.forEach((region, index) => {
    if (region.length === 0) return;

    // Use transparent red for unrevealed, transparent green for revealed
    ctx.strokeStyle = revealedRegions.has(index) ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.fillStyle = revealedRegions.has(index) ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';

    ctx.beginPath();
    ctx.moveTo(region[0].x, region[0].y);
    for (let i = 1; i < region.length; i++) {
      ctx.lineTo(region[i].x, region[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Add label
    const center = region.reduce(
      (acc, p) => ({
        x: acc.x + p.x / region.length,
        y: acc.y + p.y / region.length,
      }),
      { x: 0, y: 0 }
    );

    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.strokeText(`Region ${index + 1}`, center.x, center.y);
    ctx.fillText(`Region ${index + 1}`, center.x, center.y);
  });
};

// Draw current region being created
export const drawCurrentRegion = (
  ctx: CanvasRenderingContext2D,
  currentRegion: Region
): void => {
  if (currentRegion.length === 0) return;

  ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  ctx.moveTo(currentRegion[0].x, currentRegion[0].y);
  for (let i = 1; i < currentRegion.length; i++) {
    ctx.lineTo(currentRegion[i].x, currentRegion[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
};

// Apply fog of war for player view
export const applyFogOfWar = (
  ctx: CanvasRenderingContext2D,
  _mapCanvas: HTMLCanvasElement,
  fogRegions: Region[],
  revealedRegions: Set<number>,
  width: number,
  height: number
): void => {
  // Clear overlay and fill with black fog
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Cut out revealed regions
  fogRegions.forEach((region, index) => {
    if (revealedRegions.has(index)) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';

      ctx.beginPath();
      ctx.moveTo(region[0].x, region[0].y);
      for (let i = 1; i < region.length; i++) {
        ctx.lineTo(region[i].x, region[i].y);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  });
};

// Check if point is in polygon
export const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

// Draw a brush stroke between two points
export const drawBrushStroke = (
  ctx: CanvasRenderingContext2D,
  startPoint: Point,
  endPoint: Point,
  color: string,
  size: number,
  isEraser: boolean
): void => {
  ctx.save();
  ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.stroke();
  ctx.restore();
};
