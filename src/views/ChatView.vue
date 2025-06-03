<template>
  <div class="chat-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- Agent广场入口 -->
      <div class="agent-market-entry">
        <el-button type="success" size="small" @click="goToAgentMarket" class="market-button">
          <el-icon><Grid /></el-icon>
          Agent广场
        </el-button>
      </div>

      <div class="sidebar-header">
        <h3>历史会话</h3>
        <el-button type="primary" size="small" @click="createNewSession">
          <el-icon><Plus /></el-icon>
          新建对话
        </el-button>
      </div>
      <div class="session-list">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: session.id === currentSessionId }"
          @click="switchSession(session.id)"
        >
          <div class="session-title">{{ session.title }}</div>
          <div class="session-time">{{ formatSessionTime(session.lastMessage) }}</div>
        </div>
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="chat-main">
      <!-- 消息列表 -->
      <div ref="messagesContainer" class="messages-container">
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-content">
            <el-icon class="welcome-icon" size="48"><ChatDotRound /></el-icon>
            <h3>欢迎使用智能问答系统</h3>
            <p>我是您的AI助手，有什么问题可以随时问我</p>
          </div>
        </div>

        <div
          v-for="(message, index) in messages"
          :key="index"
          class="message-item"
          :class="{ 'user-message': message.type === 'user', 'ai-message': message.type === 'ai' }"
        >
          <div class="message-avatar">
            <el-avatar v-if="message.type === 'user'" :src="userStore.user?.avatar" size="small">
              <el-icon><User /></el-icon>
            </el-avatar>
            <el-avatar v-else size="small" class="ai-avatar">
              <el-icon><Robot /></el-icon>
            </el-avatar>
          </div>

          <div class="message-content">
            <div class="message-bubble">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
        </div>

        <!-- SSE流式消息 -->
        <div v-if="isStreaming && streamingMessage" class="message-item ai-message">
          <div class="message-avatar">
            <el-avatar size="small" class="ai-avatar">
              <el-icon><Robot /></el-icon>
            </el-avatar>
          </div>

          <div class="message-content">
            <div class="message-bubble">
              <div class="message-text">{{ streamingMessage.content }}</div>
              <div class="typing-indicator" v-if="isStreaming">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载中提示 -->
        <div v-if="isLoading" class="message-item ai-message">
          <div class="message-avatar">
            <el-avatar size="small" class="ai-avatar">
              <el-icon><Robot /></el-icon>
            </el-avatar>
          </div>
          <div class="message-content">
            <div class="message-bubble loading">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-container">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="1"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="输入您的问题..."
            class="message-input"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.enter.shift.exact="handleShiftEnter"
            :disabled="isLoading || isStreaming"
          />
          <el-button
            type="primary"
            :disabled="!inputMessage.trim() || isLoading || isStreaming"
            class="send-button"
            @click="sendMessage"
          >
            {{ isStreaming ? '发送中...' : '发送' }}
          </el-button>
        </div>
        <div class="input-tips">
          <span>按 Enter 发送，Shift + Enter 换行</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Grid, Service } from '@element-plus/icons-vue'
import { agentApi } from '@/api'
import type { ChatMessage, ChatSession } from '@/api/types'

import { createSSEService, type SSEService, type StreamMessage } from '@/services/sseService'

// 使用从API types导入的类型
// ChatMessage 和 ChatSession 已从 @/api/types 导入

const router = useRouter()
const userStore = useUserStore()
const messagesContainer = ref<HTMLElement>()
const inputMessage = ref('')
const isLoading = ref(false)
const isStreaming = ref(false)
const streamingMessage = ref<StreamMessage | null>(null)
const sseService = ref<SSEService | null>(null)
const currentSessionId = ref('session-1')
const sessions = ref<ChatSession[]>([
  {
    id: 'session-1',
    title: '新对话',
    messages: [],
    lastMessage: new Date()
  }
])
// 当前会话的消息
const messages = computed(() => {
  const currentSession = sessions.value.find(s => s.id === currentSessionId.value)
  return currentSession ? currentSession.messages : []
})

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value || isStreaming.value) return

  const userMessage: ChatMessage = {
    type: 'user',
    content: inputMessage.value.trim(),
    timestamp: new Date()
  }

  // 添加消息到当前会话
  const currentSession = sessions.value.find(s => s.id === currentSessionId.value)
  if (currentSession) {
    currentSession.messages.push(userMessage)
    currentSession.lastMessage = new Date()

    // 如果是第一条消息，更新会话标题
    if (currentSession.messages.length === 1) {
      currentSession.title = userMessage.content.slice(0, 20) + (userMessage.content.length > 20 ? '...' : '')
    }
  }

  const question = inputMessage.value.trim()
  inputMessage.value = ''

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 显示加载状态
  isLoading.value = true

  try {
    // 调用AI聊天API
    await chatWithAI(question)
  } catch (error) {
    ElMessage.error('发送失败，请重试')
  } finally {
    isLoading.value = false
  }
}

// 使用SSE流式聊天
const chatWithAI = async (question: string) => {
  const currentSession = sessions.value.find(s => s.id === currentSessionId.value)
  if (!currentSession || !userStore.user) return

  try {
    // 重置流式状态
    streamingMessage.value = null
    isStreaming.value = true

    // 构建SSE请求配置 - 使用POST方法匹配后端接口
    const sseUrl = '/api/short-link/admin/v1/agent/chat'
    const requestBody = {
      userName: userStore.user.username,
      agentId: currentSession.agentId || 1,
      inputMessage: question
    }

    // 创建SSE服务
    sseService.value = createSSEService(
      {
        url: sseUrl,
        method: 'POST',
        body: requestBody,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      },
      {
        onMessage: (message: StreamMessage) => {
          // 更新流式消息
          streamingMessage.value = message

          // 滚动到底部
          nextTick(() => {
            scrollToBottom()
          })
        },
        onComplete: (finalMessage: string) => {
          // 流式完成，添加最终消息到会话
          const aiMessage: ChatMessage = {
            type: 'ai',
            content: finalMessage,
            timestamp: new Date()
          }

          currentSession.messages.push(aiMessage)
          currentSession.lastMessage = new Date()

          // 清理流式状态
          streamingMessage.value = null
          isStreaming.value = false

          // 滚动到底部
          nextTick(() => {
            scrollToBottom()
          })
        },
        onError: (error: Error) => {
          console.error('SSE流式聊天失败:', error)
          ElMessage.error('发送消息失败，请重试')

          // 添加错误消息
          const errorMessage: ChatMessage = {
            type: 'ai',
            content: '抱歉，发送消息时出现错误，请稍后重试。',
            timestamp: new Date()
          }

          currentSession.messages.push(errorMessage)
          currentSession.lastMessage = new Date()

          // 清理状态
          streamingMessage.value = null
          isStreaming.value = false
        },
        onOpen: () => {
          console.log('SSE连接已建立')
        },
        onClose: () => {
          console.log('SSE连接已关闭')
          isStreaming.value = false
        }
      }
    )

    // 开始SSE连接
    sseService.value.connect()

  } catch (error: any) {
    console.error('启动SSE聊天失败:', error)
    ElMessage.error('发送消息失败，请重试')

    // 清理状态
    streamingMessage.value = null
    isStreaming.value = false
  }
}

// 处理Shift+Enter换行
const handleShiftEnter = (event: KeyboardEvent) => {
  // 允许默认行为（换行）
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化会话时间
const formatSessionTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// 创建新会话
const createNewSession = () => {
  const newSession: ChatSession = {
    id: `session-${Date.now()}`,
    title: '新对话',
    messages: [],
    lastMessage: new Date(),
    agentId: 1 // 默认Agent ID
  }
  sessions.value.unshift(newSession)
  currentSessionId.value = newSession.id
}

// 切换会话
const switchSession = (sessionId: string) => {
  currentSessionId.value = sessionId
}

// 跳转到Agent广场
const goToAgentMarket = () => {
  router.push('/agent-market')
}

onMounted(() => {
  // 初始化时可以添加欢迎消息
})

// 组件卸载时清理SSE连接
onUnmounted(() => {
  if (sseService.value) {
    sseService.value.disconnect()
    sseService.value = null
  }
})
</script>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.sidebar {
  width: 280px;
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.agent-market-entry {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.market-button {
  width: 100%;
  justify-content: center;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.sidebar-header h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.session-item:hover {
  background: #f5f7fa;
}

.session-item.active {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
}

.session-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  font-size: 12px;
  color: #999;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  max-width: calc(100% - 280px);
  background: white;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
  scroll-behavior: smooth;
  max-height: calc(100vh - 250px);
}

.welcome-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 400px;
}

.welcome-content {
  text-align: center;
  color: #666;
}

.welcome-icon {
  color: #409eff;
  margin-bottom: 16px;
}

.welcome-content h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.welcome-content p {
  margin: 0;
  font-size: 14px;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease-in;
}

.user-message {
  flex-direction: row-reverse;
}

.user-message .message-bubble {
  background: #409eff;
  color: white;
}

.ai-message .message-bubble {
  background: white;
  border: 1px solid #e4e7ed;
}

.message-avatar {
  margin: 0 12px;
  flex-shrink: 0;
}

.ai-avatar {
  background: #f0f9ff;
  color: #409eff;
}

.message-content {
  flex: 1;
  max-width: 60%;
}

.message-bubble {
  padding: 16px 20px;
  border-radius: 16px;
  position: relative;
  word-wrap: break-word;
  font-size: 15px;
  line-height: 1.6;
}

.message-bubble.loading {
  padding: 16px 20px;
}

.message-text {
  line-height: 1.5;
  margin-bottom: 4px;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
}

.user-message .message-time {
  text-align: right;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #409eff;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

.input-area {
  background: white;
  border-radius: 16px;
  padding: 20px 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
  margin-top: 20px;
  max-width: none;
  margin-left: 0;
  margin-right: 0;
}

.input-container {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
}

.message-input :deep(.el-textarea__inner) {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: none;
  resize: none;
  font-size: 15px;
  line-height: 1.5;
  transition: border-color 0.3s;
}

.message-input :deep(.el-textarea__inner):focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.send-button {
  border-radius: 12px;
  height: 44px;
  width: 44px;
  padding: 0;
  font-size: 16px;
}

.input-tips {
  margin-top: 12px;
  font-size: 13px;
  color: #999;
  text-align: center;
}

/* 响应式设计 */
 @media (max-width: 1024px) {
   .sidebar {
     width: 240px;
   }

   .chat-main {
     padding: 30px 40px;
     max-width: calc(100% - 240px);
   }

   .message-content {
     max-width: 70%;
   }

   .input-area {
     max-width: 800px;
     padding: 20px 30px;
   }
 }

@media (max-width: 768px) {
   .chat-container {
     flex-direction: column;
   }

   .sidebar {
     display: none;
   }

   .chat-main {
     padding: 20px;
     max-width: 100%;
   }

   .messages-container {
     padding: 20px 0;
   }

   .message-content {
     max-width: 75%;
   }

   .message-bubble {
     padding: 12px 16px;
     font-size: 14px;
   }

   .input-area {
     padding: 16px;
     border-radius: 12px;
     max-width: none;
     margin: 20px 0 0 0;
   }

   .send-button {
     height: 36px;
     width: 36px;
   }
 }

@media (max-width: 480px) {
  .chat-main {
    padding: 16px;
    max-width: 100%;
  }

  .message-content {
    max-width: 85%;
  }

  .input-container {
    gap: 12px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}
</style>
