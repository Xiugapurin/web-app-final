import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from 'pinia'
import "./style.css";

const app = createApp(App);
const pinia = createPinia()
app.use(router); // 使用路由
app.use(pinia)
app.mount("#app");
