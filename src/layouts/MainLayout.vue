<template>
  <div class="main-layout">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-content">
        <!-- 左侧Logo、标题和导航整体 -->
        <div class="header-left">
          <div class="logo-section">
            <el-icon class="logo-icon" size="32">
              <ChatDotRound />
            </el-icon>
            <span class="app-title">迅智多模态评测平台</span>
          </div>

          <!-- 导航栏 -->
          <nav class="header-nav">
            <router-link to="/" class="nav-link">首页</router-link>
            <router-link to="/chat" class="nav-link" :class="{ 'router-link-active': isChatActive }">对话</router-link>
            <router-link to="/agent-market" class="nav-link">Agent广场</router-link>
            <router-link to="/interview" class="nav-link">面试室</router-link>
            <router-link to="/about" class="nav-link">关于</router-link>
          </nav>
        </div>

        <!-- 右侧用户区域 -->
        <div class="header-right">
          <div class="user-section">
            <el-dropdown v-if="userStore.isLoggedIn" @command="handleLogout">
              <div class="user-info" @click="handleAvatarClick">
                <el-avatar :src="userStore.user?.avatar" size="small">
                  <el-icon>
                    <User />
                  </el-icon>
                </el-avatar>
                <span class="username">{{ userStore.user?.username }}</span>
                <el-icon class="dropdown-icon">
                  <ArrowDown />
                </el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">
                    <el-icon>
                      <SwitchButton />
                    </el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <div v-else class="user-info" @click="handleAvatarClick">
              <el-avatar size="small">
                <el-icon>
                  <User />
                </el-icon>
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
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>

    <!-- 登录模态框 -->
    <LoginModal v-model="showLoginModal" @switch-to-register="switchToRegister" />

    <!-- 注册模态框 -->
    <RegisterModal v-model="showRegisterModal" @switch-to-login="switchToLogin" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import {
  ChatDotRound,
  User,
  ArrowDown,
  SwitchButton
} from '@element-plus/icons-vue'
import LoginModal from '../components/LoginModal.vue'
import RegisterModal from '../components/RegisterModal.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 计算当前路由是否为聊天页面
const isChatActive = computed(() => {
  return route.path.startsWith('/chat')
})

// 模态框状态
const showLoginModal = ref(false)
const showRegisterModal = ref(false)

// 处理用户头像点击
const handleAvatarClick = () => {
  if (!userStore.isLoggedIn) {
    showLoginModal.value = true
  }
}

// 处理退出登录
const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

// 切换到注册模态框
const switchToRegister = () => {
  showLoginModal.value = false
  showRegisterModal.value = true
}

// 切换到登录模态框
const switchToLogin = () => {
  showRegisterModal.value = false
  showLoginModal.value = true
}
</script>

<style scoped>
.main-layout {
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
  width: 100%;
  padding: 0 20px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
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
  background: transparent;
  position: relative;
}

/* 转场动画 */
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
@media (max-width: 1024px) {
  .header-content {
    padding: 0 16px;
  }

  .header-nav {
    gap: 24px;
  }

  .header-left {
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 12px;
  }

  .header-left {
    gap: 16px;
  }

  .header-nav {
    gap: 16px;
  }

  .nav-link {
    font-size: 14px;
  }

  .app-title {
    font-size: 18px;
  }

  .username {
    display: none;
  }
}

@media (max-width: 480px) {
  .header-nav {
    display: none;
  }

  .app-title {
    font-size: 16px;
  }
}
</style>
