<template>
  <div class="relative z-10">
    <!-- 只有 HomeView 有 canvas -->
    <canvas
      ref="canvas"
      class="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
    ></canvas>

    <!-- 主內容 -->
    <div
      class="flex flex-col w-full justify-center items-center gap-8 relative z-10"
    >
      <div
        class="relative mt-16 w-[40%] h-[60vh] bg-white rounded-xl overflow-hidden"
      >
        <h1
          class="mt-16 text-5xl font-bold text-center text-blue-600 drop-shadow-md"
        >
          遊戲名稱
        </h1>

        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-8"
        >
          <div class="flex items-center gap-4">
            <label
              for="guest-name"
              class="whitespace-nowrap text-gray-700 text-lg font-medium"
            >
              遊客名稱：
            </label>
            <input
              type="text"
              id="guest-name"
              class="flex-1 px-4 py-2 border border-gray-500 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-black-500 outline-none transition"
              placeholder="輸入名稱"
              maxlength="16"
              v-model="userName"
            />
          </div>
        </div>

        <div class="absolute bottom-16 left-0 right-0 px-8">
          <div class="flex justify-center gap-4 max-w-md mx-auto">
            <button
              @click="goToRooms"
              class="w-[30%] bg-sky-500 hover:bg-sky-400 text-white font-medium py-3 px-4 rounded-lg transition border-2 border-gray-500"
            >
              房間
            </button>

            <button
              @click="startGame"
              :disabled="!userName"
              :class="{
                'w-[30%] text-white font-medium py-3 px-4 rounded-lg transition border-2 border-gray-500': true,
                'bg-amber-500 hover:bg-amber-400': userName,
                'bg-gray-400 cursor-not-allowed': !userName,
              }"
            >
              開始遊戲
            </button>
          </div>
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
        class="fixed inset-0 flex items-center justify-center z-50"
      >
        <div
          class="bg-white p-6 rounded-lg max-w-sm w-full transform transition-all duration-300"
        >
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            玩家暱稱不可為空
          </h3>
          <div class="flex justify-end">
            <button
              @click="showModal = false"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
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

const router = useRouter();
const userName = ref("");
const canvas = ref(null);
const showModal = ref(false);

let particles = [];
let hue = 0;
let animationId;

function startGame() {
  if (!userName.value) return;
  // 開始遊戲的邏輯
  console.log("遊戲開始，用戶名:", userName.value);
}

function goToRooms() {
  if (!userName.value) {
    showModal.value = true;
    return;
  }
  router.push("/rooms");
}

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
