<template>
  <BackgroundPainter></BackgroundPainter>
  <!-- main area -->
  <div
    class="w-full sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 mx-auto flex flex-col relative z-10 px-4 sm:px-0"
  >
    <!-- white area -->
    <div
      class="bg-white rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 md:p-8 mx-auto mt-16 sm:mt-24 md:mt-32 w-full max-w-md"
    >
      <h1 class="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">
        創建新房間
      </h1>

      <!-- room name input -->
      <div class="mb-4 sm:mb-6">
        <label
          for="roomName"
          class="block text-xs sm:text-base font-medium text-gray-700 mb-1 sm:mb-2"
          >房間名稱</label
        >
        <input
          id="roomName"
          type="text"
          v-model="roomName"
          placeholder="輸入房間名稱"
          class="w-full px-3 sm:px-4 py-1 sm:py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
        />
      </div>

      <!-- number of people -->
      <div class="mb-6 sm:mb-8">
        <label
          for="maxPlayers"
          class="block text-xs sm:text-base font-medium text-gray-700 mb-1 sm:mb-2"
          >玩家人數</label
        >
        <select
          id="maxPlayers"
          v-model="maxPlayers"
          class="w-full px-3 sm:px-4 py-1 sm:py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
        >
          <option v-for="n in 7" :key="n" :value="n + 1">{{ n + 1 }}人</option>
        </select>
      </div>

      <!-- buttons -->
      <div
        class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 md:gap-4"
      >
        <button
          @click="goBack"
          class="px-6 py-3 bg-lime-500 text-white font-medium rounded-lg transition-colors hover:bg-lime-400 focus:outline-none border-2 border-gray-500 w-[9vw]"
        >
          返回上一頁
        </button>
        <button
          @click="createNewRoom"
          :disabled="!roomName"
          class="px-6 py-3 bg-sky-500 text-white font-medium rounded-lg transition-colors hover:bg-sky-400 focus:outline-none border-2 border-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed w-[9vw]"
        >
          創建房間
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useRoomsStore } from "../stores/Rooms";
import BackgroundPainter from "../components/BackgroundPainter.vue";

const router = useRouter();
const roomName = ref("");

// default: 2 people
const maxPlayers = ref(2);
const rooms = useRoomsStore();

const randomIdDigit = 3

// random ID (default: 3 digit)
const generateRandomId = (existingRooms) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const maxAttempts = 50; // 防止无限循环
  let attempts = 0;

  while (attempts < maxAttempts) {
    let result = "";
    for (let i = 0; i < randomIdDigit; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // check whether ID is unique
    const isUnique = !existingRooms.some((room) => room.id === result);
    if (isUnique) {
      return result;
    }

    attempts++;
  }

  // extend ID length if needed
  let fallbackId = "";
  for (let i = 0; i < 6; i++) {
    fallbackId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return fallbackId;
};

const goBack = () => {
  router.push("/rooms");
};

const createNewRoom = () => {
  if (!roomName.value) return;

  const newRoom = {
    id: generateRandomId(rooms.roomList),
    name: roomName.value,
    currentPlayers: 0,
    maxPlayers: maxPlayers.value,
    timeElapsed: 0,
    // maxTime: 120,
  };

  rooms.addRoom(newRoom);

  // 把新房間資訊傳到後端
  // Todo

  router.push("/rooms");
};
</script>
