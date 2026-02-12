import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import SignUp from '../components/SignUp.vue'
import AdminDashboard from '../components/AdminDashboard.vue'
import ChatWindow from '../components/ChatWindow.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/signup',
    name: 'SignUp',
    component: SignUp
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminDashboard,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/chat',
    name: 'CustomerChat',
    component: ChatWindow,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('assistly_user'))
  const isAuthenticated = !!localStorage.getItem('assistly_token')

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.role && user?.role !== to.meta.role) {
    next(user?.role === 'user' ? '/chat' : '/login')
  } else {
    next()
  }
})

export default router
