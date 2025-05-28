<template>
  <canvas
    ref="canvasElement"
    :width="canvasWidth"
    :height="canvasHeight"
    :style="{ cursor: dynamicCursor }"
    class="border-2 border-black rounded-md shadow-inner bg-white"
    @mousedown="handleMouseDown"
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

const emit = defineEmits(['drawingEnd']);

const canvasElement = ref(null);
const ctx = ref(null);
const isDrawing = ref(false);
const lastGridPos = ref({ x: -1, y: -1 });

const historyStack = ref([]);
const currentHistoryIndex = ref(-1);
const MAX_HISTORY_STATES = 50;

const pixelSizeX = computed(() => props.canvasWidth / props.gridResolutionX);
const pixelSizeY = computed(() => props.canvasHeight / props.gridResolutionY);

const dynamicCursor = computed(() => {
  if (props.isEraser) {
    return 'cell';
  }
  return 'crosshair';
});

onMounted(async () => {
  if (canvasElement.value) {
    ctx.value = canvasElement.value.getContext('2d', { willReadFrequently: true });
    await nextTick();
    clearCanvasAndSaveInitialState();
  }
});

const saveState = () => {
  if (!ctx.value) return;
  if (currentHistoryIndex.value < historyStack.value.length - 1) {
    historyStack.value.splice(currentHistoryIndex.value + 1);
  }
  const imageData = ctx.value.getImageData(0, 0, props.canvasWidth, props.canvasHeight);
  historyStack.value.push(imageData);
  if (historyStack.value.length > MAX_HISTORY_STATES) {
    historyStack.value.shift();
  } else {
    currentHistoryIndex.value++;
  }
  if (currentHistoryIndex.value >= historyStack.value.length) {
      currentHistoryIndex.value = historyStack.value.length -1;
  }
  emit('drawingEnd', { canUndo: canUndo.value, canRedo: canRedo.value });
};

const restoreState = (index) => {
  if (!ctx.value || index < 0 || index >= historyStack.value.length) return;
  ctx.value.putImageData(historyStack.value[index], 0, 0);
};

const undo = () => {
  if (canUndo.value) {
    currentHistoryIndex.value--;
    restoreState(currentHistoryIndex.value);
    emit('drawingEnd', { canUndo: canUndo.value, canRedo: canRedo.value });
  }
};

const redo = () => {
  if (canRedo.value) {
    currentHistoryIndex.value++;
    restoreState(currentHistoryIndex.value);
    emit('drawingEnd', { canUndo: canUndo.value, canRedo: canRedo.value });
  }
};

const canUndo = computed(() => currentHistoryIndex.value > 0);
const canRedo = computed(() => currentHistoryIndex.value < historyStack.value.length - 1);

const getGridCoordinates = (eventClientX, eventClientY) => {
  if (!canvasElement.value) return { x: 0, y: 0 };
  const rect = canvasElement.value.getBoundingClientRect();
  const x = eventClientX - rect.left;
  const y = eventClientY - rect.top;
  return {
    x: Math.floor(x / pixelSizeX.value),
    y: Math.floor(y / pixelSizeY.value),
  };
};

const drawCell = (gridX, gridY, colorToUse, size) => {
  if (!ctx.value) return;
  const offset = Math.floor((size -1) / 2);
  const startDrawX = gridX - offset;
  const startDrawY = gridY - offset;
  ctx.value.fillStyle = colorToUse;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const currentCellX = startDrawX + i;
      const currentCellY = startDrawY + j;
      if (currentCellX >= 0 && currentCellX < props.gridResolutionX && currentCellY >= 0 && currentCellY < props.gridResolutionY) {
        ctx.value.fillRect(
          currentCellX * pixelSizeX.value,
          currentCellY * pixelSizeY.value,
          pixelSizeX.value,
          pixelSizeY.value
        );
      }
    }
  }
};

const drawLine = (x0, y0, x1, y1, colorToUse, size) => {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 1 : -1;
  const sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;

  let currentX = x0;
  let currentY = y0;

  while (true) {
    drawCell(currentX, currentY, colorToUse, size);
    if ((currentX === x1) && (currentY === y1)) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; currentX += sx; }
    if (e2 < dx) { err += dx; currentY += sy; }
  }
};

const globalMouseMoveHandler = (event) => {
  if (!isDrawing.value) return;
  const { clientX, clientY } = event;
  const currentGridPos = getGridCoordinates(clientX, clientY);
  const colorToUse = props.isEraser ? props.backgroundColor : props.color;
  if (lastGridPos.value.x !== -1 && (lastGridPos.value.x !== currentGridPos.x || lastGridPos.value.y !== currentGridPos.y)) {
    drawLine(lastGridPos.value.x, lastGridPos.value.y, currentGridPos.x, currentGridPos.y, colorToUse, props.brushSize);
  } else if (lastGridPos.value.x === -1 || (lastGridPos.value.x === currentGridPos.x && lastGridPos.value.y === currentGridPos.y)) {
    drawCell(currentGridPos.x, currentGridPos.y, colorToUse, props.brushSize);
  }
  lastGridPos.value = currentGridPos;
};

const globalMouseUpHandler = () => {
  if (isDrawing.value) {
    isDrawing.value = false;
    lastGridPos.value = { x: -1, y: -1 };
    saveState();
  }
  window.removeEventListener('mousemove', globalMouseMoveHandler);
  window.removeEventListener('mouseup', globalMouseUpHandler);
};


const handleMouseDown = (event) => {
  if (event.button !== 0) return;
  isDrawing.value = true;
  const { clientX, clientY } = event;
  const currentGridPos = getGridCoordinates(clientX, clientY);
  const colorToUse = props.isEraser ? props.backgroundColor : props.color;
  drawCell(currentGridPos.x, currentGridPos.y, colorToUse, props.brushSize);
  lastGridPos.value = currentGridPos;
  window.addEventListener('mousemove', globalMouseMoveHandler);
  window.addEventListener('mouseup', globalMouseUpHandler);
};


const clearCanvas = () => {
  if (ctx.value && canvasElement.value) {
    ctx.value.fillStyle = props.backgroundColor;
    ctx.value.fillRect(0, 0, props.canvasWidth, props.canvasHeight);
  }
};

const clearCanvasAndSaveInitialState = () => {
  clearCanvas();
  nextTick(() => {
    historyStack.value = [];
    currentHistoryIndex.value = -1;
    saveState();
  });
};


watch(() => [props.backgroundColor, props.canvasWidth, props.canvasHeight, props.gridResolutionX, props.gridResolutionY], () => {
    if(ctx.value) {
        clearCanvasAndSaveInitialState();
    }
}, { deep: true });

defineExpose({
  clearCanvas: clearCanvasAndSaveInitialState,
  getCanvasDataURL: () => canvasElement.value ? canvasElement.value.toDataURL() : null,
  undo,
  redo,
  canUndo,
  canRedo
});

</script>