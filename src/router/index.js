import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import RoomsView from "../views/RoomsView.vue";
import CreateView from "../views/CreateView.vue";
import GameRoomView from "../views/GameRoomView.vue";
import PrepareView from "../views/PrepareView.vue";
import { useGameStore } from "../stores/gameStore";

const routes = [
  // {
  //   path: "/",
  //   name: "GameRoom",
  //   component: GameRoomView,
  // },
  {
    path: "/",
    name: "Home",
    component: HomeView,
  },
  {
    path: "/rooms",
    name: "Rooms",
    component: RoomsView,
  },
  {
    path: "/prepare/:roomId",
    name: "GamePrepare",
    component: PrepareView,
  },
  {
    path: "/create-room",
    name: "Create",
    component: CreateView,
  },
  {
    path: "/room/:roomId",
    name: "GameRoom",
    component: GameRoomView,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const gameStore = useGameStore();

  if (to.name === "Home") {
    return next();
  }

  if (!gameStore.hasUserData) {
    next({ name: "Home" });
  } else {
    next();
  }
});

export default router;
