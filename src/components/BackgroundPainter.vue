<template>
  <canvas
    ref="canvas"
    class="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
  ></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const canvas = ref(null);

let particles = [];
let explosionTrails = [];
let lineTrails = [];
let hue = 0;
let animationId;
let lastMousePos = { x: null, y: null };
let lastHue = 0;
let tailParticles = []; // 新增：拖尾粒子数组

onMounted(() => {
  const ctx = canvas.value.getContext("2d");

  function resizeCanvas() {
    canvas.value.width = window.innerWidth;
    canvas.value.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function handleMouseMove(e) {
    const currentPos = { x: e.clientX, y: e.clientY };

    // 新增：创建拖尾粒子
    if (lastMousePos.x !== null) {
      const dx = currentPos.x - lastMousePos.x;
      const dy = currentPos.y - lastMousePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 根据移动速度创建不同数量的拖尾粒子
      const particlesToCreate = 3;
      
      for (let i = 0; i < particlesToCreate; i++) {
        const ratio = i / particlesToCreate;
        const x = lastMousePos.x + dx * ratio;
        const y = lastMousePos.y + dy * ratio;
        
        tailParticles.push({
          x,
          y,
          size: Math.random() * 3 + 5, // 随机大小
          color: `hsla(${(hue + i * 5) % 360}, 100%, 50%, ${Math.random() * 0.5 + 0.3})`,
          life: Math.random() * 30 + 10, // 随机生命周期
          decay: Math.random() * 0.1 + 0.05, // 衰减速度
          velocityX: (Math.random() * 2 - 1), 
          velocityY: (Math.random() * 2 - 1)
        });
      }

      // 创建连接线（原有逻辑，但增加平滑度）
      const segments = Math.max(3, Math.floor(distance / 3));
      
      for (let i = 0; i < segments; i++) {
        const ratio = i / segments;
        const segmentHue = (lastHue + 1) % 360;
        
        const fromX = lastMousePos.x + dx * (i / segments);
        const fromY = lastMousePos.y + dy * (i / segments);
        const toX = lastMousePos.x + dx * ((i + 1) / segments);
        const toY = lastMousePos.y + dy * ((i + 1) / segments);
        
        lineTrails.push({
          fromX,
          fromY,
          toX,
          toY,
          color: `hsla(${segmentHue}, 100%, 50%, 0.7)`,
          createdAt: Date.now(),
          life: 2000,
          width: 7,
        });
      }
    }

    lastMousePos = currentPos;
    lastHue = hue;
    hue = (hue + 1) % 360;
  }

  function handleClick(e) {
    const particleCount = 30 + Math.floor(Math.random() * 30);
    const explosionHue = hue;
    const centerX = e.clientX;
    const centerY = e.clientY;

    explosionTrails.push({
      x: centerX,
      y: centerY,
      radius: 20 + Math.random() * 20,
      color: `hsla(${explosionHue}, 100%, 50%, 0.3)`,
      createdAt: Date.now(),
      life: 2000,
      maxRadius: 20 + Math.random() * 20,
    });

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      const size = Math.random() * 3 + 12;

      particles.push({
        x: centerX,
        y: centerY,
        size: size,
        color: `hsl(${explosionHue + Math.random() * 60}, 100%, 50%)`,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 50 + Math.random() * 30,
        type: "firework",
        initialSize: size,
      });
    }
    hue = (hue + 30) % 360;
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    const now = Date.now();

    // 绘制拖尾粒子（新增部分）
    for (let i = 0; i < tailParticles.length; i++) {
      const p = tailParticles[i];
      
      // 绘制圆形粒子
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      
      // 更新粒子状态
      p.x += p.velocityX;
      p.y += p.velocityY;
      p.life -= p.decay;
      p.size *= 0.97;
      
      // 移除生命周期结束的粒子
      if (p.life <= 0 || p.size <= 1) {
        tailParticles.splice(i, 1);
        i--;
      }
    }

    // 绘制圆形爆炸轨迹（原有）
    ctx.lineWidth = 2;
    for (let i = 0; i < explosionTrails.length; i++) {
      const circle = explosionTrails[i];
      const elapsed = now - circle.createdAt;
      const lifePercent = 1 - elapsed / circle.life;

      if (lifePercent <= 0) {
        explosionTrails.splice(i, 1);
        i--;
        continue;
      }

      const fadeCurve = Math.pow(lifePercent, 3);
      const currentRadius = circle.maxRadius * fadeCurve;

      ctx.beginPath();
      ctx.arc(circle.x, circle.y, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = circle.color.replace(
        /[\d\.]+\)$/,
        `${fadeCurve * 0.3})`
      );
      ctx.stroke();

      ctx.fillStyle = circle.color.replace(/[\d\.]+\)$/, `${fadeCurve * 0.1})`);
      ctx.fill();
    }

    // 绘制画笔轨迹（原有，但优化了绘制顺序）
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    lineTrails.sort((a, b) => a.createdAt - b.createdAt);
    
    for (let i = 0; i < lineTrails.length; i++) {
      const line = lineTrails[i];
      const elapsed = now - line.createdAt;
      const lifePercent = 1 - elapsed / line.life;

      if (lifePercent <= 0) {
        lineTrails.splice(i, 1);
        i--;
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(line.fromX, line.fromY);
      ctx.lineTo(line.toX, line.toY);
      ctx.strokeStyle = line.color.replace(
        /[\d\.]+\)$/,
        `${lifePercent * 0.7})`
      );
      ctx.lineWidth = line.width;
      ctx.stroke();
    }

    // 绘制爆炸粒子（原有）
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      p.x += p.velocityX;
      p.y += p.velocityY;
      p.life--;
      p.size *= 0.94;

      if (p.life <= 0 || p.size <= 1) {
        particles.splice(i, 1);
        i--;
      }
    }

    animationId = requestAnimationFrame(animate);
  }

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