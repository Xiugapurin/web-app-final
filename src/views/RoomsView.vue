<template>
  <div class="relative z-10">
    <!-- 只有 HomeView 有 canvas -->
    <canvas
      ref="canvas"
      class="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
    ></canvas>

    <!-- 主內容 -->
    <div class="w-[65%] mx-auto flex flex-col relative z-10">
      <!-- 搜索框 -->
      <div class="w-full max-w-[400px] mx-auto mb-6 bg-white rounded-lg">
        <input
          type="text"
          placeholder="搜索: 房間名/ID"
          v-model="searchQuery"
          class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-base outline-none focus:border-black transition-colors"
        />
      </div>

      <!-- 房間列表區塊 (垂直滑動) -->
      <div
        class="bg-white rounded-2xl shadow-md p-6 mb-6 flex-grow overflow-y-auto h-[55vh]"
      >
        <div
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4"
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
      <div class="max-w-[1200px] mx-auto px-5">
        <div class="flex justify-center gap-4">
          <button
            class="px-6 py-3 bg-lime-500 text-white font-medium rounded-lg transition-colors hover:bg-lime-400 focus:outline-none border-2 border-gray-500"
            @click="$router.push('/')"
          >
            返回上一頁
          </button>
          <button
            class="px-6 py-3 bg-sky-500 text-white font-medium rounded-lg transition-colors hover:bg-sky-400 focus:outline-none border-2 border-gray-500"
            @click="createRoom"
          >
            創建新房間
          </button>
          <button
            class="px-6 py-3 bg-amber-500 text-white font-medium rounded-lg transition-colors hover:bg-amber-400 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed border-2 border-gray-500"
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

const router = useRouter();
const searchQuery = ref("");
const selectedRoomId = ref(null);

// 房間數據
const rooms = ref([
  {
    id: "2DV",
    name: "動漫",
    currentPlayers: 5,
    maxPlayers: 5,
    timeElapsed: 0,
    maxTime: 120,
  },
  {
    id: "1bX",
    name: "我的世界",
    currentPlayers: 0,
    maxPlayers: 15,
    language: "ZH-CN",
    timeElapsed: 0,
    maxTime: 180,
  },
  // 添加更多房間數據以測試滾動
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `RM${i + 3}`,
    name: `房間 ${i + 3}`,
    currentPlayers: Math.floor(Math.random() * 10),
    maxPlayers: 10,
    language: "ZH-CN",
    timeElapsed: 0,
    maxTime: 120 + Math.floor(Math.random() * 60),
  })),
]);

const filteredRooms = computed(() => {
  if (!searchQuery.value) return rooms.value;
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
      });
    }
    hue = (hue + 30) % 360;
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    // 使用半透明背景創造拖尾效果
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      // 更新粒子位置
      p.velocityX *= p.friction;
      p.velocityY *= p.friction;
      p.velocityY += p.gravity; // 添加重力效果

      p.x += p.velocityX;
      p.y += p.velocityY;
      p.life--;
      p.size *= 0.92;

      if (p.life <= 0 || p.size <= 1) {
        particles.splice(i, 1);
        i--;
      }
    }
    animationId = requestAnimationFrame(animate);
  }

  window.addEventListener("click", handleClick);
  animate();

  onUnmounted(() => {
    window.removeEventListener("click", handleClick);
    window.removeEventListener("resize", resizeCanvas);
    cancelAnimationFrame(animationId);
  });
});
</script>
