import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

import './assets/fantasy.css'

import { debug } from "./game/debug";

window.debug = debug;
console.log("Debug tools loaded. Use debug.help()");

createApp(App).use(router).mount('#app')
