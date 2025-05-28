<template>
    <div class="relative z-10 flex flex-col justify-center">
      <!-- 背景canvas -->
      <canvas
        ref="canvas"
        class="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
      ></canvas>
  
      <!-- 主內容 -->
      <div class="flex-grow flex flex-col md:mt-8 xl:mt-16 justify-center items-center gap-4 md:gap-8 px-4 py-8 relative z-10">
        <div
          class="relative w-full max-w-2xl bg-white rounded-xl overflow-hidden shadow-lg flex flex-col justify-between p-6 sm:p-8 min-h-[400px]"
        >
          <!-- 標題 -->
          <h1
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-blue-600 drop-shadow-md mb-4"
          >
            遊戲名稱
          </h1>
  
          <!-- 輸入欄位 -->
          <div class="w-full flex justify-center mb-4">
            <div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full max-w-md px-4">
              <label
                for="guest-name"
                class="whitespace-nowrap text-gray-700 text-base sm:text-lg font-medium"
              >
                玩家名稱：
              </label>
              <input
                type="text"
                id="guest-name"
                class="w-full sm:flex-1 px-3 sm:px-4 py-2 border border-gray-500 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-black-500 outline-none transition text-sm sm:text-base"
                placeholder="輸入名稱"
                maxlength="16"
                v-model="user.name"
              />
            </div>
          </div>
  
          <!-- 按鈕 -->
          <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full max-w-md mx-auto">
            <button
              @click="goToRooms"
              class="w-full sm:w-[30%] bg-sky-500 hover:bg-sky-400 text-white font-medium py-2 sm:py-3 px-4 rounded-lg transition border-2 border-gray-500 text-sm sm:text-base"
            >
              房間
            </button>
  
            <button
              @click="startGame"
              :disabled="!user.name"
              :class="{
                'w-full sm:w-[30%] text-white font-medium py-2 sm:py-3 px-4 rounded-lg transition border-2 border-gray-500 text-sm sm:text-base': true,
                'bg-amber-500 hover:bg-amber-400': user.name,
                'bg-gray-400 cursor-not-allowed': !user.name,
              }"
            >
              開始遊戲
            </button>
          </div>
        </div>
      </div>
  
      <!-- 獨立遮罩層 (無動畫) -->
      <div
        v-if="showModal"
        class="fixed inset-0 bg-gray-500/50 backdrop-blur-xs z-40"
        @click="showModal = false"
      ></div>
  
      <!-- 彈窗 -->
      <transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 scale-90"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-0 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-100"
      >
        <div
          v-if="showModal"
          class="fixed inset-0 flex items-center justify-center z-50 px-4"
        >
          <div
            class="bg-white p-4 sm:p-6 rounded-lg w-full max-w-xs sm:max-w-sm transform transition-all duration-300"
          >
            <h3
              class="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4"
            >
              玩家名稱不可為空
            </h3>
            <div class="flex justify-end">
              <button
                @click="showModal = false"
                class="px-3 sm:px-4 py-1 sm:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm sm:text-base"
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
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/User";

const router = useRouter();
// const userName = user.name;
const roomName = ref("");
const maxPlayers = ref(2); // 默認2人
const showModal = ref(false);

const user = useUserStore();

// 遊戲相關函數
function startGame() {
  if (!user.name) return;
  console.log("遊戲開始，用戶名:", user.name);
}

function goToRooms() {
  if (!user.name) {
    showModal.value = true;
    return;
  }
  router.push("/rooms");
}

// 房間相關函數
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

// canvas 特效
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
