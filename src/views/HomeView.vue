<template>
  <div class="relative z-10 flex flex-col justify-center">
    <BackgroundPainter></BackgroundPainter>

    <!-- main area -->
    <div
      class="flex-grow flex flex-col mt-16 sm:mt-24 md:mt-32 justify-center items-center gap-4 md:gap-8 relative z-10"
    >
      <!-- white area -->
      <div
        class="relative w-full max-w-xl bg-white rounded-xl overflow-hidden shadow-lg flex flex-col justify-between p-6 sm:p-8 min-h-[400px]"
      >
        <!-- title -->
        <h1
          class="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-blue-600 drop-shadow-md mt-4"
        >
          遊戲名稱
        </h1>

        <!-- input -->
        <div class="w-full flex justify-center mb-4 sm:mb-6">
          <div class="flex flex-col gap-2 w-full max-w-md px-4">
            <label
              for="guest-name"
              class="whitespace-nowrap text-gray-700 text-xs sm:text-base font-medium"
            >
              玩家名稱：
            </label>
            <input
              type="text"
              id="guest-name"
              class="w-full sm:flex-1 px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-black-500 outline-none transition text-sm sm:text-base"
              placeholder="輸入名稱"
              maxlength="16"
              v-model="user.name"
            />
          </div>
        </div>

        <!-- buttons -->
        <div
          class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full max-w-md mx-auto"
        >
          <button
            @click="goToRooms"
            class="w-[9vw] bg-sky-500 hover:bg-sky-400 text-white font-medium py-2 sm:py-3 px-4 rounded-lg transition border-2 border-gray-500 text-sm sm:text-base"
          >
            房間
          </button>

          <button
            @click="startGame"
            :disabled="!user.name"
            :class="{
              'w-[9vw] text-white font-medium py-2 sm:py-3 px-4 rounded-lg transition border-2 border-gray-500 text-sm sm:text-base': true,
              'bg-amber-500 hover:bg-amber-400': user.name,
              'bg-gray-400 cursor-not-allowed': !user.name,
            }"
          >
            開始遊戲
          </button>
        </div>
      </div>
    </div>

    <!-- hint layer -->
    <div
      v-if="showHint"
      class="fixed inset-0 bg-gray-500/50 backdrop-blur-xs z-40"
      @click="showHint = false"
    ></div>

    <!-- hint animation -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-90"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-0 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-100"
    >
      <div
        v-if="showHint"
        class="fixed inset-0 flex items-center justify-center z-50 px-4"
      >
        <div
          class="bg-white p-4 sm:p-6 rounded-lg w-full max-w-xs sm:max-w-sm transform transition-all duration-300"
        >
          <h3
            class="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4"
          >
            {{ hint }}
          </h3>
          <div class="flex justify-end gap-4">
            <button
              v-if="clickToCreateRoom"
              @click="
                showHint = false;
                clickToCreateRoom = false;
              "
              class="px-3 sm:px-4 py-1 sm:py-2 bg-gray-500 text-white rounded hover:bg-gray-400 transition text-sm sm:text-base"
            >
              取消
            </button>
            <button
              @click="
                clickConfirm();
                showHint = false;
                clickToCreateRoom = false;
              "
              class="px-3 sm:px-4 py-1 sm:py-2 bg-blue-500 text-white rounded hover:bg-blue-400 transition text-sm sm:text-base"
            >
              確定
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/User";
import { useRoomsStore } from "../stores/Rooms";
import BackgroundPainter from "../components/BackgroundPainter.vue";

const router = useRouter();
// const userName = user.name;
const roomName = ref("");
const maxPlayers = ref(2); // 默認2人
const showHint = ref(false);

const user = useUserStore();
const rooms = useRoomsStore();
const hint = ref("");
const clickToCreateRoom = ref(false);

// 遊戲相關函數
function startGame() {
  if (!user.name) return;
  if (!rooms.roomList.length) {
    showHint.value = true;
    clickToCreateRoom.value = true;
    hint.value = "目前房間為空，是否創建新房間";
    return;
  }
  const randomRoomId = Math.floor(Math.random() * rooms.roomList.length);
  router.push(`/room/${rooms.roomList[randomRoomId].id}`);

  //   console.log("遊戲開始，用戶名:", user.name);
}

function goToRooms() {
  if (!user.name) {
    showHint.value = true;
    hint.value = "玩家名稱不可為空";
    return;
  }
  router.push("/rooms");
}

function clickConfirm() {
  console.log("check");
  if (clickToCreateRoom.value) {
    router.push("/create-room");
  }
}
</script>
