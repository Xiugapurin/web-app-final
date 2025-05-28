import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useRoomsStore = defineStore('rooms', () => {
  const roomList = ref([])
  function addRoom(room) {
    roomList.value.push(room)
  }

  function removeRoom(room) {
    roomList.value.pop(room)
  }

  return { roomList, addRoom, removeRoom }
})