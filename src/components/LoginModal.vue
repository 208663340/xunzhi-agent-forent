<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
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
            <el-button
              size="large"
              class="auth-btn cancel"
              @click="$emit('update:modelValue', false)"
            >
              取消
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <div class="auth-footer">
        <span>还没有账号？</span>
        <el-button type="text" @click="$emit('switch-to-register')">立即注册</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'switch-to-register': []
}>()

const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()
const loginLoading = ref(false)

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
})

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

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loginLoading.value = true

      try {
        console.log('开始登录请求:', loginForm)

        // 调用真实登录API
        const response = await userApi.login({
          username: loginForm.username,
          password: loginForm.password
        })

        console.log('登录响应:', response)

        if (response.data.success) {
          // 保存token
          localStorage.setItem('token', response.data.data.token)

          const userData = {
            id: response.data.data.id || '1',
            username: loginForm.username,
            avatar: response.data.data.avatar || '',
          }

          userStore.login(userData)
          ElMessage.success('登录成功')

          // 关闭模态框并重置表单
          loginForm.username = ''
          loginForm.password = ''

          // 通过emit关闭模态框
          emit('update:modelValue', false)
        } else {
          ElMessage.error(response.data.message || '登录失败')
        }
      } catch (error) {
        console.error('登录错误:', error)
        ElMessage.error('登录失败，请检查网络连接')
      } finally {
        loginLoading.value = false
      }
    }
  })
}
</script>

<style scoped>
/* 认证模态框样式 */
.auth-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border: none;
}

.auth-dialog :deep(.el-dialog__body) {
  padding: 0;
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
}

.auth-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
}

.auth-header p {
  margin: 0;
  opacity: 0.7;
  font-size: 0.95rem;
  color: #666;
}

.auth-form {
  position: relative;
  z-index: 1;
}

.auth-form .el-form-item {
  margin-bottom: 1.5rem;
}

.auth-form .el-form-item:last-child {
  margin-bottom: 0;
}

.auth-form :deep(.el-input__wrapper) {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.auth-form :deep(.el-input__wrapper:hover) {
  background: #fff;
  border-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.auth-form :deep(.el-input__wrapper.is-focus) {
  background: #fff;
  border-color: #409eff;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
}

.auth-form :deep(.el-input__inner) {
  color: #333;
  font-weight: 500;
}

.auth-form :deep(.el-input__inner::placeholder) {
  color: #999;
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
}

.auth-btn.primary {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  color: white;
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.3);
}

.auth-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.4);
  background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
}

.auth-btn.cancel {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  color: #606266;
}

.auth-btn.cancel:hover {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
  transform: translateY(-1px);
}

.auth-btn:active {
  transform: translateY(0);
}

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  position: relative;
  z-index: 1;
}

.auth-footer span {
  color: #666;
  font-size: 0.9rem;
}

.auth-footer .el-button {
  color: #409eff;
  font-weight: 600;
  text-decoration: underline;
  padding: 0 0.5rem;
}

.auth-footer .el-button:hover {
  color: #66b1ff;
  background: transparent;
}
</style>
