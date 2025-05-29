import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import RoomsView from "../views/RoomsView.vue";
import CreateView from "../views/CreateView.vue";
import GameRoomView from "../views/GameRoomView.vue";
import { useUserStore } from "../stores/User";

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
  const user = useUserStore();

  if (to.name === "Home") {
    return next();
  }

  if (!user.name) {
    next("/");
  } else {
    next();
  }
});

export default router;
