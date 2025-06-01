<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 处理用户头像点击
const handleAvatarClick = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
  }
}

// 处理退出登录
const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

// 获取转场动画名称
const getTransitionName = (route: any) => {
  // 登录注册页面使用滑动动画
  if (route.path === '/login' || route.path === '/register') {
    return 'slide'
  }
  // 其他页面使用淡入淡出动画
  return 'fade'
}

// 初始化用户状态
onMounted(() => {
  userStore.initUser()
})
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-content">
        <!-- 左侧Logo和标题 -->
        <div class="header-left">
          <div class="logo-section">
            <el-icon class="logo-icon" size="32"><ChatDotRound /></el-icon>
            <span class="app-title">智能问答助手</span>
          </div>
        </div>
        
        <!-- 中间导航 -->
        <nav class="header-nav">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/about" class="nav-link">关于</router-link>
        </nav>
        
        <!-- 右侧用户区域 -->
        <div class="header-right">
          <div class="user-section">
            <el-dropdown v-if="userStore.isLoggedIn" @command="handleLogout">
              <div class="user-info" @click="handleAvatarClick">
                <el-avatar :src="userStore.user?.avatar" size="small">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span class="username">{{ userStore.user?.username }}</span>
                <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            
            <div v-else class="user-info" @click="handleAvatarClick">
              <el-avatar size="small">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="username">未登录</span>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- 主要内容区域 -->
    <main class="app-main">
      <router-view v-slot="{ Component, route }">
        <transition :name="getTransitionName(route)" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  flex: 1;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  color: #409eff;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-nav {
  display: flex;
  gap: 32px;
}

.nav-link {
  color: #666;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  padding: 8px 0;
  position: relative;
  transition: color 0.3s;
}

.nav-link:hover {
  color: #409eff;
}

.nav-link.router-link-active {
  color: #409eff;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #409eff;
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.user-section {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.dropdown-icon {
  font-size: 12px;
  color: #999;
  transition: transform 0.3s;
}

.el-dropdown:hover .dropdown-icon {
  transform: rotate(180deg);
}

.app-main {
  flex: 1;
  background: #f5f7fa;
  position: relative;
  overflow: hidden;
}

/* 转场动画样式 */
/* 滑动动画 - 用于登录注册页面 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: absolute;
  width: 100%;
  height: 100%;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 淡入淡出动画 - 用于其他页面 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease-in-out;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 响应式设计 */
@media (min-width: 1600px) {
  .header-content {
    max-width: 1600px;
    padding: 0 60px;
  }
}

@media (max-width: 1024px) {
  .header-content {
    max-width: 100%;
    padding: 0 24px;
  }
  
  .header-nav {
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }
  
  .header-nav {
    display: none;
  }
  
  .app-title {
    font-size: 18px;
  }
  
  .username {
    display: none;
  }
}
</style>
