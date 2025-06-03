<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { onMounted, ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

// 模态框状态
const showLoginModal = ref(false)
const showRegisterModal = ref(false)

// 表单引用
const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const loginLoading = ref(false)
const registerLoading = ref(false)

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
})

// 注册表单
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
})

// 密码确认验证
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 登录表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
}

// 注册表单验证规则
const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
}

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

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate((valid) => {
    if (valid) {
      loginLoading.value = true

      // 模拟登录API调用
      setTimeout(() => {
        const userData = {
          id: '1',
          username: loginForm.username,
          avatar: '',
        }

        userStore.login(userData)
        ElMessage.success('登录成功')
        showLoginModal.value = false
        loginLoading.value = false

        // 重置表单
        loginForm.username = ''
        loginForm.password = ''
      }, 1000)
    }
  })
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return

  await registerFormRef.value.validate((valid) => {
    if (valid) {
      registerLoading.value = true

      // 模拟注册API调用
      setTimeout(() => {
        ElMessage.success('注册成功，请登录')
        registerLoading.value = false
        showRegisterModal.value = false
        showLoginModal.value = true

        // 重置表单
        registerForm.username = ''
        registerForm.password = ''
        registerForm.confirmPassword = ''
        registerForm.phone = ''
      }, 1000)
    }
  })
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

// 获取转场动画名称
const getTransitionName = (route: any) => {
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
        <!-- 左侧Logo、标题和导航整体 -->
        <div class="header-left">
          <div class="logo-section">
            <el-icon class="logo-icon" size="32"><ChatDotRound /></el-icon>
            <span class="app-title">迅智多模态评测平台</span>
          </div>

          <!-- 导航栏 -->
          <nav class="header-nav">
            <router-link to="/" class="nav-link">首页</router-link>
            <router-link to="/chat" class="nav-link">对话</router-link>
            <router-link to="/agent-market" class="nav-link">Agent广场</router-link>
            <router-link to="/about" class="nav-link">关于</router-link>
            <router-link to="/camera" class="nav-link">摄像头</router-link>
            <router-link to="/microphone" class="nav-link">麦克风</router-link>
          </nav>
        </div>

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

    <!-- 登录模态框 -->
    <el-dialog
      v-model="showLoginModal"
      title=""
      width="400px"
      :show-close="false"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      class="auth-dialog"
    >
      <div class="auth-card">
        <div class="auth-header">
          <h2>登录</h2>
          <p>欢迎使用迅智多模态评测平台</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="auth-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <div class="auth-buttons">
              <el-button
                type="primary"
                size="large"
                class="auth-btn primary"
                :loading="loginLoading"
                @click="handleLogin"
              >
                登录
              </el-button>
              <el-button size="large" class="auth-btn cancel" @click="showLoginModal = false">
                取消
              </el-button>
            </div>
          </el-form-item>
        </el-form>

        <div class="auth-footer">
          <span>还没有账号？</span>
          <el-button type="text" @click="switchToRegister">立即注册</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 注册模态框 -->
    <el-dialog
      v-model="showRegisterModal"
      title=""
      width="420px"
      :show-close="false"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      class="auth-dialog"
    >
      <div class="auth-card">
        <div class="auth-header">
          <h2>注册账号</h2>
          <p>创建您的迅智多模态评测平台账号</p>
        </div>

        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="auth-form"
          @submit.prevent="handleRegister"
        >
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名"
              size="large"
              prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="phone">
            <el-input
              v-model="registerForm.phone"
              placeholder="请输入手机号"
              size="large"
              prefix-icon="Phone"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              size="large"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <div class="auth-buttons">
              <el-button
                type="primary"
                size="large"
                class="auth-btn primary"
                :loading="registerLoading"
                @click="handleRegister"
              >
                注册
              </el-button>
              <el-button size="large" class="auth-btn cancel" @click="showRegisterModal = false">
                取消
              </el-button>
            </div>
          </el-form-item>
        </el-form>

        <div class="auth-footer">
          <span>已有账号？</span>
          <el-button type="text" @click="switchToLogin">立即登录</el-button>
        </div>
      </div>
    </el-dialog>
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

/* 认证模态框样式 */
.auth-dialog {
  .el-dialog {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border: none;
  }

  .el-dialog__body {
    padding: 0;
  }
}

.auth-card {
  padding: 2rem;
  background: white;
  color: #333;
  position: relative;
  overflow: hidden;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.8rem;
    font-weight: 600;
    color: #333;
  }

  p {
    margin: 0;
    opacity: 0.7;
    font-size: 0.95rem;
    color: #666;
  }
}

.auth-form {
  position: relative;
  z-index: 1;

  .el-form-item {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .el-input {
    .el-input__wrapper {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &:hover {
        background: #fff;
        border-color: #409eff;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
      }

      &.is-focus {
        background: #fff;
        border-color: #409eff;
        box-shadow: 0 6px 16px rgba(64, 158, 255, 0.2);
        transform: translateY(-2px);
      }
    }

    .el-input__inner {
      color: #333;
      font-weight: 500;

      &::placeholder {
        color: #999;
      }
    }
  }
}

.auth-buttons {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.auth-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &.primary {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    border: none;
    color: white;
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(64, 158, 255, 0.4);
      background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
    }
  }

  &.cancel {
    background: #f5f7fa;
    border: 1px solid #dcdfe6;
    color: #606266;

    &:hover {
      background: #ecf5ff;
      border-color: #409eff;
      color: #409eff;
      transform: translateY(-1px);
    }
  }

  &:active {
    transform: translateY(0);
  }
}

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  position: relative;
  z-index: 1;

  span {
    color: #666;
    font-size: 0.9rem;
  }

  .el-button {
    color: #409eff;
    font-weight: 600;
    text-decoration: underline;
    padding: 0 0.5rem;

    &:hover {
      color: #66b1ff;
      background: transparent;
    }
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
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

  .auth-dialog {
    .el-dialog {
      width: 90% !important;
      margin: 5vh auto;
    }
  }

  .auth-card {
    padding: 1.5rem;
  }

  .auth-header h2 {
    font-size: 1.5rem;
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
