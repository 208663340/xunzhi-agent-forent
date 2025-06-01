import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: string
  username: string
  avatar?: string
  phone?: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = ref(false)

  const login = (userData: User) => {
    user.value = userData
    isLoggedIn.value = true
    // 这里可以添加本地存储逻辑
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('isLoggedIn', 'true')
  }

  const logout = () => {
    user.value = null
    isLoggedIn.value = false
    localStorage.removeItem('user')
    localStorage.removeItem('isLoggedIn')
  }

  const initUser = () => {
    const savedUser = localStorage.getItem('user')
    const savedLoginStatus = localStorage.getItem('isLoggedIn')
    
    if (savedUser && savedLoginStatus === 'true') {
      user.value = JSON.parse(savedUser)
      isLoggedIn.value = true
    }
  }

  return {
    user,
    isLoggedIn,
    login,
    logout,
    initUser
  }
})