<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    @click.self="closePalette"
  >
    <div class="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
      <h3 class="text-2xl font-semibold mb-6 text-center text-purple-400">Color Palette</h3>
      <div class="space-y-6">
        <div class="flex items-center space-x-4">
          <label for="mixColor1" class="w-20 text-gray-300">Color 1:</label>
          <select v-model="mixerColor1" id="mixColor1" class="p-2 rounded bg-gray-700 text-white border border-gray-600 flex-grow focus:ring-purple-500 focus:border-purple-500">
            <option disabled value="">Select color</option>
            <option v-for="color in availableColorsForMixing" :key="'m1'+color.name" :value="color.hex">{{ color.name }}</option>
          </select>
          <div class="w-8 h-8 rounded" :style="{ backgroundColor: mixerColor1 || 'transparent' }"></div>
        </div>
        <div class="flex items-center space-x-4">
          <label for="mixColor2" class="w-20 text-gray-300">Color 2:</label>
          <select v-model="mixerColor2" id="mixColor2" class="p-2 rounded bg-gray-700 text-white border border-gray-600 flex-grow focus:ring-purple-500 focus:border-purple-500">
            <option disabled value="">Select color</option>
            <option v-for="color in availableColorsForMixing" :key="'m2'+color.name" :value="color.hex">{{ color.name }}</option>
          </select>
          <div class="w-8 h-8 rounded" :style="{ backgroundColor: mixerColor2 || 'transparent' }"></div>
        </div>
      </div>
      <div class="mt-8 text-center">
        <div v-if="mixedResultColor" class="mb-4">
          <p class="text-gray-300">Mixed Result:</p>
          <div class="w-16 h-16 rounded-lg mx-auto my-2 border-2 border-gray-500" :style="{ backgroundColor: mixedResultColor }"></div>
        </div>
        <button
          @click="performMixColors"
          :disabled="!mixerColor1 || !mixerColor2"
          class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
        >
          Mix Colors
        </button>
        <button
          @click="emitNewMixedColor"
          v-if="mixedResultColor"
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150"
        >
          Add to My Colors
        </button>
         <button
          @click="closePalette"
          class="mt-4 sm:mt-0 sm:ml-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  show: Boolean,
  basicColors: {
    type: Array,
    default: () => []
  },
  currentMixedColors: { // Pass the array of mixed color hex strings
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'new-color-mixed']);

const mixerColor1 = ref('');
const mixerColor2 = ref('');
const mixedResultColor = ref('');

const availableColorsForMixing = computed(() => {
  const allColors = [...props.basicColors]; // props.basicColors is already reactive array of objects
  props.currentMixedColors.forEach(hexColor => {
    if (!allColors.find(c => c.hex === hexColor)) {
      // Ensure unique name for select options if hex is same as a basic color (unlikely but good practice)
      const existingName = props.basicColors.find(bc => bc.hex === hexColor)?.name;
      allColors.push({ name: existingName || `Mixed (${hexColor.slice(0,7)})`, hex: hexColor });
    }
  });
  return allColors;
});

const performMixColors = () => {
  if (!mixerColor1.value || !mixerColor2.value) return;
  const c1 = parseInt(mixerColor1.value.slice(1), 16);
  const c2 = parseInt(mixerColor2.value.slice(1), 16);

  const r1 = (c1 >> 16) & 0xFF; const g1 = (c1 >> 8) & 0xFF; const b1 = c1 & 0xFF;
  const r2 = (c2 >> 16) & 0xFF; const g2 = (c2 >> 8) & 0xFF; const b2 = c2 & 0xFF;

  const r = Math.floor((r1 + r2) / 2);
  const g = Math.floor((g1 + g2) / 2);
  const b = Math.floor((b1 + b2) / 2);

  const toHex = (c) => c.toString(16).padStart(2, '0');
  mixedResultColor.value = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const emitNewMixedColor = () => {
  if (mixedResultColor.value) {
    emit('new-color-mixed', mixedResultColor.value);
    // Optionally reset after emitting
    // mixerColor1.value = '';
    // mixerColor2.value = '';
    // mixedResultColor.value = '';
  }
};

const closePalette = () => {
  emit('close');
};

watch(() => props.show, (newVal) => {
  if (!newVal) { // Reset when modal is hidden
    mixerColor1.value = '';
    mixerColor2.value = '';
    mixedResultColor.value = '';
  }
});
</script>