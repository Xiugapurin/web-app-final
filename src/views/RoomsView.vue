<template>
  <div class="relative z-10">
    <BackgroundPainter></BackgroundPainter>
    <!-- main area -->
    <div
      class="w-full max-w-5xl mx-auto md:mt-8 xl:mt-24 px-4 flex flex-col relative z-10"
    >
      <!-- white area -->
      <div
        class="bg-white rounded-2xl shadow-md p-6 mb-6 flex flex-col h-[70vh]"
      >
        <!-- input -->
        <div class="mb-6 w-full max-w-md mx-auto">
          <input
            type="text"
            placeholder="搜索: 房間名/ID"
            v-model="searchQuery"
            class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-base outline-none focus:border-black transition-colors"
          />
        </div>

        <!-- room list -->
        <div
          class="flex-grow overflow-y-auto bg-gray-100 rounded-2xl shadow-md"
        >
          <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-center place-items-center py-2.5"
          >
            <RoomCard
              v-for="room in filteredRooms"
              :key="room.id"
              :room="room"
              class="max-w-full"
              :selected="selectedRoomId === room.id"
              @select="handleRoomSelect"
            />
          </div>
        </div>

        <!-- buttons -->
        <div class="mt-4 pt-4">
          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <button
              class="px-6 py-3 bg-lime-500 text-white font-medium rounded-lg transition-colors hover:bg-lime-400 focus:outline-none border-2 border-gray-500 w-[9vw]"
              @click="goBack"
            >
              返回上一頁
            </button>
            <button
              class="px-6 py-3 bg-sky-500 text-white font-medium rounded-lg transition-colors hover:bg-sky-400 focus:outline-none border-2 border-gray-500 w-[9vw]"
              @click="createRoom"
            >
              創建新房間
            </button>
            <button
              class="px-6 py-3 bg-amber-500 text-white font-medium rounded-lg transition-colors hover:bg-amber-400 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed border-2 border-gray-500 w-[9vw]"
              :disabled="!selectedRoomId"
              @click="joinRoom"
            >
              開始遊戲
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import RoomCard from "../components/RoomCard.vue";
import { useUserStore } from "../stores/User";
import { useRoomsStore } from "../stores/Rooms";
import BackgroundPainter from "../components/BackgroundPainter.vue";

const router = useRouter();
const searchQuery = ref("");
const selectedRoomId = ref(null);

const user = useUserStore();
const rooms = useRoomsStore();
// 房間數據 可能要從後端取
const roomList = rooms.roomList;

// const rooms = ref([
//   {
//     id: "2DV",
//     name: "動漫",
//     currentPlayers: 5,
//     maxPlayers: 5,
//     timeElapsed: 0,
//     maxTime: 120,
//   },
//   {
//     id: "1bX",
//     name: "我的世界",
//     currentPlayers: 0,
//     maxPlayers: 15,
//     language: "ZH-CN",
//     timeElapsed: 0,
//     maxTime: 180,
//   },
//   // 添加更多房間數據以測試滾動
//   ...Array.from({ length: 20 }, (_, i) => ({
//     id: `RM${i + 3}`,
//     name: `房間 ${i + 3}`,
//     currentPlayers: Math.floor(Math.random() * 10),
//     maxPlayers: 10,
//     language: "ZH-CN",
//     timeElapsed: 0,
//     maxTime: 120 + Math.floor(Math.random() * 60),
//   })),
// ]);

// 過濾房間

const filteredRooms = computed(() => {
  if (!searchQuery.value) return roomList;
  return roomList.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      room.id.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const handleRoomSelect = (roomId) => {
  selectedRoomId.value = selectedRoomId.value === roomId ? null : roomId;
};

const goBack = () => {
  router.push("/");
};

const createRoom = () => {
  router.push("/create-room");
};

const joinRoom = () => {
  if (!selectedRoomId.value) return;
  router.push(`/room/${selectedRoomId.value}`);
};
</script>
