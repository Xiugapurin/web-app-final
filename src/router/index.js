import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import GameRoomView from "../views/GameRoomView.vue";

const routes = [
  // {
  //   path: "/",
  //   name: "Home",
  //   component: HomeView,
  // },
  {
    path: "/",
    name: "Home",
    component: GameRoomView,
  },
  {
    path: "/room/:roomId",
    name: "GameRoom",
    component: () => import("../views/GameRoomView.vue"),
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
