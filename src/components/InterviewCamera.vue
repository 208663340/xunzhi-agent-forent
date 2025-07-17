<template>
  <div
    class="interview-camera"
    :class="{ minimized: isMinimized, dragging: isDragging }"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
  >
    <!-- 摄像头窗口 -->
    <div class="camera-window">
      <!-- 窗口标题栏 -->
      <div class="camera-header" @mousedown="handleMouseDown">
        <div class="camera-title">
          <el-icon><VideoCamera /></el-icon>
          <span>摄像头</span>
        </div>
        <div class="camera-controls">
          <el-button size="small" text @click="toggleMinimize" class="control-btn">
            <el-icon><Minus v-if="!isMinimized" /><Plus v-else /></el-icon>
          </el-button>
          <el-button size="small" text @click="closeCamera" class="control-btn close-btn">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 摄像头内容区域 -->
      <div class="camera-content" v-show="!isMinimized">
        <video
          ref="videoRef"
          v-show="isCameraActive"
          autoplay
          muted
          playsinline
          class="camera-video"
        ></video>

        <!-- 隐藏的canvas用于截图 -->
        <canvas ref="canvasRef" style="display: none"></canvas>

        <!-- 摄像头未开启状态 -->
        <div v-if="!isCameraActive" class="camera-placeholder">
          <el-icon size="40"><Camera /></el-icon>
          <p>摄像头未开启</p>
          <el-button type="primary" size="small" @click="startCamera" :loading="isLoading">
            开启摄像头
          </el-button>
        </div>

        <!-- 底部控制栏 -->
        <div v-if="isCameraActive" class="camera-footer">
          <div class="camera-status">
            <div class="status-indicator" :class="{ recording: isRecording }"></div>
            <span class="status-text">{{ isRecording ? '录制中' : '已连接' }}</span>
          </div>
          <div class="camera-actions">
            <el-button
              size="small"
              :type="isRecording ? 'danger' : 'success'"
              @click="toggleRecording"
              circle
            >
              <el-icon><VideoPlay v-if="!isRecording" /><VideoPause v-else /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  VideoCamera,
  Camera,
  VideoPlay,
  VideoPause,
  Close,
  Minus,
  Plus,
} from '@element-plus/icons-vue'
import { agentApi } from '@/api'

// Props
interface Props {
  autoStart?: boolean
  sessionId?: string
  agentId?: number
  captureInterval?: number // 抓拍间隔（秒），默认5秒
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: false,
  sessionId: '',
  agentId: 1,
  captureInterval: 5,
})

// Emits
const emit = defineEmits<{
  close: []
  recordingStart: []
  recordingStop: []
  demeanorEvaluated: [score: string]
}>()

// 响应式数据
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const isCameraActive = ref(false)
const isLoading = ref(false)
const isRecording = ref(false)
const isMinimized = ref(false)
const isCaptureEnabled = ref(false)

// 拖动相关状态
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const position = ref({ x: 20, y: 100 })

// 媒体流和录制器
let mediaStream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []

// 定时抓拍相关
let captureTimer: number | null = null
let captureCount = 0

// 开启摄像头
const startCamera = async () => {
  isLoading.value = true
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
      audio: true,
    })

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      isCameraActive.value = true

      // 摄像头开启成功后，启动定时抓拍
      if (props.sessionId && props.agentId) {
        startCapture()
      }
    }

    ElMessage.success('摄像头已开启')
  } catch (error) {
    console.error('开启摄像头失败:', error)
    ElMessage.error('无法访问摄像头，请检查权限设置')
  } finally {
    isLoading.value = false
  }
}

// 关闭摄像头
const stopCamera = () => {
  // 停止定时抓拍
  stopCapture()

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }

  isCameraActive.value = false
  isRecording.value = false
}

// 切换录制状态
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

// 开始录制
const startRecording = () => {
  if (!mediaStream) return

  recordedChunks = []
  mediaRecorder = new MediaRecorder(mediaStream, {
    mimeType: 'video/webm;codecs=vp9',
  })

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data)
    }
  }

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' })
    // 这里可以处理录制完成的视频
    console.log('录制完成', blob)
  }

  mediaRecorder.start()
  isRecording.value = true
  emit('recordingStart')

  ElMessage.success('开始录制')
}

// 停止录制
const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    emit('recordingStop')

    ElMessage.success('录制完成')
  }
}

// 切换最小化状态
const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

// 关闭摄像头窗口
const closeCamera = () => {
  stopCamera()
  emit('close')
}

// 拖动功能实现
const handleMouseDown = (event: MouseEvent) => {
  isDragging.value = true
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  event.preventDefault()
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return

  const newX = event.clientX - dragOffset.value.x
  const newY = event.clientY - dragOffset.value.y

  // 限制拖动范围在视窗内
  const maxX = window.innerWidth - 320 // 摄像头宽度
  const maxY = window.innerHeight - 300 // 摄像头高度

  position.value = {
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY)),
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// 组件挂载时自动开启摄像头
onMounted(() => {
  if (props.autoStart) {
    startCamera()
  }
})

// 启动定时抓拍
const startCapture = () => {
  if (captureTimer) {
    clearInterval(captureTimer)
  }

  isCaptureEnabled.value = true
  captureCount = 0

  // 设置定时器，按照指定间隔抓拍
  captureTimer = setInterval(() => {
    capturePhoto()
  }, props.captureInterval * 1000)

  console.log(`定时抓拍已启动，间隔：${props.captureInterval}秒`)
}

// 停止定时抓拍
const stopCapture = () => {
  if (captureTimer) {
    clearInterval(captureTimer)
    captureTimer = null
  }
  isCaptureEnabled.value = false
  console.log('定时抓拍已停止')
}

// 抓拍照片
const capturePhoto = async () => {
  if (!videoRef.value || !canvasRef.value || !isCameraActive.value) {
    return
  }

  try {
    const video = videoRef.value
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      console.error('无法获取canvas上下文')
      return
    }

    // 设置canvas尺寸与视频一致
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // 将视频帧绘制到canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // 将canvas转换为Blob
    canvas.toBlob(
      async (blob) => {
        if (blob) {
          captureCount++
          console.log(`第${captureCount}次抓拍，图片大小：${(blob.size / 1024).toFixed(2)}KB`)

          // 发送到后端进行神态评分
          await sendPhotoForEvaluation(blob)
        }
      },
      'image/jpeg',
      0.8,
    )
  } catch (error) {
    console.error('抓拍失败:', error)
  }
}

// 发送照片到后端进行神态评分
const sendPhotoForEvaluation = async (photoBlob: Blob) => {
  try {
    // 将Blob转换为File对象
    const photoFile = new File([photoBlob], `capture_${Date.now()}.jpg`, {
      type: 'image/jpeg',
    })

    // 调用神态评分接口
    const response = await agentApi.evaluateDemeanor({
      agentId: props.agentId!,
      sessionId: props.sessionId!,
      userPhoto: photoFile,
    })

    if (response.data.success && response.data.data) {
      const score = response.data.data
      console.log(`神态评分结果：${score}分`)

      // 触发事件，将评分结果传递给父组件
      emit('demeanorEvaluated', score)
    } else {
      console.warn('神态评分接口返回异常:', response)
    }
  } catch (error) {
    console.error('神态评分请求失败:', error)
  }
}

// 监听props变化，当sessionId或agentId变化时重新启动抓拍
watch(
  () => [props.sessionId, props.agentId],
  ([newSessionId, newAgentId]) => {
    if (isCameraActive.value && newSessionId && newAgentId) {
      // 重新启动抓拍
      stopCapture()
      startCapture()
    } else if (!newSessionId || !newAgentId) {
      // 停止抓拍
      stopCapture()
    }
  },
)

// 组件卸载时清理资源
onUnmounted(() => {
  stopCamera()
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.interview-camera {
  position: fixed;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  user-select: none;
}

.interview-camera.dragging {
  transition: none;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  transform: scale(1.02);
}

.interview-camera.minimized {
  width: 200px;
}

.camera-window {
  overflow: hidden;
  border-radius: 12px;
}

.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  cursor: move;
}

.camera-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.camera-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  color: #666;
}

.control-btn:hover {
  color: #409eff;
}

.close-btn:hover {
  color: #f56c6c;
}

.camera-content {
  position: relative;
  height: 240px;
  background: #000;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  background: #f5f7fa;
}

.camera-placeholder .el-icon {
  margin-bottom: 8px;
  color: #ccc;
}

.camera-placeholder p {
  margin: 0 0 12px 0;
  font-size: 14px;
}

.camera-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  color: white;
}

.camera-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #67c23a;
  transition: all 0.3s ease;
}

.status-indicator.recording {
  background: #f56c6c;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 12px;
}

.camera-actions {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .interview-camera {
    width: 280px;
    top: 80px;
    right: 10px;
  }

  .interview-camera.minimized {
    width: 180px;
  }

  .camera-content {
    height: 200px;
  }
}

@media (max-width: 480px) {
  .interview-camera {
    width: 240px;
    right: 5px;
  }

  .interview-camera.minimized {
    width: 160px;
  }

  .camera-content {
    height: 180px;
  }
}
</style>
