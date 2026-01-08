import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, userApi } from '../api'
import router from '../router'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const token = ref(localStorage.getItem('token') || null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const points = computed(() => user.value?.points || 0)

  async function login(username, password) {
    const data = await authApi.login({ username, password })
    user.value = data
    token.value = data.token
    localStorage.setItem('user', JSON.stringify(data))
    localStorage.setItem('token', data.token)
    return data
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    router.push('/login')
  }

  async function fetchUser() {
    if (!token.value) return
    const data = await userApi.getMe()
    user.value = { ...user.value, ...data }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  async function updateProfile(data) {
    const updated = await userApi.updateMe(data)
    user.value = { ...user.value, ...updated }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  async function changePassword(oldPassword, newPassword) {
    await authApi.changePassword({ oldPassword, newPassword })
    if (user.value) {
      user.value.isFirstLogin = false
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  function updatePoints(newPoints) {
    if (user.value) {
      user.value.points = newPoints
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    isAdmin,
    points,
    login,
    logout,
    fetchUser,
    updateProfile,
    changePassword,
    updatePoints
  }
})
