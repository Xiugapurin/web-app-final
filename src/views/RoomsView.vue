<template>
  <div class="relative z-10">
    <!-- 只有 HomeView 有 canvas -->
    <canvas
      ref="canvas"
      class="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
    ></canvas>

    <!-- 主內容 -->
    <div class="w-full max-w-5xl mx-auto px-4 flex flex-col relative z-10">
      <!-- 搜索框 -->
      <div class="relative mb-6 w-full">
        <div class="mx-auto w-full max-w-md bg-white rounded-lg">
          <input
            type="text"
            placeholder="搜索: 房間名/ID"
            v-model="searchQuery"
            class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-base outline-none focus:border-black transition-colors"
          />
        </div>

        <!-- 玩家名稱（固定在右側偏下） -->
        <!-- <div
          class="absolute right-4 -bottom-1 translate-y-1 bg-white rounded-lg px-4 py-2 border-2 border-gray-300 font-medium whitespace-nowrap"
        >
          玩家: {{ playerName }}
        </div> -->
      </div>

      <!-- 房間列表區塊 (垂直滑動) -->
      <div
        class="bg-white rounded-2xl shadow-md p-6 mb-6 flex-grow overflow-y-auto h-[55vh]"
      >
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-center place-items-center"
        >
          <RoomCard
            v-for="room in filteredRooms"
            :key="room.id"
            :room="room"
            :selected="selectedRoomId === room.id"
            @select="handleRoomSelect"
          />
        </div>
      </div>

      <!-- 固定在底部的按鈕區域 -->
      <div class="w-full px-5">
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <button
            class="px-6 py-3 bg-lime-500 text-white font-medium rounded-lg transition-colors hover:bg-lime-400 focus:outline-none border-2 border-gray-500 w-full sm:w-auto"
            @click="$router.push('/')"
          >
            返回上一頁
          </button>
          <button
            class="px-6 py-3 bg-sky-500 text-white font-medium rounded-lg transition-colors hover:bg-sky-400 focus:outline-none border-2 border-gray-500 w-full sm:w-auto"
            @click="createRoom"
          >
            創建新房間
          </button>
          <button
            class="px-6 py-3 bg-amber-500 text-white font-medium rounded-lg transition-colors hover:bg-amber-400 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed border-2 border-gray-500 w-full sm:w-auto"
            :disabled="!selectedRoomId"
            @click="joinRoom"
          >
            開始遊戲
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import RoomCard from "./RoomCard.vue";
import { useUserStore } from "../stores/User";
import { useRoomsStore } from "../stores/Rooms";

const router = useRouter();
const searchQuery = ref("");
const selectedRoomId = ref(null);

const user = useUserStore();
const rooms = useRoomsStore()
// 房間數據 可能要從後端取
const roomList = rooms.roomList
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
  return rooms.value.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      room.id.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const handleRoomSelect = (roomId) => {
  selectedRoomId.value = selectedRoomId.value === roomId ? null : roomId;
};

const createRoom = () => {
  router.push("/create-room");
};

const joinRoom = () => {
  if (!selectedRoomId.value) return;
  router.push(`/room/${selectedRoomId.value}`);
};

// canvas
const canvas = ref(null);

let particles = [];
let hue = 0;
let animationId;

onMounted(() => {

  const ctx = canvas.value.getContext("2d");

  function resizeCanvas() {
    canvas.value.width = window.innerWidth;
    canvas.value.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // 鼠標移動效果 - 跟隨粒子
  function handleMouseMove(e) {
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 8 + 2,
        color: `hsl(${hue}, 100%, 50%)`,
        velocityX: Math.random() * 3 - 2,
        velocityY: Math.random() * 3 - 2,
        life: 100,
        type: "trail", // 標記為跟隨粒子
        gravity: 0,
        friction: 0.95,
      });
    }
    hue = (hue + 2) % 360;
  }

  // 鼠標點擊效果 - 煙花爆炸
  function handleClick(e) {
    // 產生更多粒子以達到濺射效果
    const particleCount = 30 + Math.floor(Math.random() * 20);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 2;

      particles.push({
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 15 + 5,
        color: `hsl(${hue + Math.random() * 60}, 100%, 50%)`,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 60 + Math.random() * 50,
        gravity: 0.2,
        friction: 0.95,
        type: "firework", // 標記為煙花粒子
      });
    }
    hue = (hue + 30) % 360;
  }

  function animate() {
    // 清除畫布時使用完全透明
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      // 更新粒子位置
      p.velocityX *= p.friction;
      p.velocityY *= p.friction;
      p.velocityY += p.gravity;

      p.x += p.velocityX;
      p.y += p.velocityY;
      p.life--;
      p.size *= p.type === "firework" ? 0.92 : 0.95; // 煙花粒子縮小更快

      if (p.life <= 0 || p.size <= 0.5) {
        particles.splice(i, 1);
        i--;
      }
    }
    animationId = requestAnimationFrame(animate);
  }

  // 添加事件監聽器
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("click", handleClick);
  animate();

  onUnmounted(() => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("click", handleClick);
    window.removeEventListener("resize", resizeCanvas);
    cancelAnimationFrame(animationId);
  });
});
</script>
