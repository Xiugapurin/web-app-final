<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[110] p-4"
  >
    <div class="flex flex-col gap-4 items-center bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
      <Icon icon="mdi:account-multiple-remove-outline" class="text-6xl text-orange-500" />
      <h3 class="text-xl font-semibold text-gray-800 mb-3">對手已斷線</h3>
      <p class="text-gray-600 mb-8 whitespace-pre-line">
        {{ message || '對手已離開遊戲，目前遊戲已結束。' }}
      </p>
      <button
        @click="handleConfirm"
        class="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-4 rounded-lg transition text-md"
      >
        返回主頁
      </button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { useGameStore } from "../stores/gameStore";

const props = defineProps({
  show: Boolean,
  message: String,
});

const emit = defineEmits(['confirm']);

const gameStore = useGameStore();

const handleConfirm = () => {
  gameStore.acknowledgeOpponentDisconnected();
};
</script>