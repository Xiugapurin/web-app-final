<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
  >
    <div class="flex flex-col justify-center items-center bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
      <div class="mb-6">
        <Icon icon="eos-icons:loading" class="text-6xl text-pink-500 animate-spin" />
      </div>
      <p class="text-xl font-semibold text-gray-700 mb-4">
        {{ statusMessage || '正在處理中...' }}
      </p>
      <p v-if="cancellable" class="text-sm text-gray-500 mb-6">
        請稍候，或點擊下方按鈕取消。
      </p>
       <p v-else class="text-sm text-gray-500 mb-6">
        請稍候...
      </p>
      <button
        v-if="cancellable"
        @click="handleCancelClick"
        class="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-4 rounded-lg transition text-md"
      >
        取消配對
      </button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { useGameStore } from "../stores/gameStore";

const props = defineProps({
  show: Boolean,
  statusMessage: String,
  cancellable: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['overlay-click']);

const gameStore = useGameStore();

const handleCancelClick = () => {
  if (props.cancellable) {
    gameStore.cancelMatchmaking();
  }
};
</script>