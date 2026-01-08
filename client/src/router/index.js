import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/products'
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('../views/Products.vue')
      },
      {
        path: 'cart',
        name: 'Cart',
        component: () => import('../views/Cart.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue')
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('../views/admin/Admin.vue'),
        meta: { requiresAdmin: true },
        children: [
          {
            path: '',
            redirect: '/admin/products'
          },
          {
            path: 'products',
            name: 'AdminProducts',
            component: () => import('../views/admin/ProductManage.vue')
          },
          {
            path: 'users',
            name: 'AdminUsers',
            component: () => import('../views/admin/UserManage.vue')
          },
          {
            path: 'orders',
            name: 'AdminOrders',
            component: () => import('../views/admin/OrderManage.vue')
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user'))

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.guest && token) {
    next('/')
  } else if (to.meta.requiresAdmin && user?.role !== 'admin') {
    next('/')
  } else {
    next()
  }
})

export default router
