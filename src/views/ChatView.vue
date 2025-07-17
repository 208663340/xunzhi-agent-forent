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
        >
          <div class="session-content" @click="switchSession(session.id)">
            <div class="session-title">{{ session.title }}</div>
            <div class="session-time">{{ formatSessionTime(session.lastMessage) }}</div>
          </div>
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            class="delete-button"
            @click.stop="deleteSession(session.id)"
            title="删除会话"
          />
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
          :key="message.id"
          class="message-item"
          :class="{ 'user-message': message.type === 'user', 'ai-message': message.type === 'ai' }"
        >
          <div class="message-avatar">
            <el-avatar v-if="message.type === 'user'" :src="userStore.user?.avatar" size="small">
              <el-icon><User /></el-icon>
            </el-avatar>
            <el-avatar v-else size="small" class="ai-avatar">
              <img src="/avter/aiAvter.png" alt="AI头像" style="width: 100%; height: 100%; object-fit: cover;" />
            </el-avatar>
          </div>

          <div class="message-content">
            <div class="message-bubble">
              <MessageRenderer :content="message.content" :type="message.type" />
              <!-- 流式传输指示器 -->
              <div class="typing-indicator" v-if="message.isStreaming">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div class="message-time" v-if="message.isComplete">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 加载中提示 -->
        <div v-if="isLoading" class="message-item ai-message">
          <div class="message-avatar">
            <el-avatar size="small" class="ai-avatar">
              <img src="/avter/aiAvter.png" alt="AI头像" style="width: 100%; height: 100%; object-fit: cover;" />
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
        <!-- 功能按钮区域 -->
        <div class="function-buttons">
          <el-button
            size="small"
            :icon="DocumentAdd"
            @click="showComingSoon"
            :loading="isShowingComingSoon"
            :disabled="isShowingComingSoon"
          >
            文档
          </el-button>
          <el-button
            size="small"
            :icon="Picture"
            @click="showComingSoon"
            :loading="isShowingComingSoon"
            :disabled="isShowingComingSoon"
          >
            图片
          </el-button>
          <el-button
            size="small"
            :icon="Microphone"
            @click="showComingSoon"
            :loading="isShowingComingSoon"
            :disabled="isShowingComingSoon"
          >
            语音
          </el-button>
        </div>

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
import { ref, reactive, nextTick, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Grid, Plus, ChatDotRound, User, Service, Delete, DocumentAdd, Picture, Microphone, VideoCamera, Setting } from '@element-plus/icons-vue'
import { aiConversationApi, aiMessageApi } from '@/api'
import type { ChatMessage, ChatSession } from '@/types/chat'
import { createSSEService, type SSEService, type StreamMessage } from '@/services/sseService'
import MessageRenderer from '@/components/MessageRenderer.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messagesContainer = ref<HTMLElement>()
const inputMessage = ref('')
const isLoading = ref(false)
const isStreaming = ref(false)
const sseService = ref<SSEService | null>(null)
const currentSessionId = ref('')
const sessions = ref<ChatSession[]>([])
// 当前会话的消息
const messages = computed(() => {
  const currentSession = sessions.value.find((s) => s.id === currentSessionId.value)
  return currentSession ? currentSession.messages : []
})

// 生成唯一ID的工具函数
const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value || isStreaming.value) return

  const question = inputMessage.value.trim()
  inputMessage.value = ''

  // 检查是否需要创建新会话
  let currentSession = sessions.value.find((s) => s.id === currentSessionId.value)

  // 如果没有当前会话或者URL中没有sessionId，需要创建新会话
  if (!currentSession || !route.params.sessionId) {
    try {
      isLoading.value = true

      // 准备创建会话的参数
      const createSessionParams = {
        userName: userStore.user?.username || 'anonymous',
        aiId: 1, // 默认AI ID
        firstMessage: question,
      }

      console.log('创建会话参数:', createSessionParams)
      console.log('当前用户信息:', userStore.user)

      // 调用创建会话API
      const response = await aiConversationApi.createConversation(createSessionParams)

      const { sessionId, conversationTitle } = response.data.data

      // 创建新的会话对象
      currentSession = {
        id: sessionId,
        title: conversationTitle,
        messages: [],
        lastMessage: new Date(),
        messageSeq: 0,
        backendSessionId: sessionId,
        agentId: 1,
      }

      // 添加到会话列表
      sessions.value.unshift(currentSession)
      currentSessionId.value = sessionId

      // 动态更新URL，但不触发页面跳转
      // 直接更新浏览器地址栏，不使用router跳转
      const newUrl = `/chat/${sessionId}`
      window.history.replaceState(null, '', newUrl)
      console.log('已更新URL到:', newUrl)
    } catch (error) {
      console.error('创建会话失败:', error)
      ElMessage.error('创建会话失败，请重试')
      isLoading.value = false
      return
    }
  }

  // 自增消息序列号
  currentSession.messageSeq++

  const userMessage: ChatMessage = {
    id: generateMessageId(),
    type: 'user',
    content: question,
    timestamp: new Date(),
    messageSeq: currentSession.messageSeq,
    isComplete: true,
  }

  // 添加消息到会话
  currentSession.messages.push(userMessage)
  currentSession.lastMessage = new Date()

  // 滚动到底部
  await nextTick()
  scrollToBottom()

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
  const currentSession = sessions.value.find((s) => s.id === currentSessionId.value)
  if (!currentSession || !userStore.user) return

  // 自增AI消息序列号
  currentSession.messageSeq++

  // 创建一个新的AI消息对象，用于流式更新
  const aiMessageId = generateMessageId()
  const aiMessage: ChatMessage = {
    id: aiMessageId,
    type: 'ai',
    content: '',
    timestamp: new Date(),
    messageSeq: currentSession.messageSeq,
    isStreaming: true,
    isComplete: false,
  }

  // 立即添加到会话中，但标记为流式传输中
  currentSession.messages.push(aiMessage)
  currentSession.lastMessage = new Date()

  try {
    // 设置流式状态
    isStreaming.value = true

    // 构建SSE请求配置 - 使用AI消息接口
    const sseUrl = `/api/xunzhi/v1/ai/sessions/${currentSession.backendSessionId}/chat`
    const requestBody = {
      sessionId: currentSession.backendSessionId,
      inputMessage: question,
      aiId: currentSession.agentId || 1,
      messageSeq: currentSession.messageSeq,
      userName: userStore.user?.username || 'anonymous',
    }

    // 创建SSE服务
    sseService.value = createSSEService(
      {
        url: sseUrl,
        method: 'POST',
        body: requestBody,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      },
      {
        onMessage: (message: StreamMessage) => {
          // 直接更新会话中的消息内容
          const currentAiMessage = currentSession.messages.find((msg) => msg.id === aiMessageId)
          if (currentAiMessage) {
            currentAiMessage.content = message.content
          }

          // 滚动到底部
          nextTick(() => {
            scrollToBottom()
          })
        },
        onComplete: (finalMessage: string) => {
          // 流式完成，更新消息状态
          const currentAiMessage = currentSession.messages.find((msg) => msg.id === aiMessageId)
          if (currentAiMessage) {
            currentAiMessage.content = finalMessage
            currentAiMessage.isStreaming = false
            currentAiMessage.isComplete = true
          }

          currentSession.lastMessage = new Date()
          isStreaming.value = false

          // 滚动到底部
          nextTick(() => {
            scrollToBottom()
          })
        },
        onSessionId: (sessionId) => {
          // 接收后端返回的会话ID
          if (!currentSession.backendSessionId) {
            currentSession.backendSessionId = sessionId
            console.log('收到后端会话ID:', sessionId)
          }
        },
        onError: (error: Error) => {
          console.error('SSE流式聊天失败:', error)

          // 如果是主动断开连接导致的AbortError，不显示错误信息
          if (error.name === 'AbortError') {
            console.log('SSE连接被主动中断，不显示错误信息')
            return
          }

          ElMessage.error('发送消息失败，请重试')

          // 更新为错误消息
          const currentAiMessage = currentSession.messages.find((msg) => msg.id === aiMessageId)
          if (currentAiMessage) {
            currentAiMessage.content = '抱歉，发送消息时出现错误，请稍后重试。'
            currentAiMessage.isStreaming = false
            currentAiMessage.isComplete = true
          }

          currentSession.lastMessage = new Date()
          isStreaming.value = false
        },
        onOpen: () => {
          console.log('SSE连接已建立')
        },
        onClose: () => {
          console.log('SSE连接已关闭')
          isStreaming.value = false

          // 确保消息状态被正确更新
          const currentAiMessage = currentSession.messages.find((msg) => msg.id === aiMessageId)
          if (currentAiMessage && currentAiMessage.isStreaming) {
            currentAiMessage.isStreaming = false
            currentAiMessage.isComplete = true
          }
        },
      },
    )

    // 开始SSE连接
    sseService.value.connect()
  } catch (error: any) {
    console.error('启动SSE聊天失败:', error)
    ElMessage.error('发送消息失败，请重试')

    // 更新为错误消息
    const currentAiMessage = currentSession.messages.find((msg) => msg.id === aiMessageId)
    if (currentAiMessage) {
      currentAiMessage.content = '抱歉，连接失败，请稍后重试。'
      currentAiMessage.isStreaming = false
      currentAiMessage.isComplete = true
    }

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
    minute: '2-digit',
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
  // 清空当前会话状态，让用户可以开始新的对话
  currentSessionId.value = ''
  // 更新URL到不带sessionId的chat页面，但不触发页面跳转
  router.replace({ name: 'chat' })
}

// 切换会话
const switchSession = (sessionId: string) => {
  console.log('切换会话:', sessionId)
  router.push({ name: 'chat', params: { sessionId } })
}

// 删除会话
const deleteSession = async (sessionId: string) => {
  try {
    // 显示确认弹窗
    await ElMessageBox.confirm(
      '删除后无法恢复，确定要删除这个会话吗？',
      '删除会话',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    // 调用删除API
    await aiConversationApi.deleteConversation(sessionId)

    // 从本地会话列表中移除
    const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)
    if (sessionIndex >= 0) {
      sessions.value.splice(sessionIndex, 1)
    }

    // 如果删除的是当前会话，跳转到聊天首页
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = ''
      router.replace({ name: 'chat' })
    }

    ElMessage.success('会话删除成功')
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消删除，不显示错误信息
      return
    }
    console.error('删除会话失败:', error)
    ElMessage.error('删除会话失败，请重试')
  }
}

// 防抖计时器和状态
let comingSoonTimer: NodeJS.Timeout | null = null
const isShowingComingSoon = ref(false)

// 显示即将推出的功能提示（带防抖）
const showComingSoon = () => {
  // 如果正在显示提示，直接返回
  if (isShowingComingSoon.value) {
    return
  }

  // 清除之前的计时器
  if (comingSoonTimer) {
    clearTimeout(comingSoonTimer)
  }

  // 设置状态为正在显示
  isShowingComingSoon.value = true

  // 设置新的计时器，防止频繁点击
  comingSoonTimer = setTimeout(() => {
    ElMessage.info('小何正在全力开发，敬请期待！')
    comingSoonTimer = null

    // 延迟重置状态，避免过于频繁的提示
    setTimeout(() => {
      isShowingComingSoon.value = false
    }, 1000)
  }, 300) // 300ms防抖延迟
}

// 跳转到Agent广场
const goToAgentMarket = () => {
  router.push('/agent-market')
}

// 根据会话ID加载会话信息
const loadSessionById = async (sessionId: string) => {
  try {
    console.log('开始加载会话:', sessionId)

    // 检查sessionId是否有效
    if (!sessionId || sessionId.trim() === '') {
      console.warn('无效的会话ID')
      return
    }

    const response = await aiConversationApi.getConversationById(sessionId)

    // 检查响应数据
    if (!response || !response.data || !response.data.data) {
      console.warn('会话数据为空')
      ElMessage.warning('会话不存在或已被删除')
      // 跳转到聊天首页
      router.replace({ name: 'chat' })
      return
    }

    const sessionData = response.data.data
    console.log('加载的会话数据:', sessionData)

    // 创建会话对象
    const session: ChatSession = {
      id: sessionData.sessionId,
      title: sessionData.title || '未命名会话',
      messages: [],
      lastMessage: new Date(sessionData.lastMessageTime || sessionData.createTime),
      messageSeq: sessionData.messageCount || 0,
      backendSessionId: sessionData.sessionId,
      agentId: sessionData.aiId || 1,
    }

    try {
      // 加载会话历史消息
      const historyResponse = await aiMessageApi.getHistory(sessionId)
      const historyMessages = historyResponse.data.data || []
      console.log('加载的历史消息:', historyMessages)

      // 转换历史消息格式
      session.messages = historyMessages.map((msg: any) => ({
        id: msg.id || generateMessageId(),
        type: msg.messageType === 1 ? 'user' : 'ai',
        content: msg.messageContent || '',
        timestamp: new Date(msg.createTime),
        messageSeq: msg.messageSeq || 0,
        isComplete: true,
        isStreaming: false,
      }))
    } catch (historyError) {
      console.warn('加载历史消息失败，使用空消息列表:', historyError)
      // 即使历史消息加载失败，也要创建会话
    }

    // 检查会话是否已存在，避免重复添加
    const existingIndex = sessions.value.findIndex((s) => s.id === sessionId)
    if (existingIndex >= 0) {
      // 如果已存在，更新现有会话
      sessions.value[existingIndex] = session
      console.log('更新现有会话:', session.title)
    } else {
      // 如果不存在，添加到会话列表开头
      sessions.value.unshift(session)
      console.log('添加新会话:', session.title)
    }
  } catch (error) {
    console.error('加载会话失败:', error)

    // 根据错误类型给出不同的处理
    if (error.response && error.response.status === 404) {
      ElMessage.warning('会话不存在或已被删除')
      // 跳转到聊天首页
      router.replace({ name: 'chat' })
    } else if (error.response && error.response.status === 401) {
      ElMessage.error('请先登录')
      router.push('/login')
    } else {
      ElMessage.error('加载会话失败，请稍后重试')
      // 不跳转，让用户可以重试
    }
  }
}

// 加载会话列表
const loadConversations = async () => {
  try {
    console.log('开始加载会话列表')
    const response = await aiConversationApi.getConversations({
      current: 1,
      size: 20,
    })

    console.log('会话列表响应:', response)

    // 检查响应数据结构
    if (!response || !response.data) {
      console.warn('会话列表响应数据为空')
      sessions.value = []
      return
    }

    const conversations = response.data.data?.records || []
    console.log('解析的会话数据:', conversations)

    sessions.value = conversations.map((conv: any) => ({
      id: conv.sessionId,
      title: conv.title || '未命名会话',
      messages: [],
      lastMessage: new Date(conv.lastMessageTime || conv.createTime),
      messageSeq: conv.messageCount || 0,
      backendSessionId: conv.sessionId,
      agentId: conv.aiId || 1,
    }))

    console.log('设置的会话列表:', sessions.value)
  } catch (error) {
    console.error('加载会话列表失败:', error)

    // 根据错误类型处理
    if (error.response && error.response.status === 401) {
      console.warn('用户未登录，跳转到登录页')
      ElMessage.error('请先登录')
      router.push('/login')
      return
    }

    // 其他错误情况，初始化为空列表
    sessions.value = []
    console.log('初始化为空会话列表')

    // 显示错误提示，但不阻塞用户使用
    ElMessage.warning('加载会话列表失败，您可以开始新的对话')
  }
}

// 监听路由参数变化
watch(
  () => route.params.sessionId,
  (newSessionId) => {
    console.log('路由参数变化:', newSessionId)
    if (newSessionId && typeof newSessionId === 'string') {
      // 先设置当前会话ID
      currentSessionId.value = newSessionId

      // 检查会话是否已在列表中
      const existingSession = sessions.value.find((s) => s.id === newSessionId)
      if (!existingSession) {
        console.log('会话不存在于列表中，尝试加载:', newSessionId)
        loadSessionById(newSessionId)
      } else {
        console.log('会话已存在于列表中:', existingSession.title)
        // 会话已存在，不需要重新加载
      }
    } else {
      // 如果没有sessionId，清空当前会话
      currentSessionId.value = ''
      console.log('清空当前会话ID')
    }
  },
  { immediate: true },
)

onMounted(async () => {
  try {
    console.log('ChatView组件已挂载，开始初始化')

    // 先加载会话列表
    await loadConversations()

    // 如果URL中有sessionId，确保会话已加载
    const sessionId = route.params.sessionId
    if (sessionId && typeof sessionId === 'string') {
      console.log('URL中包含sessionId:', sessionId)
      const existingSession = sessions.value.find((s) => s.id === sessionId)
      if (!existingSession) {
        console.log('会话列表中未找到该会话，尝试单独加载')
        await loadSessionById(sessionId)
      } else {
        console.log('会话已在列表中，无需重复加载:', existingSession.title)
      }
    }

    console.log('ChatView初始化完成，当前会话列表长度:', sessions.value.length)
  } catch (error) {
    console.error('ChatView初始化失败:', error)
    // 即使初始化失败，也不阻塞页面渲染
  }
})

// 组件卸载时清理SSE连接
onUnmounted(() => {
  console.log('ChatView组件正在卸载，清理SSE连接')
  if (sseService.value) {
    try {
      sseService.value.disconnect()
      console.log('SSE服务已断开')
    } catch (error) {
      console.warn('断开SSE连接时出错:', error)
    }
    sseService.value = null
  }

  // 清理防抖计时器
  if (comingSoonTimer) {
    clearTimeout(comingSoonTimer)
    comingSoonTimer = null
  }

  // 重置流式传输状态
  isStreaming.value = false
})
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 64px);
  display: flex;
  background: #f5f7fa;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
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
  height: 0;
}

.session-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  transition: background-color 0.2s;
  position: relative;
}

.session-item:hover {
  background: #f5f7fa;
}

.session-item:hover .delete-button {
  opacity: 1;
}

.session-item.active {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
}

.session-content {
  flex: 1;
  cursor: pointer;
  padding: 4px 8px;
  min-width: 0;
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

.delete-button {
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
  margin-left: 8px;
  padding: 4px;
  min-width: 24px;
  height: 24px;
}

.delete-button:hover {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 280px);
  background: white;
  height: 100%;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
  height: 0;
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

/* 确保MessageRenderer组件在消息气泡中正确显示 */
.message-bubble :deep(.message-renderer) {
  max-width: 100%;
  overflow-x: auto;
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
  margin: 20px;
  margin-top: 0;
  flex-shrink: 0;
}

.function-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.function-buttons .el-button {
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  transition: all 0.3s;
}

.function-buttons .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
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
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}
</style>
