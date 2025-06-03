<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="handleCloseModal"
  >
    <div class="bg-white p-6 rounded-lg shadow-2xl w-full max-w-[1650px] h-[calc(100vh-80px)] flex flex-col text-black">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-2xl font-bold text-pink-500"># 我的調色盤</h3>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-4"> <span class="text-green-400"> </span>
            <Icon class="text-2xl sm:text-4xl text-black" icon="material-symbols:timer-rounded" />
            <div class="text-2xl font-semibold bg-pink-500 text-white px-4 py-2 rounded-lg shadow-md">
              {{ timeLeft }}
            </div>
          </div>
          <button @click="handleCloseModal" class="p-2 cursor-pointer" title="Close Palette">
            <Icon icon="mdi:close" class="text-2xl text-black" />
          </button>
        </div>
      </div>

      <div class="flex-grow flex gap-4 overflow-hidden">
        <aside class="w-1/12 h-full flex-shrink-0 flex flex-col gap-4 px-2 py-4 bg-gray-200 rounded-lg shadow-md">
          <div class="flex flex-col gap-2 items-center flex-shrink-0">
            <h4 class="text-md font-semibold text-center text-black">預覽</h4>
            <div
              class="w-16 h-16 mx-auto rounded-md border-2 cursor-pointer"
              :style="{ backgroundColor: pickedColorForPreview || '#f0f0f0', borderColor: pickedColorForPreview ? 'black' : 'gray' }"
              title="Preview (move mouse on canvas to see color). Click to add this color."
              @click="addPickedColorToMainPalette"
            >
            </div>
            <span v-if="!pickedColorForPreview" class="text-xs text-gray-500 flex items-center justify-center h-8 text-center p-1">Hover on canvas</span>
            <span v-else class="text-xs text-gray-700 text-center p-1 h-8 break-all">{{ pickedColorForPreview }}</span>
          </div>

          <div class="flex-grow overflow-y-auto space-y-2 pr-1 flex flex-col items-center custom-scrollbar">
            <div
              v-for="color in availableColors"
              :key="color.id"
              :style="{ backgroundColor: color.hex }"
              class="w-10 h-10 rounded-md cursor-grab border border-gray-400 hover:opacity-80 flex-shrink-0"
              draggable="true"
              @dragstart="handleDragStart(color.hex, color.type, $event)"
              :title="color.name || color.hex"
            ></div>
          </div>
          
          <div class="h-0.5 w-full bg-gray-300"></div>

          <div
            class="mt-auto flex-shrink-0 flex justify-center items-center p-2"
            @dragover.prevent
            @drop="handleDropOnTrash"
            @click="clearPaletteCanvas"
            title="Drag custom color here to remove. Click to clear this palette's canvas."
          >
            <Icon icon="famicons:trash-bin" class="text-3xl text-gray-500 hover:text-pink-500 cursor-pointer" />
          </div>
        </aside>

        <main class="w-5/12 flex-grow flex justify-center items-center bg-gray-200 rounded-lg overflow-hidden relative">
          <canvas
            ref="paletteCanvasRef"
            width="512"
            height="512"
            class="border border-gray-600 bg-white"
            :style="{ cursor: 'cell' }"
            @dragover.prevent
            @drop="handleDropOnCanvas"
            @mousedown="handleCanvasMouseDown"
            @mousemove="handleCanvasMouseMoveForPreview"
            @mouseleave="clearPreviewOnMouseLeave"
          ></canvas>
        </main>

        <aside class="w-5/12 flex-shrink-0 flex flex-col items-center p-2 bg-gray-200 rounded-lg shadow-md">
          <h4 class="text-lg font-bold text-center text-blue-500 mb-2">目標圖片</h4>
          <div 
            class="w-full aspect-square max-w-[512px] rounded flex items-center justify-center overflow-hidden bg-gray-700"
          >
            <img
              v-if="targetImageSrc"
              :src="targetImageSrc"
              alt="Reference Image"
              class="w-full h-full object-contain"
            />
            <span v-else class="text-gray-400 p-4 text-center">找不到圖片或圖片載入中...</span>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  timeLeft: Number,
  show: Boolean,
  basicColors: { type: Array, default: () => [] },
  currentMixedColors: { type: Array, default: () => [] },
  targetImageSrc: { type: String, default: '' }
});

const emit = defineEmits(['close', 'add-custom-color', 'remove-custom-color']);

const paletteCanvasRef = ref(null);
const ctx = ref(null);
const pickedColorForPreview = ref('');

const availableColors = computed(() => {
  const colors = [];
  props.basicColors.forEach(c => colors.push({ ...c, type: 'basic', id: `basic-${c.hex}` }));
  props.currentMixedColors.forEach((hex, index) => {
    if (!colors.find(existing => existing.hex === hex && existing.type === 'mixed')) {
      colors.push({ name: `Mixed (${hex.slice(0,7)})`, hex, type: 'mixed', id: `mixed-${hex}-${index}` });
    }
  });
  return colors;
});

const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 };
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
};

const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const averageRgb = (rgb1, rgb2) => ({
  r: Math.floor((rgb1.r + rgb2.r) / 2),
  g: Math.floor((rgb1.g + rgb2.g) / 2),
  b: Math.floor((rgb1.b + rgb2.b) / 2)
});

const initializeCanvas = (clearPicked = true) => {
  if (paletteCanvasRef.value) {
    ctx.value = paletteCanvasRef.value.getContext('2d', { willReadFrequently: true });
    if (ctx.value) {
      ctx.value.fillStyle = '#FFFFFF';
      ctx.value.fillRect(0, 0, paletteCanvasRef.value.width, paletteCanvasRef.value.height);
      if (clearPicked) {
        pickedColorForPreview.value = '';
      }
    } else {
      console.error("Failed to get 2D context for palette canvas.");
    }
  }
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      initializeCanvas();
    });
  }
}, { immediate: true });

const draggedColorData = ref(null);

const handleDragStart = (colorHex, colorType, event) => {
  draggedColorData.value = { hex: colorHex, type: colorType };
  event.dataTransfer.setData('text/plain', colorHex);
  event.dataTransfer.effectAllowed = 'copyMove';
};

const handleDropOnCanvas = (event) => {
  event.preventDefault();
  if (!ctx.value) {
    console.warn("Palette canvas context not available for drop operation.");
    initializeCanvas();
    if (!ctx.value) return;
  }
  const droppedColorHex = event.dataTransfer.getData('text/plain');
  if (!droppedColorHex) return;

  const rect = paletteCanvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  drawMixedCircle(x, y, 128, droppedColorHex);
};

const drawMixedCircle = (centerX, centerY, diameter, newColorHex) => {
  if (!ctx.value) return;
  const radius = diameter / 2;
  const newColorRgb = hexToRgb(newColorHex);

  const startX = Math.max(0, Math.floor(centerX - radius));
  const startY = Math.max(0, Math.floor(centerY - radius));
  const endX = Math.min(paletteCanvasRef.value.width, Math.ceil(centerX + radius));
  const endY = Math.min(paletteCanvasRef.value.height, Math.ceil(centerY + radius));
  const BBoxWidth = endX - startX;
  const BBoxHeight = endY - startY;

  if (BBoxWidth <= 0 || BBoxHeight <= 0) return;

  const imageData = ctx.value.getImageData(startX, startY, BBoxWidth, BBoxHeight);
  const data = imageData.data;

  for (let j = 0; j < BBoxHeight; j++) {
    for (let i = 0; i < BBoxWidth; i++) {
      const canvasPx = startX + i;
      const canvasPy = startY + j;
      const dx = canvasPx - centerX;
      const dy = canvasPy - centerY;

      if (dx * dx + dy * dy <= radius * radius) {
        const pixelIndex = (j * BBoxWidth + i) * 4;
        const currentRgb = { r: data[pixelIndex], g: data[pixelIndex + 1], b: data[pixelIndex + 2] };
        let finalRgb;
        if (currentRgb.r === 255 && currentRgb.g === 255 && currentRgb.b === 255) {
          finalRgb = newColorRgb;
        } else {
          finalRgb = averageRgb(currentRgb, newColorRgb);
        }
        data[pixelIndex] = finalRgb.r;
        data[pixelIndex + 1] = finalRgb.g;
        data[pixelIndex + 2] = finalRgb.b;
      }
    }
  }
  ctx.value.putImageData(imageData, startX, startY);
};

const handleCanvasMouseDown = (event) => {
  if (!ctx.value || event.button !== 0) return;
  const rect = paletteCanvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const pixelData = ctx.value.getImageData(x, y, 1, 1).data;
  const clickedHex = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
  
  pickedColorForPreview.value = clickedHex;

  if (clickedHex && clickedHex.toUpperCase() !== '#FFFFFF') {
    emit('add-custom-color', clickedHex);
  }
};

const handleCanvasMouseMoveForPreview = (event) => {
    if (!ctx.value || !paletteCanvasRef.value) return;
    
    const rect = paletteCanvasRef.value.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    if (canvasX >= 0 && canvasX < paletteCanvasRef.value.width && canvasY >= 0 && canvasY < paletteCanvasRef.value.height) {
        const pixelData = ctx.value.getImageData(canvasX, canvasY, 1, 1).data;
        pickedColorForPreview.value = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
    }
};



const addPickedColorToMainPalette = () => {
  if (pickedColorForPreview.value && pickedColorForPreview.value.toUpperCase() !== '#FFFFFF') {
    emit('add-custom-color', pickedColorForPreview.value);
  }
};

const handleCloseModal = () => {
  emit('close');
};

const handleDropOnTrash = (event) => {
  event.preventDefault();
  if (draggedColorData.value && draggedColorData.value.type === 'mixed') {
    emit('remove-custom-color', draggedColorData.value.hex);
  }
  draggedColorData.value = null;
};

const clearPaletteCanvas = () => {
  initializeCanvas(false);
};

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #9ca3af;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background-color: #e5e7eb;
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #9ca3af #e5e7eb;
}
</style>