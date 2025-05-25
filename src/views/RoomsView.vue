<template>
  <div class="flex flex-col w-full justify-center items-center gap-8">
    <p>rooms</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const roomIdInput = ref("");
const router = useRouter();
</script>
