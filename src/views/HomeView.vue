<template>
    <div class="flex flex-col w-full justify-center items-center gap-8">
        <!-- <h2 class="text-5xl">Home Page</h2>
        <p class="text-xl">This is home page.</p>
        <p class="text-xl">Implement join room & create room functionality.</p> -->
        <div class="flex mt-16 w-[60%] h-[60vh] bg-white rounded-xl overflow-hidden items-center">
            <!-- 左侧区域 -->
            <div class="flex-1 "></div>
            
            <!-- 灰色分隔线（垂直居中且高度80%） -->
            <div class="w-1 bg-gray-300 h-[60%]"></div>
            
            <!-- 右侧区域 -->
            <div class="flex-1"></div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const roomIdInput = ref('')
const router = useRouter()
</script>