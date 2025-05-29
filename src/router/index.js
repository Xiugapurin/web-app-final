import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import RoomsView from "../views/RoomsView.vue";
import CreateView from "../views/CreateView.vue";
import { useUserStore } from "../stores/User";

const routes = [
  // {
  //   path: "/",
  //   name: "Home",
  //   component: HomeView,
  // },
  {
    path: "/",
    name: "Home",
    component: HomeView
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

router.beforeEach((to, from, next) => {
  const user = useUserStore()
  
  // 如果目標路由就是首頁，直接允許
  if (to.name === 'Home') {
    return next()
  }
  
  // 其他路由檢查用戶名
  if (!user.name) {
    next('/') // 跳轉到首頁
  } else {
    next() // 允許導航
  }
})

export default router;


