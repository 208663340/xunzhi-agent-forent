<template>
  <div class="sse-stream-parser">
    <!-- 流式消息展示 -->
    <div class="stream-message" v-if="streamingMessage && !completedMessage">
      <div class="message-content">
        <div class="message-text">{{ streamingMessage.content }}</div>
        <div class="stream-info" v-if="showDebugInfo">
          <div class="stream-progress" v-if="streamingMessage.progress !== null">
            进度: {{ (streamingMessage.progress * 100).toFixed(1) }}%
          </div>
          <div class="stream-step" v-if="streamingMessage.step !== null">
            步骤: {{ streamingMessage.step }}
          </div>
          <div class="stream-id">ID: {{ streamingMessage.id }}</div>
        </div>
      </div>
      <div class="typing-indicator" v-if="isStreaming">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

    <!-- 完成的消息 -->
    <div class="completed-message" v-if="completedMessage">
      <div class="message-text">{{ completedMessage.content }}</div>
      <div class="message-time">{{ formatTime(completedMessage.timestamp) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type {
  SSEChoice,
  SSEWorkflowStep,
  SSEData,
  StreamMessage,
  CompletedMessage
} from '@/types/sse'

const props = defineProps<{
  url: string // SSE连接URL
  headers?: Record<string, string> // 请求头
  showDebugInfo?: boolean // 是否显示调试信息
}>()

const emit = defineEmits<{
  'message-complete': [message: string]
  'stream-error': [error: Error]
  'stream-start': []
  'stream-end': []
}>()

// 响应式数据
const streamingMessage = ref<StreamMessage | null>(null)
const completedMessage = ref<CompletedMessage | null>(null)
const isStreaming = ref(false)
const eventSource = ref<EventSource | null>(null)

// 累积的消息内容
let accumulatedContent = ''

// 开始SSE连接
const startStream = () => {
  if (eventSource.value) {
    eventSource.value.close()
  }

  // 重置状态
  streamingMessage.value = null
  completedMessage.value = null
  accumulatedContent = ''
  isStreaming.value = true

  // 创建EventSource连接
  eventSource.value = new EventSource(props.url)

  // 监听消息事件
  eventSource.value.onmessage = (event) => {
    try {
      // 解析SSE数据
      const data: SSEData = JSON.parse(event.data)

      console.log('收到SSE数据:', data)

      // 检查是否有内容更新
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0]
        if (choice.delta && choice.delta.content) {
          // 累积内容
          accumulatedContent += choice.delta.content

          // 更新流式消息
          streamingMessage.value = {
            content: accumulatedContent,
            id: data.id,
            progress: data.workflow_step ? data.workflow_step.progress : null,
            step: data.workflow_step ? data.workflow_step.seq : null,
            timestamp: new Date(data.created * 1000),
            isComplete: !!choice.finish_reason
          }
        }

        // 检查是否完成
        if (choice.finish_reason) {
          handleStreamComplete()
        }
      }
    } catch (error) {
      console.error('解析SSE数据失败:', error)
      emit('stream-error', error as Error)
    }
  }

  // 监听连接打开
  eventSource.value.onopen = () => {
    console.log('SSE连接已建立')
    emit('stream-start')
  }

  // 监听错误
  eventSource.value.onerror = (error) => {
    console.error('SSE连接错误:', error)
    emit('stream-error', new Error('SSE连接错误'))
    handleStreamComplete()
  }
}

// 处理流式完成
const handleStreamComplete = () => {
  if (streamingMessage.value) {
    // 将流式消息转为完成消息
    completedMessage.value = {
      content: streamingMessage.value.content,
      timestamp: new Date()
    }

    // 发出完成事件
    emit('message-complete', streamingMessage.value.content)

    // 延迟清理流式消息，确保完成消息能够显示
    setTimeout(() => {
      streamingMessage.value = null
    }, 100)
  }

  // 更新状态
  isStreaming.value = false

  // 关闭连接
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
  }

  emit('stream-end')
}

// 停止流式传输
const stopStream = () => {
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
  }

  isStreaming.value = false
  emit('stream-end')
}

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 暴露方法给父组件
defineExpose({
  startStream,
  stopStream,
  isStreaming: () => isStreaming.value
})

// 组件卸载时清理
onUnmounted(() => {
  if (eventSource.value) {
    eventSource.value.close()
  }
})
</script>

<style scoped>
.sse-stream-parser {
  width: 100%;
}

.stream-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-content {
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 12px;
  padding: 12px 16px;
  position: relative;
}

.message-text {
  color: #333;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.stream-info {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0f2fe;
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stream-progress {
  color: #409eff;
  font-weight: 500;
}

.stream-step {
  color: #67c23a;
}

.stream-id {
  color: #909399;
  font-family: monospace;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 8px 16px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #409eff;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.completed-message {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 12px 16px;
}

.completed-message .message-text {
  color: #333;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
  margin-bottom: 8px;
}

.message-time {
  font-size: 12px;
  color: #999;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stream-info {
    flex-direction: column;
    gap: 4px;
  }

  .message-content {
    padding: 10px 12px;
  }
}
</style>
