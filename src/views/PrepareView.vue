<template>
  <div class="min-h-screen bg-gray-100 flex flex-col items-center p-4 sm:p-8">
    <header class="w-full max-w-6xl mb-8 text-center">
      <h1 class="text-4xl font-bold text-pink-600">遊戲配置確認</h1>
    </header>

    <div v-if="isLoading" class="flex flex-col items-center justify-center text-gray-600">
        <Icon icon="eos-icons:loading" class="text-5xl mb-4"/>
        <p>正在載入遊戲設定...</p>
    </div>

    <main v-else-if="gameStore.roomId && !gameStore.gameHasStarted" class="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
      <aside class="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg flex flex-col gap-6">
        <h2 class="text-2xl font-semibold text-gray-800 border-b pb-3 mb-3">遊戲設定</h2>
        <div>
          <h3 class="text-lg font-medium text-gray-700 mb-2">目標圖片：</h3>
          <div class="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden border">
            <img v-if="gameStore.targetImageSrc" :src="gameStore.targetImageSrc" alt="目標圖片" class="w-full h-full object-contain">
            <Icon v-else icon="mdi:image-off-outline" class="text-5xl text-gray-400" />
          </div>
        </div>
        <div>
          <h3 class="text-lg font-medium text-gray-700 mb-2">顏色列表：</h3>
          <div v-if="gameStore.fullColorPalette && gameStore.fullColorPalette.length > 0" class="flex flex-wrap gap-2">
            <div
              v-for="colorObj in gameStore.fullColorPalette"
              :key="colorObj.hex"
              :style="{ backgroundColor: colorObj.hex }"
              class="w-8 h-8 rounded-md border border-gray-300"
              :title="colorObj.name || colorObj.hex"
            ></div>
          </div>
          <p v-else class="text-sm text-gray-500">尚無顏色資訊。</p>
        </div>
        <div>
          <h3 class="text-lg font-medium text-gray-700 mb-1">遊戲時長：</h3>
          <p class="text-indigo-600 font-semibold">{{ gameStore.gameDuration }} 秒</p>
        </div>
        <!-- <p class="text-xs text-gray-500 mt-auto">（目前設定無法由玩家更改）</p> -->
      </aside>

      <section class="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg flex flex-col">
        <h2 class="text-2xl font-semibold text-gray-800 border-b pb-3 mb-4">房間成員 ({{ gameStore.playerList.length }})</h2>
        <div class="flex-grow overflow-y-auto mb-6 pr-2 custom-scrollbar min-h-[200px]">
          <ul v-if="gameStore.playerList.length > 0" class="space-y-3">
            <li
              v-for="player in gameStore.playerList"
              :key="player.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm"
            >
              <span class="text-gray-800 font-medium">
                {{ player.name }} 
                <span v-if="player.id === gameStore.userId" class="text-xs text-pink-500">(你)</span>
              </span>
              <span
                :class="player.isReady ? 'text-green-500 bg-green-100' : 'text-yellow-600 bg-yellow-100'"
                class="px-3 py-1 text-xs font-semibold rounded-full"
              >
                {{ player.isReady ? '已準備' : '準備中...' }}
              </span>
            </li>
          </ul>
          <p v-else class="text-gray-500 text-center py-8">房間內目前沒有其他玩家...</p>
        </div>

        <div class="mt-auto pt-6 border-t">
          <button
            @click="handleReadyButtonClick"
            :disabled="isReadyButtonDisabled"
            :class="{
              'w-full text-white font-bold py-3 px-6 rounded-lg transition-transform duration-150 text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2': true,
              'bg-pink-500 hover:bg-pink-600 active:scale-95 focus:ring-pink-500': !gameStore.isCurrentUserReady,
              'bg-orange-500 hover:bg-orange-600 active:scale-95 focus:ring-orange-500': gameStore.isCurrentUserReady,
              'bg-gray-400 cursor-not-allowed': isReadyButtonDisabled
            }"
          >
            {{ readyButtonText }}
          </button>
           <p v-if="gameStore.isCurrentUserReady && !gameStore.allPlayersActuallyReady" class="text-sm text-center text-gray-600 mt-3">
            等待其他玩家準備完畢
          </p>
          <p v-if="gameStore.allPlayersActuallyReady" class="text-sm text-center text-green-600 mt-3">
            所有玩家已準備！等待遊戲開始...
          </p>
        </div>
      </section>
    </main>
     <div v-else-if="gameStore.gameHasStarted" class="text-center">
        <p class="text-2xl text-green-600 font-semibold">遊戲已開始！正在導向遊戲室...</p>
        <Icon icon="eos-icons:loading" class="text-5xl text-green-500 my-4"/>
    </div>
     <div v-else class="text-center">
        <p class="text-xl text-red-500">無法載入房間資訊。請確認房間號碼是否正確，或返回主頁重試。</p>
        <router-link to="/" class="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">
            返回主頁
        </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { Icon } from '@iconify/vue';

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();
const isLoading = ref(true);

console.log(typeof(gameStore.gameColors))

const readyButtonText = computed(() => {
  if (gameStore.gameHasStarted) return "遊戲已開始";
  if (gameStore.isCurrentUserReady) {
    return '取消準備';
  }
  return '我準備好了！';
});

const isReadyButtonDisabled = computed(() => {
    return gameStore.gameHasStarted;
});

const handleReadyButtonClick = () => {
  if (gameStore.gameHasStarted) return;
  gameStore.toggleReadyState();
};

watch(() => gameStore.gameHasStarted, (newVal) => {
    if (newVal && gameStore.roomId) {
        router.push(`/room/${gameStore.roomId}`);
    }
});

onMounted(async () => {
  isLoading.value = true;
  gameStore.gameHasStarted = false;
  const currentRoomIdFromRoute = route.params.roomId;

  if (!currentRoomIdFromRoute) {
    console.error("No Room ID in route params.");
    alert("錯誤：未提供房間ID。正在導回主頁...");
    router.push('/');
    isLoading.value = false;
    return;
  }
  
  if (gameStore.roomId !== currentRoomIdFromRoute) {
    gameStore.roomId = currentRoomIdFromRoute;
  }
  
  if (!gameStore.hasUserData) {
      console.warn("User data not found, redirecting to home.");
      router.push('/');
      isLoading.value = false;
      return;
  }

  // Connect Socket.IO
  gameStore.connectSocketIO();

  await gameStore.fetchGameSetupInfo();
  isLoading.value = false;
});

onUnmounted(() => {

});

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #9ca3af; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background-color: #e5e7eb; }
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #9ca3af #e5e7eb; }
</style>