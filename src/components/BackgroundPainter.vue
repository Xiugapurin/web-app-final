<template>
  <canvas
    ref="canvas"
    class="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
  ></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
// color effect
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

  // mouse move
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
        type: "trail", 
        gravity: 0,
        friction: 0.95,
      });
    }
    hue = (hue + 2) % 360;
  }

  // mouse click
  function handleClick(e) {
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
        type: "firework", 
      });
    }
    hue = (hue + 30) % 360;
  }

  function animate() {
    // clean canvas
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      // update pos
      p.velocityX *= p.friction;
      p.velocityY *= p.friction;
      p.velocityY += p.gravity;

      p.x += p.velocityX;
      p.y += p.velocityY;
      p.life--;
      p.size *= p.type === "firework" ? 0.92 : 0.95;

      if (p.life <= 0 || p.size <= 0.5) {
        particles.splice(i, 1);
        i--;
      }
    }
    animationId = requestAnimationFrame(animate);
  }

  // add event listener
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
