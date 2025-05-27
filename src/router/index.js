import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import RoomsView from "../views/RoomsView.vue";
import CreateView from "../views/CreateView.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomeView,
  },
  {
    path: "/rooms",
    name: "Rooms",
    component: RoomsView
  },
  {
    path: "/create-room",
    name: "Create",
    component: CreateView
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
