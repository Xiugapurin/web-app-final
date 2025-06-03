<template>
  <div class="min-h-screen text-black flex flex-col items-center bg-gray-100">
    <header class="w-full max-w-7xl mb-6 flex justify-between items-center pt-4 px-4 lg:px-0">
      <div class="text-2xl font-bold text-black">
        房間 <span class="text-pink-500">#{{ gameStore.roomId ? gameStore.roomId.substring(0, 4).toUpperCase() : 'N/A' }}</span>
      </div>
      <div class="flex items-center gap-4">
        <Icon class="text-2xl sm:text-4xl text-black" icon="material-symbols:timer-rounded" />
        <div class="text-2xl font-semibold bg-pink-500 text-white px-4 py-2 rounded-lg shadow-md">
          {{ localTimeLeft }}
        </div>
      </div>
    </header>

    <main class="w-full max-w-7xl flex flex-col lg:flex-row gap-6 px-4 lg:px-0">
      <section class="flex-grow lg:w-2/3 bg-white p-6 rounded-lg shadow-xl flex flex-col gap-4">
        <div class="relative flex justify-center items-center mb-6">
          <div class="absolute top-0 left-0 flex flex-col items-center p-1 sm:p-4 gap-3 sm:gap-6 h-full bg-gray-50 rounded-l-lg shadow-md">
            <!-- <button 
              @click="handleUndo" 
              :disabled="!undoRedoUiState.canUndo" 
              title="Undo (Ctrl+Z)" 
              class="p-1 cursor-pointer transform transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon class="text-2xl sm:text-3xl text-gray-700 hover:text-blue-500" icon="icon-park-solid:back" />
            </button>
            <button 
              @click="handleRedo" 
              :disabled="!undoRedoUiState.canRedo" 
              title="Redo (Ctrl+Shift+Z)" 
              class="p-1 cursor-pointer transform transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon class="text-2xl sm:text-3xl text-gray-700 hover:text-blue-500" icon="icon-park-solid:next" />
            </button> -->
            <button 
              @click="toggleEraser" 
              :title="isEraserActive ? 'Switch to Pen' : 'Switch to Eraser'" 
              class="p-1 cursor-pointer transform transition-transform hover:scale-105"
            >
              <Icon v-if="isEraserActive" class="text-2xl sm:text-3xl text-gray-700 hover:text-blue-500" icon="streamline:pen-draw-solid" />
              <Icon v-else class="text-2xl sm:text-3xl text-gray-700 hover:text-pink-500" icon="bi:eraser-fill" />
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
                  class="flex h-auto w-auto cursor-pointer items-center justify-center rounded-full border border-gray-400 transition-all hover:opacity-80"
                  :title="`Brush size: ${size.label}`"
                  >
                </button>
              </div>
            </div>
            <button 
              @click="clearUserCanvas" 
              title="Clear Canvas" 
              class="p-1 cursor-pointer transform transition-transform hover:scale-105 mt-auto"
            >
              <Icon class="text-2xl sm:text-3xl text-gray-700 hover:text-pink-500" icon="ic:baseline-delete" />
            </button>
          </div>

          <div class="relative">
            <UserCanvas
              ref="drawingCanvasRef"
              :canvas-width="512"
              :canvas-height="512"
              :grid-resolution-x="64"
              :grid-resolution-y="64"
              :color="selectedColor"
              :brush-size="currentBrushSize"
              :is-eraser="isEraserActive"
              background-color="#FFFFFF"
              @drawing-end="updateUndoRedoUiStateFromEvent"
              @stroke-emitted="handleMyStrokeEmitted"
            />
            <img 
              v-if="showImageOverlay && gameStore.targetImageSrc" 
              :src="gameStore.targetImageSrc" 
              alt="Overlay" 
              class="absolute top-0 left-0 w-full h-full object-contain opacity-20 pointer-events-none"
            />
          </div>

          <div class="absolute top-0 right-0 flex flex-col items-center p-1 sm:p-4 gap-3 h-full bg-gray-50 rounded-r-lg shadow-md overflow-hidden">
            <button 
              @click="toggleImageOverlay" 
              title="Toggle Target Image Overlay" 
              class="p-1 cursor-pointer transform transition-transform hover:scale-105"
            >
              <Icon class="text-2xl sm:text-3xl" :class="showImageOverlay ? 'text-blue-500' : 'text-gray-700 hover:text-blue-500'" icon="mdi:image" />
            </button>
            <button 
              @click="showColorMixerModal = true" 
              title="Palette" 
              class="p-1 cursor-pointer transform transition-transform hover:scale-105"
            >
              <Icon class="text-2xl sm:text-3xl text-gray-700 hover:text-pink-500" icon="mdi:palette" />
            </button>
            <div class="w-full h-0.5 bg-gray-200 my-1"></div>
            <div class="flex-grow overflow-y-auto gap-3 py-2 w-[50px] sm:w-[60px] flex flex-col items-center custom-scrollbar">
              <button
                v-for="colorObj in gameStore.fullColorPalette"
                :key="`palette-${colorObj.hex}`"
                :style="{ backgroundColor: colorObj.hex }"
                :class="selectedColor === colorObj.hex && !isEraserActive ? 'ring-2 ring-blue-500' : 'hover:opacity-70'"
                :title="colorObj.name || colorObj.hex"
                @click="selectColor(colorObj.hex)"
                class="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-gray-300 focus:outline-none focus:ring-offset-1 focus:ring-offset-gray-50 sm:h-9 sm:w-9"
              ></button>
              <button
                v-for="(colorHex, index) in sessionMixedColors"
                :key="`mixed-session-${index}-${colorHex}`"
                :style="{ backgroundColor: colorHex }"
                :class="selectedColor === colorHex && !isEraserActive ? 'ring-2 ring-blue-500' : 'hover:opacity-70'"
                title="Mixed Color (Session)"
                @click="selectColor(colorHex)"
                class="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-gray-300 focus:outline-none focus:ring-offset-1 focus:ring-offset-gray-50 sm:h-9 sm:w-9"
              ></button>
            </div>
          </div>
        </div>
      </section>

      <aside class="flex flex-row lg:flex-col lg:w-1/3 bg-white p-6 gap-6 rounded-lg shadow-xl">
        <div class="flex flex-col w-full">
          <h2 class="text-2xl font-semibold mb-4 text-center text-black">目標圖片</h2>
          <div class="w-full aspect-square border-2 border-black rounded-md flex items-center justify-center overflow-hidden">
            <img
              v-if="gameStore.targetImageSrc"
              :src="gameStore.targetImageSrc"
              alt="Target Image"
              class="w-full h-full object-contain" >
            <span v-else class="text-gray-400 text-sm">圖片載入中...</span>
          </div>
        </div>
        <div class="flex flex-col w-full flex-grow min-h-0">
          <h2 class="text-xl font-semibold mb-4 text-center text-blue-500">
            其他玩家 ({{ opponents.length }})
          </h2>
          <div class="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-2">
            <div v-if="opponents.length === 0" class="text-center text-gray-400 pt-10">等待其他玩家...</div>
            <div v-for="player in opponents" :key="player.id" class="p-1 rounded-lg">
              <h3 class="text-lg mb-1 text-black truncate"><span class="font-bold text-pink-500">{{ player.name }}</span> 的畫布</h3>
              <div class="w-full aspect-square bg-gray-300 border-gray-400 rounded-md">
                <OpponentCanvas
                  :key="`opponent-canvas-${player.id}-${(opponentStrokes[player.id] || []).length}`"
                  :grid-resolution-x="64"
                  :grid-resolution-y="64"
                  :strokes-to-process="opponentStrokes[player.id] || []"
                  :background-color="'#FFFFFF'"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
    <PaletteComponent :timeLeft="localTimeLeft" :show="showColorMixerModal" :basic-colors="gameStore.fullColorPalette" :current-mixed-colors="sessionMixedColors" :target-image-src="gameStore.targetImageSrc" @close="showColorMixerModal = false" @add-custom-color="handleAddNewColorFromPalette" @remove-custom-color="handleRemoveCustomColorFromPalette"/>
    <OpponentDisconnectedModal
        :show="gameStore.showOpponentDisconnectedModal"
        :message="gameStore.opponentDisconnectedInfo.message"
    />
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { ref, reactive, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import UserCanvas from '../components/UserCanvas.vue';
import OpponentCanvas from '../components/OpponentCanvas.vue';
import PaletteComponent from '../components/Palette.vue';
import OpponentDisconnectedModal from '../components/OpponentDisconnectedModal.vue';

const props = defineProps({ roomId: String });
const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();

const localTimeLeft = ref(gameStore.gameDuration || 180);
const timerInterval = ref(null);
const drawingCanvasRef = ref(null);
const sessionMixedColors = reactive([]); 
const selectedColor = ref('#000000');
const currentBrushSize = ref(1);
const brushDisplaySizes = [
  { value: 1, label: 'Small', displayPx: 16 },
  { value: 2, label: 'Medium', displayPx: 24 },
  { value: 4, label: 'Large', displayPx: 30 }
];
const isEraserActive = ref(false);
const showImageOverlay = ref(false);
const showColorMixerModal = ref(false);
const undoRedoUiState = reactive({ canUndo: false, canRedo: false });

const opponents = computed(() => 
  gameStore.playerList.filter(player => player.id !== gameStore.userId)
);

const formattedTimeLeft = computed(() => {
  const minutes = Math.floor(localTimeLeft.value / 60);
  const seconds = localTimeLeft.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const updateUndoRedoUiStateFromEvent = (canvasHistoryState) => {
    undoRedoUiState.canUndo = canvasHistoryState.canUndo;
    undoRedoUiState.canRedo = canvasHistoryState.canRedo;
};

const handleUndo = () => { if (drawingCanvasRef.value) drawingCanvasRef.value.undo(); };
const handleRedo = () => { if (drawingCanvasRef.value) drawingCanvasRef.value.redo(); };
const clearUserCanvas = () => { if (drawingCanvasRef.value) drawingCanvasRef.value.clearCanvas(); };
const setBrushSize = (sizeValue) => { currentBrushSize.value = sizeValue; };
const toggleEraser = () => { isEraserActive.value = !isEraserActive.value; };
const toggleImageOverlay = () => { showImageOverlay.value = !showImageOverlay.value; };

const selectColor = (colorHex) => {
  selectedColor.value = colorHex;
  if (isEraserActive.value) { isEraserActive.value = false; }
};
const handleAddNewColorFromPalette = (newColorHex) => {
  if (newColorHex && !sessionMixedColors.includes(newColorHex)) {
    sessionMixedColors.push(newColorHex); selectColor(newColorHex);
  }
};
const handleRemoveCustomColorFromPalette = (colorHexToRemove) => {
  const index = sessionMixedColors.findIndex(hex => hex === colorHexToRemove);
  if (index !== -1) {
    sessionMixedColors.splice(index, 1);
    if (selectedColor.value === colorHexToRemove) {
      selectedColor.value = gameStore.fullColorPalette.length > 0 ? gameStore.fullColorPalette[0].hex : '#000000';
    }
  }
};

const startTimer = () => {
  localTimeLeft.value = gameStore.gameDuration;
  if (timerInterval.value) clearInterval(timerInterval.value);
  timerInterval.value = setInterval(async () => {
    if (localTimeLeft.value > 0) {
      localTimeLeft.value--;
    } else {
      clearInterval(timerInterval.value);
      console.log("時間到！準備提交作品...");
      
      if (drawingCanvasRef.value && typeof drawingCanvasRef.value.getCanvasDataURL === 'function') {
        const base64Data = drawingCanvasRef.value.getCanvasDataURL();
        if (base64Data) {
          const pureBase64 = base64Data.split(',')[1] || base64Data;
          gameStore.emitSubmitDrawing(pureBase64);
        } else {
          console.error("無法獲取畫布的 base64 數據！");
          alert("錯誤：無法提交您的作品。");
        }
      } else {
        console.error("drawingCanvasRef 或 getCanvasDataURL 方法未定義！");
        alert("錯誤：無法提交您的作品。");
      }
    }
  }, 1000);
};

const handleMyStrokeEmitted = (strokeData) => {
  console.log("GameRoomView: Stroke emitted from UserCanvas, type:", strokeData.operationType);
  if (gameStore.socket && gameStore.socket.connected) {
    gameStore.emitStroke(strokeData);
  }
};

const opponentStrokes = computed(() => {
  const strokesByOpponent = {};
  gameStore.receivedStrokes.forEach(item => {
    if (item.userId !== gameStore.userId) {
        if (!strokesByOpponent[item.userId]) {
          strokesByOpponent[item.userId] = [];
        }
        strokesByOpponent[item.userId].push(item.strokeData);
    }
  });
  return strokesByOpponent;
});

const handleKeyDown = (event) => {
  const activeElement = document.activeElement;
  const isInputFocused = ['INPUT', 'SELECT', 'TEXTAREA'].includes(activeElement.tagName) || activeElement.isContentEditable;

  if (showColorMixerModal.value || isInputFocused) {
      return;
  }

  const isMac = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
  const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

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
  const currentRoomIdFromRoute = props.roomId || route.params.roomId || gameStore.roomId;
  if (!currentRoomIdFromRoute) { router.push('/'); return; }
  if (gameStore.roomId !== currentRoomIdFromRoute) gameStore.roomId = currentRoomIdFromRoute;
  if (!gameStore.hasUserData) { router.push('/'); return; }

  if (!gameStore.socket || !gameStore.socket.connected) { gameStore.connectSocketIO(); }
  else { gameStore.socket.emit('enter-room', { room_id: gameStore.roomId, user_id: gameStore.userId, user_name: gameStore.userName }); }
  
  if (!gameStore.targetImageSrc || gameStore.playerList.length === 0) {
    await gameStore.fetchGameSetupInfo();
  }
  
  localTimeLeft.value = gameStore.gameDuration;
  startTimer();
  window.addEventListener('keydown', handleKeyDown);

  await nextTick();
  if(drawingCanvasRef.value && typeof drawingCanvasRef.value.canUndoState === 'boolean'){
      updateUndoRedoUiStateFromEvent({
          canUndo: drawingCanvasRef.value.canUndoState,
          canRedo: drawingCanvasRef.value.canRedoState
      });
  }
});

onUnmounted(() => {
  clearInterval(timerInterval.value);
  window.removeEventListener('keydown', handleKeyDown);
});

</script>

<style scoped>
.aspect-square { aspect-ratio: 1 / 1; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 3px;}
.custom-scrollbar::-webkit-scrollbar-track { background-color: #f1f5f9; }
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f1f5f9; }
</style>