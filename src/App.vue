<template>
  <div id="app-container" class="flex flex-col min-h-screen">
    <main class="grow py-4 px-16 bg-[#f4f4f4]">
      <router-view />
    </main>
    <MatchingStatusModal
      :show="gameStore.isMatching"
      :status-message="gameStore.matchingStatusMessage"
      :cancellable="true" 
    />
    <OpponentDisconnectedModal
      :show="gameStore.showOpponentDisconnectedModal"
      :message="gameStore.opponentDisconnectedInfo.message"
    />
    <GameOverModal
      :show="gameStore.showGameOverModal"
      :scores="gameStore.finalGameScores"
      :message="gameStore.matchingStatusMessage"
      :winner-id="gameStore.gameWinnerId"
      :error-message="gameStore.submissionError"
    />

  </div>
</template>

<script setup>
import { useGameStore } from './stores/gameStore';

import OpponentDisconnectedModal from './components/OpponentDisconnectedModal.vue';
import MatchingStatusModal from './components/MatchingStatusModal.vue';
import GameOverModal from './components/GameOverModal.vue';

const gameStore = useGameStore();
</script>