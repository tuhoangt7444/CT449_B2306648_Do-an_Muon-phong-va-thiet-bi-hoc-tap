import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useThemeStore } from './stores/theme';
import './assets/styles/base.css';
// tạo ứng dụng Vue
const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const themeStore = useThemeStore();
themeStore.initializeTheme(); // khởi tạo chế độ sáng/tối
//Gắn ứng dụng vào phần tử DOM có id là 'app'
app.mount('#app');
