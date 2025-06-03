<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[120] p-4"
  >
    <div class="p-1 rounded-xl shadow-2xl w-full max-w-lg text-white">
      <div class="flex flex-col gap-6 bg-white p-8 rounded-lg">
        <img 
          :src="logoUrl" 
          alt="logo" 
          class="mx-auto h-20 sm:h-24 md:h-28 drop-shadow-md"
        />

        <h2 class="text-4xl text-center font-bold" :class="errorMessage ? 'text-red-500' : 'text-blue-500'">
          {{ errorMessage ? '遊戲出錯' : '遊戲結束！' }}
        </h2>

        <div v-if="!errorMessage && scores && scores.length > 0" class="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
          <div 
            v-for="(player, index) in scores" 
            :key="player.id || `player-${index}`"
            class="flex justify-between items-center p-3 rounded-lg text-lg"
            :class="[
              player.id === winnerId ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-200 text-black',
            ]"
          >
            <span class="truncate">
              <Icon v-if="player.id === winnerId" icon="mdi:crown" class="inline mr-2 text-yellow-300 text-xl"/>
              {{ player.name }}
              <span v-if="player.id === currentUserId" class="text-xs text-pink-500 ml-1">(你)</span>
            </span>
            <span>{{ Math.round(player.score) }} 分</span>
          </div>
        </div>
        <p v-else-if="!errorMessage" class="text-gray-400 text-center mb-8">暫無分數資訊。</p>
        <p v-if="errorMessage" class="text-red-300 text-center mb-8">{{ errorMessage }}</p>

        <button
          @click="handleConfirm"
          class="w-full bg-pink-500 hover:bg-pink-600 focus:bg-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition text-lg shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer"
        >
          {{ errorMessage ? '了解' : '再玩一場！' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { useGameStore } from "../stores/gameStore";
import logoUrl from '../assets/logo.png';

const props = defineProps({
  show: Boolean,
  scores: { type: Array, default: () => [] },
  message: String,
  winnerId: String,
  errorMessage: String,
});

const gameStore = useGameStore();
const currentUserId = gameStore.userId;

const handleConfirm = () => {
  gameStore.acknowledgeGameOver();
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #a0aec0; /* gray-500 */
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background-color: #4a5568; /* gray-700 */
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #a0aec0 #4a5568;
}
</style>