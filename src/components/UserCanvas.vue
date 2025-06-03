<template>
  <canvas
    ref="canvasElement"
    :width="canvasWidth"
    :height="canvasHeight"
    :style="{ cursor: dynamicCursor }"
    class="border-2 border-black rounded-md shadow-inner bg-white"
    @mousedown="handleMouseDown"
    @mousemove="handleGlobalMouseMove"
    @mouseup="handleGlobalMouseUp"
    @mouseleave="handleCanvasMouseLeave"
    @contextmenu.prevent
  ></canvas>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue';

const props = defineProps({
  canvasWidth: { type: Number, default: 512 },
  canvasHeight: { type: Number, default: 512 },
  gridResolutionX: { type: Number, default: 64 },
  gridResolutionY: { type: Number, default: 64 },
  color: { type: String, default: '#000000' },
  brushSize: { type: Number, default: 1 },
  isEraser: { type: Boolean, default: false },
  backgroundColor: { type: String, default: '#FFFFFF' },
});

const emit = defineEmits([
    'drawing-end',
    'stroke-emitted'
]);

const canvasElement = ref(null);
const ctx = ref(null);
const isDrawing = ref(false);
const currentPathPoints = ref([]);
const lastGridPos = ref(null);

const historyStack = ref([]);
const currentHistoryIndex = ref(-1);
const MAX_HISTORY_STATES = 50;

const pixelSizeX = computed(() => props.canvasWidth / props.gridResolutionX);
const pixelSizeY = computed(() => props.canvasHeight / props.gridResolutionY);
const dynamicCursor = computed(() => props.isEraser ? 'cell' : 'crosshair');

const getGridCoordinates = (eventClientX, eventClientY) => {
  if (!canvasElement.value) return { x: 0, y: 0 };
  const rect = canvasElement.value.getBoundingClientRect();
  const x = Math.max(0, Math.min(eventClientX - rect.left, props.canvasWidth -1));
  const y = Math.max(0, Math.min(eventClientY - rect.top, props.canvasHeight -1));
  return {
    x: Math.floor(x / pixelSizeX.value),
    y: Math.floor(y / pixelSizeY.value),
  };
};

const drawCellOnLocalContext = (gridX, gridY, colorToUse, size) => {
  if (!ctx.value) return;
  const offset = Math.floor((size - 1) / 2);
  const startDrawX = gridX - offset;
  const startDrawY = gridY - offset;
  ctx.value.fillStyle = colorToUse;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const cX = startDrawX + i;
      const cY = startDrawY + j;
      if (cX >= 0 && cX < props.gridResolutionX && cY >= 0 && cY < props.gridResolutionY) {
        ctx.value.fillRect(cX * pixelSizeX.value, cY * pixelSizeY.value, pixelSizeX.value, pixelSizeY.value);
      }
    }
  }
};
const drawLineOnLocalContext = (x0, y0, x1, y1, colorToUse, size) => {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, e2;
    let currentX = x0;
    let currentY = y0;
    while (true) {
        drawCellOnLocalContext(currentX, currentY, colorToUse, size);
        recordPointToCurrentPath(currentX, currentY);
        if (currentX === x1 && currentY === y1) break;
        e2 = 2 * err;
        if (e2 >= dy) { err += dy; currentX += sx; }
        if (e2 <= dx) { err += dx; currentY += sy; }
    }
};

const recordPointToCurrentPath = (gridX, gridY) => {
  const lastRecordedPoint = currentPathPoints.value[currentPathPoints.value.length - 1];
  if (!lastRecordedPoint || lastRecordedPoint.x !== gridX || lastRecordedPoint.y !== gridY) {
    currentPathPoints.value.push({ x: gridX, y: gridY, timestamp: Date.now() });
  }
};

const saveStateToHistory = () => {
  if (!ctx.value) return;
  if (currentHistoryIndex.value < historyStack.value.length - 1) {
    historyStack.value.splice(currentHistoryIndex.value + 1);
  }
  historyStack.value.push(ctx.value.getImageData(0, 0, props.canvasWidth, props.canvasHeight));
  if (historyStack.value.length > MAX_HISTORY_STATES) {
    historyStack.value.shift();
  }
  currentHistoryIndex.value = historyStack.value.length - 1;
  emit('drawing-end', { canUndo: canUndoState.value, canRedo: canRedoState.value });
};

const restoreStateFromHistory = (index) => {
  if (!ctx.value || index < 0 || index >= historyStack.value.length) return;
  ctx.value.putImageData(historyStack.value[index], 0, 0);
  currentHistoryIndex.value = index;
  emit('drawing-end', { canUndo: canUndoState.value, canRedo: canRedoState.value });
};

const undo = () => {
  if (canUndoState.value) {
    restoreStateFromHistory(currentHistoryIndex.value - 1);
  }
};

const redo = () => {
  if (canRedoState.value) {
    restoreStateFromHistory(currentHistoryIndex.value + 1);
  }
};

const canUndoState = computed(() => currentHistoryIndex.value > 0);
const canRedoState = computed(() => currentHistoryIndex.value < historyStack.value.length - 1);

const getCanvasDataURL = () => {
  if (canvasElement.value) {
    return canvasElement.value.toDataURL('image/png');
  }
  console.error("UserCanvas: Canvas element not available for getCanvasDataURL.");
  return null;
};

const handleMouseDown = (event) => {
  if (event.button !== 0 || !ctx.value) return;
  isDrawing.value = true;
  currentPathPoints.value = [];
  
  const currentGridPos = getGridCoordinates(event.clientX, event.clientY);
  const colorToUse = props.isEraser ? props.backgroundColor : props.color;
  
  drawCellOnLocalContext(currentGridPos.x, currentGridPos.y, colorToUse, props.brushSize);
  recordPointToCurrentPath(currentGridPos.x, currentGridPos.y);
  lastGridPos.value = currentGridPos;

  window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
  window.addEventListener('mouseup', handleGlobalMouseUp, { passive: false });
};

const handleGlobalMouseMove = (event) => {
  if (!isDrawing.value || !ctx.value) return;
  event.preventDefault();
  const currentGridPos = getGridCoordinates(event.clientX, event.clientY);
  
  if (lastGridPos.value && (lastGridPos.value.x !== currentGridPos.x || lastGridPos.value.y !== currentGridPos.y)) {
    const colorToUse = props.isEraser ? props.backgroundColor : props.color;
    drawLineOnLocalContext(lastGridPos.value.x, lastGridPos.value.y, currentGridPos.x, currentGridPos.y, colorToUse, props.brushSize);
    lastGridPos.value = currentGridPos;
  } else if (!lastGridPos.value) {
    lastGridPos.value = currentGridPos;
  }
};

const finishCurrentStroke = () => {
    if (currentPathPoints.value.length > 0) {
        const strokeData = {
            color: props.isEraser ? props.backgroundColor : props.color,
            brushSize: props.brushSize,
            isEraser: props.isEraser,
            path: [...currentPathPoints.value],
            operationType: 'draw'
        };
        emit('stroke-emitted', strokeData);
    }
    currentPathPoints.value = [];
    saveStateToHistory();
};

const handleGlobalMouseUp = () => {
  if (isDrawing.value) {
    finishCurrentStroke();
    isDrawing.value = false;
  }
  lastGridPos.value = null;
  window.removeEventListener('mousemove', handleGlobalMouseMove);
  window.removeEventListener('mouseup', handleGlobalMouseUp);
};

const handleCanvasMouseLeave = () => {
    if (isDrawing.value) {
        finishCurrentStroke();
        isDrawing.value = false;
        lastGridPos.value = null;
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
};

const clearLocalCanvas = () => {
    if (ctx.value) {
        ctx.value.fillStyle = props.backgroundColor;
        ctx.value.fillRect(0, 0, props.canvasWidth, props.canvasHeight);
    }
};

const clearCanvasAndSaveInitialState = () => {
  clearLocalCanvas();
  nextTick(() => {
    historyStack.value = [];
    currentHistoryIndex.value = -1;
    saveStateToHistory();
  });
};

const clearCanvas = () => {
  clearLocalCanvas();
  saveStateToHistory();

  emit('stroke-emitted', {
    operationType: 'clearCanvasUpdate',
    path: [],
    operationTimestamp: Date.now(),
    color: props.backgroundColor,
    brushSize: 1,
    isEraser: true
  });
};

onMounted(async () => {
  if (canvasElement.value) {
    ctx.value = canvasElement.value.getContext('2d', { willReadFrequently: true });
    await nextTick();
    clearCanvasAndSaveInitialState();
  }
});

watch(() => [props.backgroundColor, props.canvasWidth, props.canvasHeight, props.gridResolutionX, props.gridResolutionY], 
  () => {
    if(ctx.value && canvasElement.value) {
        clearCanvasAndSaveInitialState();
    }
  }, 
  { deep: true }
);

defineExpose({ clearCanvas, undo, redo, canUndoState, canRedoState, getCanvasDataURL });
</script>