// src/stores/gameStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { SHA256 } from "crypto-js";
import { io } from "socket.io-client";

function generateShortHash(inputString) {
  return SHA256(inputString).toString().substring(0, 8);
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const SOCKET_IO_URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

const BASIC_COLORS = [
  { name: "黑色", hex: "#000000" },
  { name: "白色", hex: "#FFFFFF" },
  { name: "紅色", hex: "#FF0000" },
  { name: "綠色", hex: "#00FF00" },
  { name: "藍色", hex: "#0000FF" },
];

export const useGameStore = defineStore("game", () => {
  const router = useRouter();

  const userName = ref("");
  const userId = ref("");
  const roomId = ref("");
  const socket = ref(null);

  const receivedStrokes = ref([]);
  const receivedColors = ref([]);
  const wsMessages = ref([]);

  const targetImageSrc = ref("");
  const gameColors = ref([]);
  const gameDuration = ref(180);
  const playerList = ref([]);
  const isCurrentUserReady = ref(false);
  const isMatching = ref(false);
  const matchingStatusMessage = ref("");
  const gameHasStarted = ref(false);
  const isCountdownActive = ref(false);
  const countdownSeconds = ref(3);
  let countdownInterval = null;

  const showOpponentDisconnectedModal = ref(false);
  const opponentDisconnectedInfo = ref({ room_id: "", message: "" });

  const showGameOverModal = ref(false);
  const finalGameScores = ref([]);
  const gameWinnerId = ref(null);
  const submissionError = ref("");

  const hasUserData = computed(() => !!userName.value && !!userId.value);
  const isInRoom = computed(() => !!roomId.value && !!socket.value && socket.value.connected);
  const fullColorPalette = computed(() => {
    const combined = [...BASIC_COLORS];
    const existingHexValues = new Set(combined.map((c) => c.hex.toUpperCase()));

    if (Array.isArray(gameColors.value)) {
      gameColors.value.forEach((hexString) => {
        if (hexString && typeof hexString === "string") {
          const upperHexString = hexString.toUpperCase();
          if (!existingHexValues.has(upperHexString)) {
            combined.push({ name: upperHexString, hex: upperHexString });
            existingHexValues.add(upperHexString);
          }
        } else if (typeof hexString === "object" && hexString.hex) {
          const upperHexString = hexString.hex.toUpperCase();
          if (!existingHexValues.has(upperHexString)) {
            combined.push({ name: hexString.name || upperHexString, hex: upperHexString });
            existingHexValues.add(upperHexString);
          }
        }
      });
    }
    return combined;
  });

  const allPlayersActuallyReady = computed(() => {
    if (playerList.value.length === 0) return false;
    return playerList.value.every((player) => player.isReady);
  });

  function setUserName(name) {
    if (!name || typeof name !== "string" || name.trim() === "") {
      console.error("Invalid user name provided.");
      return;
    }
    userName.value = name.trim();
    const timestamp = Date.now().toString();
    userId.value = generateShortHash(`${userName.value}-${timestamp}`);
    console.log(`User set: Name - ${userName.value}, ID - ${userId.value}`);
  }

  async function joinAnonymousRoom() {
    if (!userId.value || !userName.value) {
      alert("請先設定您的名字。");
      return;
    }
    isMatching.value = true;
    matchingStatusMessage.value = "正在隨機配對中，請稍候...";
    try {
      const response = await fetch(`${API_BASE_URL}/match/anonymous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId.value, user_name: userName.value }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `隨機配對失敗： ${response.status}` }));
        throw new Error(errorData.message || `隨機配對失敗： ${response.status}`);
      }
      const data = await response.json();
      const backendGeneratedRoomId = data.room_id || data.roomId;
      if (backendGeneratedRoomId) {
        roomId.value = backendGeneratedRoomId;
        matchingStatusMessage.value = `配對成功！準備進入遊戲...`;
        connectSocketIO();
        setTimeout(() => {
          isMatching.value = false;
          router.push(`/prepare/${roomId.value}`);
        }, 1500);
      } else {
        throw new Error("伺服器未返回房間號碼。");
      }
    } catch (error) {
      console.error("Error joining anonymous room:", error);
      matchingStatusMessage.value = `隨機配對錯誤：${error.message}`;
      setTimeout(() => {
        isMatching.value = false;
      }, 3000);
    }
  }

  async function joinRoomByPasskey(userInputRoomKey) {
    if (!userInputRoomKey || typeof userInputRoomKey !== "string" || userInputRoomKey.trim() === "") {
      alert("請輸入有效的房間鑰匙。");
      return;
    }
    if (!userId.value || !userName.value) {
      alert("請先設定您的名字。");
      return;
    }
    isMatching.value = true;
    matchingStatusMessage.value = `正在加入房間 ${userInputRoomKey.trim()}...`;
    try {
      const response = await fetch(`${API_BASE_URL}/match/passkey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passkey: userInputRoomKey.trim(),
          user_id: userId.value,
          user_name: userName.value,
        }),
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error("使用此鑰匙的房間不存在或已滿。");
        if (response.status === 408) throw new Error("加入房間超時，請稍後再試。");
        const errorData = await response.json().catch(() => ({ message: `加入房間失敗： ${response.status}` }));
        throw new Error(errorData.message || `加入房間失敗： ${response.status}`);
      }
      const data = await response.json();
      if (data.status === "matched" && (data.room_id || data.roomId)) {
        const backendGeneratedRoomId = data.room_id || data.roomId;
        roomId.value = backendGeneratedRoomId;
        matchingStatusMessage.value = `成功加入房間！準備進入遊戲...`;
        connectSocketIO();
        setTimeout(() => {
          isMatching.value = false;
          router.push(`/prepare/${roomId.value}`);
        }, 1500);
      } else {
        throw new Error(data.message || "無法加入房間，伺服器回應無效。");
      }
    } catch (error) {
      console.error("Error joining room by passkey:", error);
      matchingStatusMessage.value = `加入房間錯誤：${error.message}`;
      setTimeout(() => {
        isMatching.value = false;
      }, 3000);
    }
  }

  async function cancelMatchmaking() {
    if (!userId.value) {
      console.warn("Cannot cancel match: User ID is not set.");
      isMatching.value = false;
      matchingStatusMessage.value = "無法取消，使用者資訊缺失。";
      return;
    }
    try {
      console.log(`Attempting to cancel match for user_id: ${userId.value}`);
      const response = await fetch(`${API_BASE_URL}/match/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId.value,
          user_name: userName.value,
        }),
      });
      isMatching.value = false;
      if (response.ok) {
        const data = await response.json();
        if (data.status === "successed" || data.status === "success") {
          matchingStatusMessage.value = "配對已成功取消。";
          console.log("Matchmaking successfully cancelled via API.");
        } else {
          matchingStatusMessage.value = data.message || "配對已取消 (伺服器訊息未知)。";
        }
      } else {
        const errorData = await response.json().catch(() => null);
        matchingStatusMessage.value = `取消配對失敗：${errorData?.message || response.statusText}`;
      }
    } catch (error) {
      isMatching.value = false;
      matchingStatusMessage.value = `取消配對時發生錯誤：${error.message}`;
    }
  }

  async function fetchGameSetupInfo() {
    if (!roomId.value) {
      console.error("No valid Room ID (UUID) available to fetch setup info.");
      return;
    }
    try {
      const [usersResponse, gameInfoResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/game/users?room_id=${roomId.value}`),
        fetch(`${API_BASE_URL}/game/info?room_id=${roomId.value}`),
      ]);

      if (!usersResponse.ok) {
        playerList.value = [];
        if (usersResponse.status !== 404) {
          throw new Error(`Failed to fetch users: ${usersResponse.status}`);
        }
      } else {
        const usersData = await usersResponse.json();
        if (usersData.status === "success") {
          playerList.value = (usersData.users || []).map((userArray) => ({
            id: userArray[0],
            name: userArray[1],
            isReady: false,
          }));
        } else {
          playerList.value = [];
          console.warn(`Fetching users failed: ${usersData.message}`);
        }
      }

      if (!gameInfoResponse.ok) throw new Error(`Failed to fetch game info: ${gameInfoResponse.status}`);
      const gameInfoData = await gameInfoResponse.json();
      if (gameInfoData.status === "success") {
        gameColors.value = gameInfoData.color_list || [];
        if (gameInfoData.image_base64) {
          targetImageSrc.value = `data:image/png;base64,${gameInfoData.image_base64}`;
        } else {
          targetImageSrc.value = "";
        }
      } else {
        throw new Error(gameInfoData.message || "Fetching game info returned 'failed' status.");
      }

      const currentUserInList = playerList.value.find((p) => p.id === userId.value);
      isCurrentUserReady.value = currentUserInList ? currentUserInList.isReady : false;

      console.log("Game setup info fetched successfully.");
    } catch (error) {
      console.error("Error fetching game setup info:", error);
      playerList.value = [];
      gameColors.value = [];
      targetImageSrc.value = "";
      alert(`無法載入遊戲設定：${error.message}`);
    }
  }

  function connectSocketIO() {
    if (!roomId.value || !userId.value) {
      console.error("無法連接 Socket.IO：缺少 Room ID 或 User ID。");
      return;
    }
    if (socket.value && socket.value.connected) {
      console.log("Socket.IO 已連接。");
      socket.value.emit("enter-room", { room_id: roomId.value });
      return;
    }

    console.log(`正在連接到 Socket.IO 伺服器: ${SOCKET_IO_URL}`);
    socket.value = io(SOCKET_IO_URL);

    socket.value.on("connect", () => {
      console.log(`Socket.IO 已連接: Socket ID ${socket.value.id}, User ${userName.value} (${userId.value})`);
      socket.value.emit("enter-room", { room_id: roomId.value });
    });

    socket.value.on("disconnect", (reason) => {
      console.log("Socket.IO 已斷開:", reason);
    });

    socket.value.on("connect_error", (error) => console.error("Socket.IO 連接錯誤:", error));

    socket.value.on("prepare-update", (data) => {
      console.log('Socket.IO "prepare-update":', data);
      const updatedPlayer = playerList.value.find((p) => p.id === data.message.user_id);
      if (updatedPlayer) {
        updatedPlayer.isReady = data.message.prepared;
      }
      if (data.message.user_id === userId.value) {
        isCurrentUserReady.value = data.message.prepared;
      }
    });

    socket.value.on("all-prepared", (data) => {
      console.log('Socket.IO "all-prepared":', data);
      if (data.room_id === roomId.value && !isCountdownActive.value && !gameHasStarted.value) {
        console.log("所有玩家已準備，開始倒數...");
        isCountdownActive.value = true;
        countdownSeconds.value = 3;

        if (countdownInterval) clearInterval(countdownInterval);

        countdownInterval = setInterval(() => {
          if (countdownSeconds.value > 1) {
            countdownSeconds.value--;
          } else {
            clearInterval(countdownInterval);
            countdownInterval = null;
            countdownSeconds.value = 0;
            isCountdownActive.value = false;
            gameHasStarted.value = true;
            console.log(`房間 ${data.room_id} 遊戲開始！`);
          }
        }, 1000);
      }
    });

    socket.value.on("opponent-disconnected", (data) => {
      console.log("收到 opponent-disconnected 事件:", data);
      if (data.room_id === roomId.value) {
        opponentDisconnectedInfo.value = {
          room_id: data.room_id,
          message: `對手已離開房間。\n遊戲已結束。`,
        };
        showOpponentDisconnectedModal.value = true;
      }
    });

    socket.value.on("receive-stroke", (data) => {
      console.log("[STORE] Raw receive-stroke data:", JSON.parse(JSON.stringify(data)));
      if (data.message && data.message.user_id && data.message.user_id !== userId.value) {
        const strokeDataFromServer = data.message;
        receivedStrokes.value.push({
          userId: strokeDataFromServer.user_id,
          strokeData: {
            color: strokeDataFromServer.color,
            path: strokeDataFromServer.path,
            brushSize: strokeDataFromServer.brushSize,
            isEraser: strokeDataFromServer.isEraser,
            operationTimestamp: strokeDataFromServer.operationTimestamp,
            operationType: strokeDataFromServer.operationType,
          },
        });
        console.log("[STORE] Added to receivedStrokes. Current count:", receivedStrokes.value.length);
      } else if (data.message && data.message.user_id === userId.value) {
        console.log("[STORE] Ignored own stroke in receive-stroke handler.");
      } else {
        console.warn("[STORE] Invalid or missing data in receive-stroke:", data);
      }
    });

    socket.value.on("submit-result", (data) => {
      console.log('Socket.IO "submit-result" received:', data);
      gameWinnerId.value = data.winner;
      submissionError.value = "";

      if (data.scores && typeof data.scores === "object") {
        finalGameScores.value = Object.entries(data.scores).map(([usrId, score]) => {
          const player = playerList.value.find((p) => p.id === usrId);
          return {
            id: usrId,
            name: player ? player.name : `玩家 ${usrId.substring(0, 4)}`,
            score: score,
          };
        });
        finalGameScores.value.sort((a, b) => b.score - a.score);
      } else {
        finalGameScores.value = [];
        console.warn("Received submit-result with invalid scores format", data.scores);
      }

      matchingStatusMessage.value =
        gameWinnerId.value === userId.value ? "恭喜你獲勝了！" : (playerList.value.find((p) => p.id === gameWinnerId.value)?.name || "對手") + "獲勝！";
      gameHasStarted.value = false;
      isCurrentUserReady.value = false;
      showGameOverModal.value = true;
    });

    socket.value.on("submit-error", (data) => {
      console.error('Socket.IO "submit-error" received:', data);
      submissionError.value = data.message || "提交作品時發生未知錯誤。";
      finalGameScores.value = [];
      gameWinnerId.value = null;
      matchingStatusMessage.value = `錯誤：${submissionError.value}`;
      gameHasStarted.value = false;
      isCurrentUserReady.value = false;
      showGameOverModal.value = true;
    });
  }

  function toggleReadyState() {
    if (isCurrentUserReady.value) {
      console.log("用戶已準備，不可取消。");
      return;
    }
    if (!socket.value || !socket.value.connected) {
      alert("Socket.IO 未連接，無法設定準備狀態。");
      return;
    }
    if (!userId.value || !roomId.value) {
      alert("使用者或房間資訊未設定。");
      return;
    }

    isCurrentUserReady.value = true;

    const playerInList = playerList.value.find((p) => p.id === userId.value);
    if (playerInList) {
      playerInList.isReady = true;
    }

    socket.value.emit("prepare", {
      room_id: roomId.value,
      user_id: userId.value,
    });
    console.log(`使用者 ${userName.value} 發送準備事件。`);

    socket.value.emit("check-prepare", { room_id: roomId.value });
  }

  function checkAllPlayersPrepared() {
    if (socket.value && socket.value.connected && roomId.value) {
      console.log(`Client requesting server to check prepare status for room ${roomId.value}`);
      socket.value.emit("check-prepare", { room_id: roomId.value });
    } else {
      console.warn("Cannot check prepare status: Socket not connected or no room ID.");
    }
  }

  function disconnectSocketIO() {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      isCountdownActive.value = false;
      countdownSeconds.value = 3;
      console.log("Socket.IO disconnected.");
    }
  }

  function emitSubmitDrawing(base64String) {
    if (socket.value && socket.value.connected && roomId.value && userId.value) {
      const payload = {
        room_id: roomId.value,
        user_id: userId.value,
        base64_str: base64String,
      };
      socket.value.emit("submit", payload);
      console.log(`Socket.IO "submit" emitted for user ${userId.value}`);
      matchingStatusMessage.value = "作品已提交，正在等待對手及伺服器計算結果...";
    } else {
      console.error("Socket.IO 未連接或缺少必要資訊，無法提交繪圖。");
      alert("連線錯誤，無法提交您的作品！");
    }
  }

  function emitStroke(strokeDetails) {
    if (socket.value && socket.value.connected && roomId.value && userId.value) {
      const payload = {
        room_id: roomId.value,
        user_id: userId.value,
        color: strokeDetails.color,
        path: strokeDetails.path,
        brushSize: strokeDetails.brushSize,
        isEraser: strokeDetails.isEraser,
        operationTimestamp: strokeDetails.operationTimestamp,
        operationType: strokeDetails.operationType,
      };
      socket.value.emit("stroke", payload);
    } else {
      console.error("Socket.IO 未連接，無法發送 stroke。");
    }
  }

  function acknowledgeOpponentDisconnected() {
    showOpponentDisconnectedModal.value = false;
    opponentDisconnectedInfo.value = { room_id: "", message: "" };

    disconnectSocketIO();
    roomId.value = "";
    targetImageSrc.value = "";
    gameColors.value = [];
    playerList.value = [];
    isCurrentUserReady.value = false;
    gameHasStarted.value = false;
    receivedColors.value = [];
    receivedStrokes.value = [];
    wsMessages.value = [];

    console.log("對手斷線處理完畢，導航回主頁。");
    router.push("/");
  }

  function acknowledgeGameOver() {
    showGameOverModal.value = false;
    finalGameScores.value = [];
    gameWinnerId.value = null;
    submissionError.value = "";

    disconnectSocketIO();
    roomId.value = "";
    targetImageSrc.value = "";
    gameColors.value = [];
    playerList.value = [];
    isCurrentUserReady.value = false;
    gameHasStarted.value = false;
    receivedStrokes.value = [];

    router.push("/");
  }

  function cleanupUserAndRoom() {
    disconnectSocketIO();
    userName.value = "";
    userId.value = "";
    roomId.value = "";
    targetImageSrc.value = "";
    gameColors.value = [];
    playerList.value = [];
    isCurrentUserReady.value = false;
    isMatching.value = false;
    matchingStatusMessage.value = "";
    gameHasStarted.value = false;
    receivedStrokes.value = [];
    showOpponentDisconnectedModal.value = false;
    opponentDisconnectedInfo.value = { room_id: "", message: "" };
    showGameOverModal.value = false;
    finalGameScores.value = [];
    gameWinnerId.value = null;
    submissionError.value = "";
    console.log("User and room data completely cleaned up.");
  }

  return {
    // State
    userName,
    userId,
    roomId,
    socket,
    receivedStrokes,
    targetImageSrc,
    fullColorPalette,
    gameDuration,
    playerList,
    isCurrentUserReady,
    isMatching,
    matchingStatusMessage,
    gameHasStarted,
    showOpponentDisconnectedModal,
    opponentDisconnectedInfo,
    showGameOverModal,
    finalGameScores,
    gameWinnerId,
    submissionError,

    // Getters
    hasUserData,
    isInRoom,
    allPlayersActuallyReady,

    // Actions
    setUserName,
    joinAnonymousRoom,
    joinRoomByPasskey,
    cancelMatchmaking,
    fetchGameSetupInfo,
    connectSocketIO,
    disconnectSocketIO,
    toggleReadyState,
    checkAllPlayersPrepared,
    emitStroke,
    emitSubmitDrawing,
    cleanupUserAndRoom,
    acknowledgeOpponentDisconnected,
    acknowledgeGameOver,
  };
});
