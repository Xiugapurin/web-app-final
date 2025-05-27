<template>
  <div
    class="w-[200px] h-[120px] hover:bg-gray-100 rounded-xl p-3 flex flex-col cursor-pointer transition-all duration-200 shadow-md border-2"
    :class="{
      'bg-gray-100': selected,
      'bg-gray-200': !selected,
      'border-orange-500 bg-blue-50': selected,
      'border-transparent hover:border-gray-200': !selected,
      'hover:-translate-y-0.5 hover:shadow-lg': !selected,
    }"
    @click="$emit('select', room.id)"
  >
    <div class="flex justify-between mb-2 pb-2 border-b-2 border-gray-300">
      <h3 class="font-bold text-gray-800 text-base truncate max-w-[70%]">
        {{ room.name }}
      </h3>
      <span class="text-gray-500 text-xs"> #{{ room.id }} </span>
    </div>

    <div class="flex flex-col justify-between flex-grow">
      <div class="flex justify-between text-gray-600 text-sm">
        <span>{{ room.currentPlayers }}/{{ room.maxPlayers }}</span>
        <!-- <span>{{ room.language }}</span> -->
      </div>
      <div class="text-gray-500 text-xs text-right">
        <span>{{ room.timeElapsed }}/{{ room.maxTime }}分鐘</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  room: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});
</script>
