<template>
  <canvas
    ref="canvas"
    class="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
  ></canvas>
  <div class="w-[65%] mx-auto flex flex-col relative z-10">
    <!-- 創建房間表單 -->
    <div
      class="bg-white rounded-2xl shadow-md p-8 mx-auto mt-32 w-full max-w-md"
    >
      <h1 class="text-2xl font-bold text-center mb-6">創建新房間</h1>

      <!-- 房間名稱輸入 -->
      <div class="mb-6">
        <label
          for="roomName"
          class="block text-sm font-medium text-gray-700 mb-2"
          >房間名稱</label
        >
        <input
          id="roomName"
          type="text"
          v-model="roomName"
          placeholder="輸入房間名稱"
          class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      <!-- 人數選擇 -->
      <div class="mb-8">
        <label
          for="maxPlayers"
          class="block text-sm font-medium text-gray-700 mb-2"
          >玩家人數</label
        >
        <select
          id="maxPlayers"
          v-model="maxPlayers"
          class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
        >
          <option v-for="n in 9" :key="n" :value="n + 1">{{ n + 1 }}人</option>
        </select>
      </div>

      <!-- 按鈕區域 -->
      <div class="flex justify-center gap-4">
        <button
          @click="goBack"
          class="px-6 py-2 bg-lime-500 text-white font-medium rounded-lg hover:bg-lime-400 transition-colors border-2 border-gray-500"
        >
          返回上一頁
        </button>
        <button
          @click="createNewRoom"
          :disabled="!roomName"
          class="px-6 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-400 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors border-2 border-gray-500"
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

const router = useRouter();
const roomName = ref("");
const maxPlayers = ref(2); // 默認2人

// 生成隨機ID (3位大寫字母+數字)
const generateRandomId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const goBack = () => {
  router.push("/rooms");
};

const createNewRoom = () => {
  if (!roomName.value) return;

  const newRoom = {
    id: generateRandomId(),
    name: roomName.value,
    currentPlayers: 0,
    maxPlayers: maxPlayers.value,
    language: "ZH-CN",
    timeElapsed: 0,
    maxTime: 120,
  };

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

  function handleMouseMove(e) {
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 10 + 5,
        color: `hsl(${hue}, 100%, 50%)`,
        velocityX: Math.random() * 3 - 2,
        velocityY: Math.random() * 3 - 2,
        life: 100,
      });
    }
    hue += 2;
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      p.x += p.velocityX;
      p.y += p.velocityY;
      p.life--;
      p.size *= 0.95;

      if (p.life <= 0 || p.size <= 0.5) {
        particles.splice(i, 1);
        i--;
      }
    }
    animationId = requestAnimationFrame(animate);
  }

  window.addEventListener("mousemove", handleMouseMove);
  animate();

  onUnmounted(() => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("resize", resizeCanvas);
    cancelAnimationFrame(animationId);
  });
});
</script>
