import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Products from './views/Products.vue';
import Rates from './views/Rates.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/rates', name: 'rates', component: Rates },
    { path: '/products', name: 'products', component: Products },
  ],
});
