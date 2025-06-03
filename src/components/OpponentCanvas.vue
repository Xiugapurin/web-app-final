<template>
  <div class="w-full aspect-square bg-gray-200" ref="containerEl">
    <canvas ref="canvasEl" class="border border-gray-400 bg-white w-full h-full"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';

const props = defineProps({
  gridResolutionX: { type: Number, default: 64 },
  gridResolutionY: { type: Number, default: 64 },
  strokesToProcess: { type: Array, default: () => [] },
  backgroundColor: { type: String, default: '#FFFFFF' },
});

const containerEl = ref(null);
const canvasEl = ref(null);
const ctx = ref(null);

const canvasPixelWidth = ref(256); 
const canvasPixelHeight = ref(256);

const pixelSizeX = computed(() => canvasPixelWidth.value / props.gridResolutionX);
const pixelSizeY = computed(() => canvasPixelHeight.value / props.gridResolutionY);

let animationFrameId = null;
const drawingQueue = ref([]); 
let lastProcessedStrokeIndex = -1;
let replayStartTime = 0;
let firstPointTimestampInCurrentBatch = 0;
let lastPlottedPointForSegment = null;

const clearCanvas = () => {
  if (ctx.value) {
    ctx.value.fillStyle = props.backgroundColor;
    ctx.value.fillRect(0, 0, canvasPixelWidth.value, canvasPixelHeight.value);
  }
};

const drawGridCell = (gridX, gridY, color, brushSize = 1, isEraser = false) => {
  if (!ctx.value) return;
  const colorToUse = isEraser ? props.backgroundColor : color;
  const actualBrushSize = brushSize || 1;
  const offset = Math.floor((actualBrushSize - 1) / 2);
  const startDrawX = gridX - offset;
  const startDrawY = gridY - offset;

  ctx.value.fillStyle = colorToUse;
  for (let i = 0; i < actualBrushSize; i++) {
    for (let j = 0; j < actualBrushSize; j++) {
      const cX = startDrawX + i;
      const cY = startDrawY + j;
      if (cX >= 0 && cX < props.gridResolutionX && cY >= 0 && cY < props.gridResolutionY) {
        ctx.value.fillRect(
          cX * pixelSizeX.value, cY * pixelSizeY.value,
          pixelSizeX.value, pixelSizeY.value
        );
      }
    }
  }
};

const drawLineBetweenGridCells = (x0, y0, x1, y1, color, brushSize, isEraser) => {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, e2;
    let currentX = x0;
    let currentY = y0;
    while (true) {
        drawGridCell(currentX, currentY, color, brushSize, isEraser);
        if (currentX === x1 && currentY === y1) break;
        e2 = 2 * err;
        if (e2 >= dy) { err += dy; currentX += sx; }
        if (e2 <= dx) { err += dx; currentY += sy; }
    }
};

const processAndEnqueueStrokes = (strokes) => {
    const newOpsToEnqueue = [];
    strokes.forEach(strokeData => {
        if (!strokeData) return;
        const { operationType, operationTimestamp, path, color, brushSize, isEraser } = strokeData;
        const baseTimestamp = operationTimestamp || (path && path.length > 0 ? path[0].timestamp : Date.now());

        if (operationType === 'clearCanvasUpdate') {
            newOpsToEnqueue.push({ type: 'clear', timestamp: baseTimestamp });
        } else if (operationType === 'draw' && path && path.length > 0) {
            const strokeBaseTimestamp = path[0].timestamp;
            path.forEach((point, index) => {
                newOpsToEnqueue.push({
                    type: 'point',
                    x: point.x, y: point.y, 
                    timestamp: point.timestamp,
                    relativeDelay: point.timestamp - strokeBaseTimestamp,
                    color, brushSize, isEraser,
                    isFirstInSegment: index === 0,
                    originalStrokeTimestamp: strokeBaseTimestamp
                });
            });
        }
    });

    if (newOpsToEnqueue.length > 0) {
        drawingQueue.value.push(...newOpsToEnqueue);
        drawingQueue.value.sort((a, b) => a.timestamp - b.timestamp);

        if (!animationFrameId && drawingQueue.value.length > 0) {
            replayStartTime = performance.now();
            firstPointTimestampInCurrentBatch = drawingQueue.value[0].timestamp;
            animationFrameId = requestAnimationFrame(replayDrawingFrame);
        }
    }
};

watch(() => props.strokesToProcess, (newStrokesArray, oldStrokesArray) => {
  if (!ctx.value || !newStrokesArray) return;
  
  const strokesToAdd = newStrokesArray.slice(lastProcessedStrokeIndex + 1);
  if (strokesToAdd.length > 0) {
    processAndEnqueueStrokes(strokesToAdd);
    lastProcessedStrokeIndex = newStrokesArray.length - 1;
  }
}, { deep: true });


const replayDrawingFrame = () => {
    if (drawingQueue.value.length === 0) {
        animationFrameId = null;
        lastPlottedPointForSegment = null;
        return;
    }

    const now = performance.now();
    const elapsedTimeSinceReplayStart = now - replayStartTime;
    let processedSomethingThisFrame = false;

    while (drawingQueue.value.length > 0) {
        const op = drawingQueue.value[0];
        const scheduledDelay = op.timestamp - firstPointTimestampInCurrentBatch;

        if (elapsedTimeSinceReplayStart >= scheduledDelay) {
            const currentOp = drawingQueue.value.shift();
            processedSomethingThisFrame = true;

            if (currentOp.type === 'clear') {
                clearCanvas();
                lastPlottedPointForSegment = null;
            } else if (currentOp.type === 'point') {
                if (currentOp.isFirstInSegment || !lastPlottedPointForSegment || 
                    lastPlottedPointForSegment.originalStrokeTimestamp !== currentOp.originalStrokeTimestamp) {
                    drawGridCell(currentOp.x, currentOp.y, currentOp.color, currentOp.brushSize, currentOp.isEraser);
                } else {
                    drawLineBetweenGridCells(
                        lastPlottedPointForSegment.x, lastPlottedPointForSegment.y,
                        currentOp.x, currentOp.y,
                        currentOp.color, currentOp.brushSize, currentOp.isEraser
                    );
                }
                lastPlottedPointForSegment = currentOp;
            }
        } else {
            break; 
        }
    }
    
    if (drawingQueue.value.length > 0) {
        animationFrameId = requestAnimationFrame(replayDrawingFrame);
    } else {
        animationFrameId = null;
        lastPlottedPointForSegment = null;
        replayStartTime = 0; 
        firstPointTimestampInCurrentBatch = 0;
    }
};

let resizeObserver = null;
const setupCanvasAndObserver = () => {
    if (canvasEl.value && containerEl.value) {
        ctx.value = canvasEl.value.getContext('2d');
        const performResize = () => {
            if (!containerEl.value || !canvasEl.value) return;
            const newWidth = containerEl.value.clientWidth;
            const newHeight = containerEl.value.clientHeight; 

            if (newWidth === 0 || newHeight === 0) { 
                nextTick(performResize); return;
            }
            if (canvasPixelWidth.value !== newWidth || canvasPixelHeight.value !== newHeight) {
                canvasPixelWidth.value = newWidth;
                canvasPixelHeight.value = newHeight;
                canvasEl.value.width = newWidth;
                canvasEl.value.height = newHeight;
                
                clearCanvas(); 
                
                const allStrokes = props.strokesToProcess;
                lastPlottedPointForSegment = null;
                allStrokes.forEach(strokeItem => {
                    if (!strokeItem || !strokeItem.path) return;
                    const { operationType, path, color, brushSize, isEraser } = strokeItem;
                    if (operationType === 'clearCanvasUpdate') {
                        clearCanvas(); lastPlottedPointForSegment = null;
                    } else if (operationType === 'draw' && path.length > 0) {
                        path.forEach((point, index) => {
                            if (index === 0 || !lastPlottedPointForSegment || 
                                lastPlottedPointForSegment.originalStrokeTimestamp !== (strokeItem.operationTimestamp || point.timestamp)) {
                                drawGridCell(point.x, point.y, color, brushSize, isEraser);
                            } else {
                                drawLineBetweenGridCells(lastPlottedPointForSegment.x, lastPlottedPointForSegment.y, point.x, point.y, color, brushSize, isEraser);
                            }
                            lastPlottedPointForSegment = {...point, originalStrokeTimestamp: (strokeItem.operationTimestamp || point.timestamp)};
                        });
                    }
                });
            }
        };
        resizeObserver = new ResizeObserver(performResize);
        resizeObserver.observe(containerEl.value);
        nextTick(performResize);
    } else {
        nextTick(setupCanvasAndObserver);
    }
};
onMounted(setupCanvasAndObserver);
onUnmounted(() => {
    if (resizeObserver && containerEl.value) resizeObserver.unobserve(containerEl.value);
    if (resizeObserver) resizeObserver.disconnect();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
canvas { display: block; }
</style>