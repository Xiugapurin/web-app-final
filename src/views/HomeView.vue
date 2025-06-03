<template>
  <div class="relative flex flex-col justify-center">
    <BackgroundPainter></BackgroundPainter>

    <div
      class="flex-grow flex flex-col min-h-screen justify-center items-center gap-12 relative"
    >
      <img 
        :src="logoUrl" 
        alt="logo" 
        class="mx-auto h-20 sm:h-24 md:h-28 drop-shadow-md"
      />
      <div
        v-if="!gameStore.hasUserData"
        class="relative w-full max-w-sm bg-white rounded-xl shadow-lg flex flex-col justify-between p-6 gap-6"
      >
        <input
          type="text"
          id="guest-name-input"
          class="w-full text-center sm:flex-1 px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg text-md sm:text-lg focus:ring-2 focus:ring-black-500 focus:border-black-500 outline-none transition"
          placeholder="我是..."
          maxlength="32"
          v-model="inputUserName"
          @keyup.enter="handleSetUserName"
        />

        <button
          @click="handleSetUserName"
          :disabled="!inputUserName.trim()"
          :class="{
            'w-full text-white font-medium py-2 sm:py-3 px-4 rounded-lg transition text-md sm:text-lg': true,
            'bg-pink-500 hover:bg-pink-400 cursor-pointer': inputUserName.trim(),
            'bg-gray-400 cursor-not-allowed': !inputUserName.trim(),
          }"
        >
          <span v-if="inputUserName">好了！</span>
          <span v-else>輸入你的暱稱</span>
        </button>
      </div>
      <div v-else class="relative w-full max-w-sm flex flex-col gap-6">
        <div
          class="bg-white rounded-xl shadow-lg flex flex-col justify-between p-6 gap-6"
        >
          <p class="text-center text-gray-700 text-lg">你好， <span class="font-semibold text-pink-500">{{ gameStore.userName }}</span>！</p>
          <input
            type="text"
            id="room-code-input"
            class="w-full text-center sm:flex-1 px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg text-md sm:text-lg focus:ring-2 focus:ring-black-500 focus:border-black-500 outline-none transition"
            placeholder="輸入房間號"
            v-model="inputRoomPasskey"
            @keyup.enter="handleJoinRoomByKey"
          />

          <button
            @click="handleJoinRoomByKey"
            :disabled="!inputRoomPasskey.trim()"
            :class="{
              'w-full text-white font-medium py-2 sm:py-3 px-4 rounded-lg transition text-md sm:text-lg': true,
              'bg-blue-500 hover:bg-blue-400 cursor-pointer': inputRoomPasskey.trim(),
              'bg-gray-400 cursor-not-allowed': !inputRoomPasskey.trim(),
            }"
          >
            加入房間
          </button>
        </div>

        <div class="flex w-full gap-4 items-center">
          <div class="h-0.5 w-full bg-gray-200"></div>
          <h3 class="text-gray-400 whitespace-nowrap font-bold">或是</h3>
          <div class="h-0.5 w-full bg-gray-200"></div>
        </div>

        <div
          class="bg-white rounded-xl shadow-lg flex flex-col sm:flex-row justify-between p-6 gap-6"
        >
          <button
            @click="resetUserName"
            class="w-full sm:w-auto flex-1 text-pink-500 font-medium py-2 sm:py-3 px-4 rounded-lg transition text-md sm:text-lg border-2 border-pink-500 cursor-pointer hover:bg-pink-50"
          >
            重新取名
          </button>
          <button
            @click="handleJoinAnonymous"
            class="w-full sm:w-auto flex-1 text-white font-medium py-2 sm:py-3 px-4 rounded-lg transition text-md sm:text-lg bg-pink-500 hover:bg-pink-400 cursor-pointer"
          >
            隨機配對
          </button>
        </div>
      </div>
    </div>

    <MatchingStatusModal
      :show="gameStore.isMatching"
      :status-message="gameStore.matchingStatusMessage"
      :cancellable="true"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useGameStore } from "../stores/gameStore";
import BackgroundPainter from "../components/BackgroundPainter.vue";
import MatchingStatusModal from "../components/MatchingStatusModal.vue";
import logoUrl from '../assets/logo.png';

const gameStore = useGameStore();

const inputUserName = ref('');
const inputRoomPasskey = ref('');

function handleSetUserName() {
  if (inputUserName.value.trim()) {
    gameStore.setUserName(inputUserName.value.trim());
  } else {
    alert("請輸入你的名字！");
  }
}

function resetUserName() {
  gameStore.cleanupUserAndRoom();
  inputUserName.value = '';
  inputRoomPasskey.value = '';
}

async function handleJoinAnonymous() {
  if (!gameStore.hasUserData) {
      alert("請先設定你的名字！");
      return;
  }
  await gameStore.joinAnonymousRoom();
}

async function handleJoinRoomByKey() {
  if (!gameStore.hasUserData) {
      alert("請先設定你的名字！");
      return;
  }
  if (inputRoomPasskey.value.trim()) {
    await gameStore.joinRoomByPasskey(inputRoomPasskey.value.trim());
  } else {
    alert("請輸入房間號碼！");
  }
}

onMounted(() => {
  if (gameStore.userName) {
    inputUserName.value = gameStore.userName;
  }

  if (gameStore.isInRoom && gameStore.userId) {
     console.log("Attempting to reconnect WebSocket on mount if in room...");
     gameStore.connectSocketIO();
  }
});

</script>