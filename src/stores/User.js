import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const name = ref('')
  function setUserName(newName) {
    name.value = newName
  }

  return { name, setUserName }
})