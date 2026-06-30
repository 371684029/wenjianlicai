import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Products from './views/Products.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/products', name: 'products', component: Products },
  ],
});
