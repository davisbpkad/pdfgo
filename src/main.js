/**
 * main.js - Master Vue 3 Application Entry
 * 100% Client-Side, Zero Network, Clean Code
 */

import './styles/tailwind.css';
import './styles/main.css';

import { createApp } from 'vue';
import App from './App.vue';
import { initTheme } from './core/theme.js';
import { initPdfJsWorker } from './core/workers.js';

// Initialize global workers and theme
initTheme();
initPdfJsWorker();

// Mount root Vue component
const app = createApp(App);
app.mount('#app');
