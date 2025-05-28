import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useRoomsStore = defineStore('rooms', () => {
  const roomList = ref([])
  
  function addRoom(room) {
    roomList.value.push(room)
  }

  function removeRoom(roomId) { 
    roomList.value = roomList.value.filter(room => room.id !== roomId)
  }

  return { roomList, addRoom, removeRoom }
})