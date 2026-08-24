import { createApp } from 'vue'
import App from './vue/App.vue'
import router from './vue/router'
import './index.css'

document.documentElement.dataset.theme = 'dark'

createApp(App).use(router).mount('#app')
