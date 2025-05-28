<template>
  <canvas
    ref="canvas"
    class="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
  ></canvas>
  <div
    class="w-full sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 mx-auto flex flex-col relative z-10 px-4 sm:px-0"
  >
    <!-- 創建房間表單 -->
    <div
      class="bg-white rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 md:p-8 mx-auto mt-16 sm:mt-24 md:mt-32 w-full max-w-md"
    >
      <h1 class="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">
        創建新房間
      </h1>

      <!-- 房間名稱輸入 -->
      <div class="mb-4 sm:mb-6">
        <label
          for="roomName"
          class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
          >房間名稱</label
        >
        <input
          id="roomName"
          type="text"
          v-model="roomName"
          placeholder="輸入房間名稱"
          class="w-full px-3 sm:px-4 py-1 sm:py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      <!-- 人數選擇 -->
      <div class="mb-6 sm:mb-8">
        <label
          for="maxPlayers"
          class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
          >玩家人數</label
        >
        <select
          id="maxPlayers"
          v-model="maxPlayers"
          class="w-full px-3 sm:px-4 py-1 sm:py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
        >
          <option v-for="n in 9" :key="n" :value="n + 1">{{ n + 1 }}人</option>
        </select>
      </div>

      <!-- 按鈕區域 -->
      <div
        class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 md:gap-4"
      >
        <button
          @click="goBack"
          class="px-4 sm:px-6 py-1 sm:py-2 text-sm sm:text-base bg-lime-500 text-white font-medium rounded-lg hover:bg-lime-400 transition-colors border-2 border-gray-500"
        >
          返回上一頁
        </button>
        <button
          @click="createNewRoom"
          :disabled="!roomName"
          class="px-4 sm:px-6 py-1 sm:py-2 text-sm sm:text-base bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-400 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors border-2 border-gray-500"
        >
          創建房間
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useRoomsStore } from "../stores/Rooms";

const router = useRouter();
const roomName = ref("");
const maxPlayers = ref(2); // 默認2人
const rooms = useRoomsStore();

// 生成隨機ID (3位大寫字母+數字)
const generateRandomId = (existingRooms) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const maxAttempts = 50; // 防止无限循环
  let attempts = 0;

  while (attempts < maxAttempts) {
    let result = "";
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 检查是否已存在相同ID
    const isUnique = !existingRooms.some((room) => room.id === result);
    if (isUnique) {
      return result;
    }

    attempts++;
  }

  // 如果多次尝试仍未生成唯一ID，则延长ID长度
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

  // 導回房間列表頁
  router.push("/rooms");
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
