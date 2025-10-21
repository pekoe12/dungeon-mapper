// Export map as image
export const exportMapAsImage = (
  backgroundCanvas: HTMLCanvasElement,
  mapCanvas: HTMLCanvasElement,
  overlayCanvas: HTMLCanvasElement | null,
  isDMView: boolean,
  showFogRegions: boolean,
  mapName: string
): void => {
  const canvas = document.createElement('canvas');
  canvas.width = mapCanvas.width;
  canvas.height = mapCanvas.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Draw all layers
  ctx.drawImage(backgroundCanvas, 0, 0);
  ctx.drawImage(mapCanvas, 0, 0);
  
  if (isDMView && showFogRegions && overlayCanvas) {
    ctx.drawImage(overlayCanvas, 0, 0);
  }

  // Download
  const link = document.createElement('a');
  link.download = `${mapName.replace(/[^a-z0-9]/gi, '_')}.png`;
  link.href = canvas.toDataURL();
  link.click();
};
