<template>
  <div id="app-container" class="flex flex-col min-h-screen">
    <main class="grow py-4 px-16 bg-[#f4f4f4]">
      <router-view />
    </main>
    <OpponentDisconnectedModal
      :show="gameStore.showOpponentDisconnectedModal"
      :message="gameStore.opponentDisconnectedInfo.message"
    />
  </div>
</template>

<script setup>
import { useGameStore } from './stores/gameStore';

import OpponentDisconnectedModal from './components/OpponentDisconnectedModal.vue';
import MatchingStatusModal from './components/MatchingStatusModal.vue';

const gameStore = useGameStore();
</script>