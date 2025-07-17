<template>
  <div class="interview-question" :class="{ 'is-current': isCurrent }">
    <div class="question-header">
      <div 
        class="question-number" 
        :class="{ 'completed': isCompleted }"
      >
        {{ questionNumber }}
      </div>
      <div class="question-content">
        {{ questionText }}
      </div>
    </div>
    <div class="question-actions">
      <el-button 
        :type="isRecording ? 'danger' : 'primary'"
        :icon="isRecording ? 'VideoPause' : 'Microphone'"
        @click="toggleRecording"
        :disabled="isCompleted"
        size="default"
      >
        {{ isRecording ? '停止录音' : '开始录音' }}
      </el-button>
      <span v-if="isRecording" class="recording-indicator">
        <i class="recording-dot"></i>
        录音中... {{ formatTime(recordingTime) }}
      </span>
      <span v-if="isCompleted" class="completed-text">已完成</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  questionNumber: string
  questionText: string
  isCompleted?: boolean
  isCurrent?: boolean
}

interface Emits {
  (e: 'recording-complete', questionNumber: string, pcmData: ArrayBuffer): void
}

const props = withDefaults(defineProps<Props>(), {
  isCompleted: false,
  isCurrent: false
})

const emit = defineEmits<Emits>()

const isRecording = ref(false)
const recordingTime = ref(0)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let recordingTimer: number | null = null
let audioContext: AudioContext | null = null
let processor: ScriptProcessorNode | null = null
let pcmData: Float32Array[] = []

// 格式化时间显示
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 开始录音计时
const startTimer = () => {
  recordingTime.value = 0
  recordingTimer = setInterval(() => {
    recordingTime.value++
  }, 1000)
}

// 停止录音计时
const stopTimer = () => {
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
}

// 开始录音
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      } 
    })
    
    // 创建AudioContext用于获取PCM数据
    audioContext = new AudioContext({ sampleRate: 16000 })
    const source = audioContext.createMediaStreamSource(stream)
    processor = audioContext.createScriptProcessor(4096, 1, 1)
    
    pcmData = []
    
    processor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer
      const inputData = inputBuffer.getChannelData(0)
      pcmData.push(new Float32Array(inputData))
    }
    
    source.connect(processor)
    processor.connect(audioContext.destination)
    
    isRecording.value = true
    startTimer()
    ElMessage.success('开始录音')
    
  } catch (error) {
    console.error('录音启动失败:', error)
    ElMessage.error('无法访问麦克风，请检查权限设置')
  }
}

// 停止录音
const stopRecording = () => {
  if (audioContext && processor) {
    processor.disconnect()
    audioContext.close()
    
    // 将Float32Array转换为PCM数据
    const totalLength = pcmData.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Float32Array(totalLength)
    let offset = 0
    
    for (const chunk of pcmData) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    
    // 转换为16位PCM
    const pcm16 = new Int16Array(result.length)
    for (let i = 0; i < result.length; i++) {
      pcm16[i] = Math.max(-32768, Math.min(32767, result[i] * 32767))
    }
    
    const pcmBuffer = pcm16.buffer
    
    isRecording.value = false
    stopTimer()
    
    ElMessage.success('录音完成')
    emit('recording-complete', props.questionNumber, pcmBuffer)
  }
}

// 切换录音状态
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

// 组件卸载时清理资源
onUnmounted(() => {
  if (isRecording.value) {
    stopRecording()
  }
  stopTimer()
})
</script>

<style scoped>
.interview-question {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.interview-question.is-current {
  border: 2px solid #1890ff;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.2);
}

.interview-question:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.question-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.question-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-right: 16px;
  flex-shrink: 0;
  border: 2px solid #e0e0e0;
  color: #999;
  background: white;
  transition: all 0.3s ease;
}

.question-number.completed {
  background: #52c41a;
  border-color: #52c41a;
  color: white;
}

.question-content {
  flex: 1;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}

.question-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.completed-text {
  color: #52c41a;
  font-size: 14px;
  font-weight: 500;
}

.recording-indicator {
  display: flex;
  align-items: center;
  color: #ff4d4f;
  font-size: 14px;
  font-weight: 500;
  gap: 8px;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background: #ff4d4f;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>