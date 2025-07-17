import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('../views/AboutView.vue'),
        },

        {
          path: 'chat/:sessionId?',
          name: 'chat',
          component: () => import('../views/ChatView.vue'),
        },
        {
          path: 'agent-market',
          name: 'agent-market',
          component: () => import('../views/AgentMarketView.vue'),
        },


        {
          path: 'interview',
          name: 'interview',
          component: () => import('../views/InterviewView.vue'),
        },
      ],
    },
    // 独立页面（不使用MainLayout）
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
  ],
})

export default router
