<template>
    <div class="flex flex-col w-full justify-center items-center gap-8">
        <h2 class="text-5xl">Home Page</h2>
        <p class="text-xl">This is home page.</p>
        <p class="text-xl">Implement join room & create room functionality.</p>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const roomIdInput = ref('')
const router = useRouter()
</script>