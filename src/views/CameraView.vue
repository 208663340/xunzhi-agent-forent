<template>
  <div class="camera-container">
    <div class="camera-header">
      <h2>摄像头功能</h2>
      <p>支持拍照和录制视频</p>
    </div>

    <div class="camera-content">
      <!-- 摄像头预览区域 -->
      <div class="camera-preview">
        <video
          ref="videoRef"
          :class="{ 'camera-active': isCameraActive }"
          autoplay
          muted
          playsinline
        ></video>
        
        <!-- 拍照预览 -->
        <canvas
          ref="canvasRef"
          v-show="capturedImage"
          class="captured-canvas"
        ></canvas>
        
        <!-- 状态提示 -->
        <div v-if="!isCameraActive && !capturedImage" class="camera-placeholder">
          <el-icon size="80"><Camera /></el-icon>
          <p>点击开启摄像头</p>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="camera-controls">
        <el-button
          v-if="!isCameraActive"
          type="primary"
          size="large"
          @click="startCamera"
          :loading="isLoading"
        >
          <el-icon><VideoCamera /></el-icon>
          开启摄像头
        </el-button>
        
        <template v-else>
          <el-button
            type="success"
            size="large"
            @click="takePhoto"
            :disabled="isRecording"
          >
            <el-icon><Camera /></el-icon>
            拍照
          </el-button>
          
          <el-button
            v-if="!isRecording"
            type="warning"
            size="large"
            @click="startRecording"
          >
            <el-icon><VideoPlay /></el-icon>
            开始录制
          </el-button>
          
          <el-button
            v-else
            type="danger"
            size="large"
            @click="stopRecording"
          >
            <el-icon><VideoPause /></el-icon>
            停止录制 ({{ recordingTime }}s)
          </el-button>
          
          <el-button
            type="info"
            size="large"
            @click="stopCamera"
          >
            <el-icon><Close /></el-icon>
            关闭摄像头
          </el-button>
        </template>
      </div>

      <!-- 拍照结果 -->
      <div v-if="capturedImage" class="photo-result">
        <h3>拍照结果</h3>
        <div class="photo-actions">
          <el-button type="primary" @click="downloadPhoto">
            <el-icon><Download /></el-icon>
            下载照片
          </el-button>
          <el-button @click="retakePhoto">
            <el-icon><RefreshRight /></el-icon>
            重新拍照
          </el-button>
        </div>
      </div>

      <!-- 录制结果 -->
      <div v-if="recordedVideo" class="video-result">
        <h3>录制结果</h3>
        <video
          :src="recordedVideo"
          controls
          class="recorded-video"
        ></video>
        <div class="video-actions">
          <el-button type="primary" @click="downloadVideo">
            <el-icon><Download /></el-icon>
            下载视频
          </el-button>
          <el-button @click="clearVideo">
            <el-icon><Delete /></el-icon>
            清除视频
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Camera,
  VideoCamera,
  VideoPlay,
  VideoPause,
  Close,
  Download,
  RefreshRight,
  Delete
} from '@element-plus/icons-vue'

// 响应式数据
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const isCameraActive = ref(false)
const isLoading = ref(false)
const isRecording = ref(false)
const recordingTime = ref(0)
const capturedImage = ref('')
const recordedVideo = ref('')

// 媒体流和录制器
let mediaStream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let recordingTimer: number | null = null
let recordedChunks: Blob[] = []

// 开启摄像头
const startCamera = async () => {
  isLoading.value = true
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: true
    })
    
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      isCameraActive.value = true
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
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  
  isCameraActive.value = false
  capturedImage.value = ''
  recordedVideo.value = ''
  
  ElMessage.info({
    message: '摄像头已关闭',
    duration: 1500
  })
}

// 拍照
const takePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return
  
  const video = videoRef.value
  const canvas = canvasRef.value
  const context = canvas.getContext('2d')
  
  if (!context) return
  
  // 设置画布尺寸
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  // 绘制当前帧
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  
  // 获取图片数据
  capturedImage.value = canvas.toDataURL('image/jpeg', 0.9)
  
  ElMessage.success('拍照成功')
}

// 重新拍照
const retakePhoto = () => {
  capturedImage.value = ''
}

// 下载照片
const downloadPhoto = () => {
  if (!capturedImage.value) return
  
  const link = document.createElement('a')
  link.download = `photo_${new Date().getTime()}.jpg`
  link.href = capturedImage.value
  link.click()
  
  ElMessage.success('照片下载成功')
}

// 开始录制
const startRecording = () => {
  if (!mediaStream) return
  
  recordedChunks = []
  mediaRecorder = new MediaRecorder(mediaStream, {
    mimeType: 'video/webm;codecs=vp9'
  })
  
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data)
    }
  }
  
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' })
    recordedVideo.value = URL.createObjectURL(blob)
  }
  
  mediaRecorder.start()
  isRecording.value = true
  recordingTime.value = 0
  
  // 开始计时
  recordingTimer = setInterval(() => {
    recordingTime.value++
  }, 1000)
  
  ElMessage.success('开始录制')
}

// 停止录制
const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    
    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }
    
    ElMessage.success('录制完成')
  }
}

// 下载视频
const downloadVideo = () => {
  if (!recordedVideo.value) return
  
  const link = document.createElement('a')
  link.download = `video_${new Date().getTime()}.webm`
  link.href = recordedVideo.value
  link.click()
  
  ElMessage.success('视频下载成功')
}

// 清除视频
const clearVideo = () => {
  if (recordedVideo.value) {
    URL.revokeObjectURL(recordedVideo.value)
    recordedVideo.value = ''
  }
}

// 组件卸载时清理资源
onUnmounted(() => {
  stopCamera()
  if (recordingTimer) {
    clearInterval(recordingTimer)
  }
  if (recordedVideo.value) {
    URL.revokeObjectURL(recordedVideo.value)
  }
})
</script>

<style scoped>
.camera-container {
  min-height: calc(100vh - 64px);
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.camera-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.camera-header h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
}

.camera-header p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.camera-content {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.camera-preview {
  position: relative;
  width: 100%;
  height: 400px;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.camera-preview video.camera-active {
  display: block;
}

.captured-canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.camera-placeholder {
  text-align: center;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.camera-placeholder .el-icon {
  margin-bottom: 15px;
  color: #ccc;
}

.camera-placeholder p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.camera-controls {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.photo-result,
.video-result {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.photo-result h3,
.video-result h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.photo-actions,
.video-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 15px;
}

.recorded-video {
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  margin-bottom: 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .camera-container {
    padding: 10px;
  }
  
  .camera-content {
    padding: 20px;
  }
  
  .camera-preview {
    height: 300px;
  }
  
  .camera-controls {
    flex-direction: column;
    align-items: center;
  }
  
  .camera-controls .el-button {
    width: 200px;
  }
}
</style>