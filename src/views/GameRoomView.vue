<template>
  <div class="min-h-screen text-white flex flex-col items-center bg-gray-100">
    <header class="w-full max-w-7xl mb-6 flex justify-between items-center pt-4 px-4 lg:px-0">
      <div class="text-2xl font-bold text-black">
        Room <span class="text-pink-500"># {{ roomId }}</span>
      </div>
      <div class="flex items-center gap-4">
        <Icon class="text-2xl sm:text-4xl text-black" icon="material-symbols:timer-rounded" />
        <div class="text-2xl font-semibold bg-pink-500 text-white px-4 py-2 rounded-lg shadow-md">
          {{ timeLeft }} 
        </div>
      </div>
    </header>

    <main class="w-full max-w-7xl flex flex-col lg:flex-row gap-6 px-4 lg:px-0">
      <section class="flex-grow lg:w-2/3 bg-white p-6 rounded-lg shadow-xl flex flex-col gap-4">
        <div class="relative flex justify-center items-center mb-6">
          <div class="absolute top-0 left-0 flex flex-col items-center p-1 sm:p-4 gap-3 sm:gap-6 h-full bg-gray-50 rounded-l-lg shadow-md">
            <button
              class="cursor-pointer hover:scale-105 transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleUndo"
              :disabled="!undoRedoState.canUndo"
              title="Undo (Ctrl+Z)"
            >
              <Icon class="text-2xl sm:text-3xl text-gray-700 hover:text-blue-500" icon="icon-park-solid:back" />
            </button>
            <button
              class="cursor-pointer hover:scale-105 transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleRedo"
              :disabled="!undoRedoState.canRedo"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Icon class="text-2xl sm:text-3xl text-gray-700 hover:text-blue-500" icon="icon-park-solid:next" />
            </button>
            <button
              class="cursor-pointer hover:scale-105 transform transition-transform"
              @click="toggleEraser"
              :title="isEraserActive ? 'Switch to Pen' : 'Switch to Eraser'"
            >
              <Icon v-if="isEraserActive" class="text-2xl sm:text-3xl text-gray-600 hover:text-blue-500" icon="streamline:pen-draw-solid" />
              <Icon v-else class="text-2xl sm:text-3xl text-gray-600 hover:text-pink-500" icon="bi:eraser-fill" />
            </button>
            <div class="flex flex-col items-center gap-2 mt-2">
              <div class="flex flex-col items-center">
                <span class="text-xs text-gray-600 mb-1">Brush</span>
                <span class="text-xs text-gray-600 mb-1">Size</span>
              </div>
              <div class="flex flex-col gap-3 items-center">
                <button
                  v-for="size in brushDisplaySizes"
                  :key="`brush-btn-${size.value}`"
                  @click="setBrushSize(size.value)"
                  :style="{
                    width: size.displayPx + 'px',
                    height: size.displayPx + 'px',
                    backgroundColor: currentBrushSize === size.value ? (isEraserActive ? '#FFFFFF' : selectedColor) : '#E5E7EB'
                  }"
                  :class="{
                    'ring-2 ring-offset-2 ring-offset-gray-50': currentBrushSize === size.value,
                    'ring-pink-500': currentBrushSize === size.value && isEraserActive,
                    'ring-blue-500': currentBrushSize === size.value && !isEraserActive,
                  }"
                  class="rounded-full transition-all flex items-center justify-center hover:opacity-80 cursor-pointer border border-gray-400"
                  :title="`Brush size: ${size.label}`"
                  >
                </button>
              </div>
            </div>
            <button
              class="cursor-pointer hover:scale-105 transform transition-transform mt-auto"
              @click="clearUserCanvas"
              title="Clear Canvas"
            >
              <Icon class="text-2xl sm:text-3xl text-gray-700 hover:text-pink-500" icon="ic:baseline-delete" />
            </button>
          </div>

          <div class="relative">
            <CanvasComponent
              ref="drawingCanvasRef"
              :canvas-width="512"
              :canvas-height="512"
              :grid-resolution-x="64"
              :grid-resolution-y="64"
              :color="selectedColor"
              :brush-size="currentBrushSize"
              :is-eraser="isEraserActive"
              background-color="#FFFFFF"
              @drawing-end="updateUndoRedoState"
            />
            
            <img
              v-if="showImageOverlay && targetImageSrc"
              :src="targetImageSrc"
              alt="Overlay"
              class="absolute top-0 left-0 w-full h-full object-contain opacity-50 pointer-events-none"
            />
          </div>

          <div class="absolute top-0 right-0 flex flex-col items-center p-1 sm:p-4 gap-3 h-full bg-gray-50 rounded-r-lg shadow-md overflow-hidden">
            <button
              class="cursor-pointer hover:scale-105 transform transition-transform"
              @click="toggleImageOverlay"
              title="Toggle Target Image Overlay"
            >
              <Icon class="text-2xl sm:text-3xl" :class="showImageOverlay ? 'text-blue-500' : 'text-gray-700 hover:text-blue-500'" icon="mdi:image" />
            </button>
            <button
              class="cursor-pointer hover:scale-105 transform transition-transform"
              @click="showColorMixerModal = true"
              title="Palette"
            >
              <Icon class="text-2xl sm:text-3xl text-gray-700 hover:text-pink-500" icon="mdi:palette" />
            </button>

            <div class="w-full h-0.5 bg-gray-200 my-1"></div>

            <div class="flex-grow overflow-y-auto gap-3 pt-2 w-[50px] sm:w-[60px] flex flex-col items-center">
              <button
                v-for="color in basicColors"
                :key="color.name"
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-md border border-gray-300 cursor-pointer focus:outline-none focus:ring-offset-1 focus:ring-offset-gray-50 shrink-0"
                :style="{ backgroundColor: color.hex }"
                :class="selectedColor === color.hex && !isEraserActive ? 'ring-2 ring-blue-500' : 'hover:opacity-70'"
                :title="color.name"
                @click="selectColor(color.hex)"
              ></button>
              <button
                v-for="(color, index) in mixedColors"
                :key="`mixed-${index}-${color}`"
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-md border border-gray-300 cursor-pointer focus:outline-none focus:ring-offset-1 focus:ring-offset-gray-50 shrink-0"
                :style="{ backgroundColor: color }"
                :class="selectedColor === color && !isEraserActive ? 'ring-2 ring-blue-500' : 'hover:opacity-70'"
                title="Mixed Color"
                @click="selectColor(color)"
              ></button>
            </div>
          </div>
        </div>
      </section>

      <aside class="lg:w-1/3 bg-gray-700 p-6 rounded-lg shadow-xl space-y-8">
        <div>
          <h2 class="text-2xl font-semibold mb-4 text-center text-white">Target Image</h2>
          <div class="w-full aspect-square bg-gray-600 border-2 border-black rounded-md flex items-center justify-center overflow-hidden">
            <img
              v-if="targetImageSrc"
              :src="targetImageSrc"
              alt="Target Image"
              class="w-full h-full object-cover" >
            <span v-else class="text-gray-400 text-sm">Loading target image...</span>
          </div>
        </div>

        <div>
          <h2 class="text-2xl font-semibold mb-6 text-center text-green-300">Other Players</h2>
          <div class="space-y-6">
            <div v-for="player in otherPlayers" :key="player.id" class="bg-gray-600 p-4 rounded-lg shadow-md">
              <h3 class="text-lg font-medium mb-2 text-green-400">{{ player.name }}</h3>
              <div class="w-full aspect-square bg-gray-200 border-2 border-green-500 rounded-md flex items-center justify-center text-gray-500 text-sm">
                (Player {{ player.name }}'s canvas)
              </div>
            </div>
            <div v-if="otherPlayers.length === 0" class="text-center text-gray-400">
              Waiting for other players...
            </div>
          </div>
        </div>
      </aside>
    </main>

    <PaletteComponent
      :show="showColorMixerModal"
      :basic-colors="basicColors"
      :current-mixed-colors="mixedColors"
      @close="showColorMixerModal = false"
      @new-color-mixed="handleNewMixedColor"
    />
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue';
import CanvasComponent from '../components/Canvas.vue';
import PaletteComponent from '../components/Palette.vue';

const roomId = ref('RD13');
const timeLeft = ref(180);
const timerInterval = ref(null);
const drawingCanvasRef = ref(null);

const basicColors = reactive([
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Blue', hex: '#0000FF' }
]);
const mixedColors = reactive([]);
const selectedColor = ref(basicColors[0].hex);

const otherPlayers = reactive([
  // { id: 'player2', name: 'Van Gogh', canvasData: null },
  // { id: 'player3', name: 'Picasso', canvasData: null },
]);

const currentBrushSize = ref(1);
const brushDisplaySizes = [
  { value: 1, label: 'Small', displayPx: 16 },
  { value: 2, label: 'Medium', displayPx: 24 },
  { value: 4, label: 'Large', displayPx: 30 }
];
const isEraserActive = ref(false);
const targetImageSrc = ref(`https://picsum.photos/seed/${roomId.value || 'defaultTarget'}/512/512`);

const showImageOverlay = ref(false);

const undoRedoState = reactive({
    canUndo: false,
    canRedo: false
});

const updateUndoRedoState = async (state) => {
    await nextTick();
    if (drawingCanvasRef.value) {
        undoRedoState.canUndo = drawingCanvasRef.value.canUndo;
        undoRedoState.canRedo = drawingCanvasRef.value.canRedo;
    } else if (state) {
        undoRedoState.canUndo = state.canUndo;
        undoRedoState.canRedo = state.canRedo;
    }
};

const handleUndo = () => {
  if (drawingCanvasRef.value && undoRedoState.canUndo) {
    drawingCanvasRef.value.undo();
  }
};

const handleRedo = () => {
  if (drawingCanvasRef.value && undoRedoState.canRedo) {
    drawingCanvasRef.value.redo();
  }
};

const clearUserCanvas = () => {
  if (drawingCanvasRef.value) {
    drawingCanvasRef.value.clearCanvas();
  }
};

const setBrushSize = (sizeValue) => {
  currentBrushSize.value = sizeValue;
};

const toggleEraser = () => {
  isEraserActive.value = !isEraserActive.value;
};

const toggleImageOverlay = () => {
  showImageOverlay.value = !showImageOverlay.value;
};

const showColorMixerModal = ref(false);

const selectColor = (colorHex) => {
  selectedColor.value = colorHex;
  if (isEraserActive.value) {
      isEraserActive.value = false;
  }
};

const handleNewMixedColor = (newColor) => {
  if (newColor && !mixedColors.includes(newColor)) {
    mixedColors.push(newColor);
    selectColor(newColor);
  }
  showColorMixerModal.value = false;
};

const startTimer = () => {
  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      clearInterval(timerInterval.value);
      console.log("Game Over!");
    }
  }, 1000);
};

const handleKeyDown = (event) => {
  const isMac = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
  const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

  if (showColorMixerModal.value || ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) {
      return;
  }

  if (ctrlOrCmd && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    if (event.shiftKey) {
      handleRedo();
    } else {
      handleUndo();
    }
  }
};

onMounted(async () => {
  startTimer();
  window.addEventListener('keydown', handleKeyDown);
  await nextTick();
  if (drawingCanvasRef.value) {
    updateUndoRedoState({
        canUndo: drawingCanvasRef.value.canUndo,
        canRedo: drawingCanvasRef.value.canRedo
    });
  }
});

onUnmounted(() => {
  clearInterval(timerInterval.value);
  window.removeEventListener('keydown', handleKeyDown);
});

</script>

<style scoped>
.aspect-square {
  aspect-ratio: 1 / 1;
}

/* .overflow-y-auto::-webkit-scrollbar { width: 6px; } */
/* .overflow-y-auto::-webkit-scrollbar-thumb { background-color: #9ca3af; border-radius: 3px;} */
/* .overflow-y-auto::-webkit-scrollbar-track { background-color: #e5e7eb; } */
</style>