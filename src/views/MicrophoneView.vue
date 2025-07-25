<template>
  <div class="microphone-container">
    <div class="microphone-header">
      <h2>麦克风录音</h2>
    </div>

    <div class="microphone-content">
      <!-- 录音状态显示 -->
      <div class="recording-status">
        <div class="status-indicator" :class="{ 'recording': isRecording, 'ready': isReady }">
          <el-icon size="60">
            <Microphone v-if="!isRecording" />
            <VideoPlay v-else />
          </el-icon>
        </div>

        <div class="status-text">
          <h3 v-if="!isReady">准备录音</h3>
          <h3 v-else-if="isRecording">正在录音...</h3>
          <h3 v-else>录音就绪</h3>

          <p v-if="isRecording" class="recording-time">
            录音时长: {{ formatTime(recordingTime) }}
          </p>
          <p v-else-if="isReady" class="ready-hint">
            点击开始录音按钮开始录制
          </p>
        </div>
      </div>

      <!-- 音频波形显示 -->
      <div class="audio-visualizer" v-if="isReady">
        <canvas ref="canvasRef" width="600" height="100"></canvas>
      </div>

      <!-- 控制按钮 -->
      <div class="recording-controls">
        <el-button v-if="!isReady" type="primary" size="large" @click="initMicrophone" :loading="isLoading">
          <el-icon>
            <Microphone />
          </el-icon>
          初始化麦克风
        </el-button>

        <template v-else>
          <el-button v-if="!isRecording" type="danger" size="large" @click="startRecording" :disabled="!isReady">
            <el-icon>
              <VideoPlay />
            </el-icon>
            开始录音
          </el-button>

          <el-button v-else type="warning" size="large" @click="stopRecording">
            <el-icon>
              <VideoPause />
            </el-icon>
            停止录音
          </el-button>

          <el-button type="info" size="large" @click="resetMicrophone" :disabled="isRecording">
            <el-icon>
              <RefreshRight />
            </el-icon>
            重置
          </el-button>
        </template>
      </div>

      <!-- 录音列表 -->
      <div v-if="recordings.length > 0" class="recordings-list">
        <h3>录音列表</h3>
        <div class="recording-item" v-for="(recording, index) in recordings" :key="index">
          <div class="recording-info">
            <div class="recording-name">
              录音 {{ index + 1 }} - {{ recording.duration }}
            </div>
            <div class="recording-time">
              {{ recording.timestamp }}
            </div>
          </div>

          <div class="recording-controls-item">
            <el-button size="small" @click="playRecording(recording, index)" :disabled="currentPlaying === index">
              <el-icon>
                <VideoPlay />
              </el-icon>
              {{ currentPlaying === index ? '播放中' : '播放' }}
            </el-button>

            <el-button v-if="currentPlaying === index" size="small" @click="stopPlaying">
              <el-icon>
                <VideoPause />
              </el-icon>
              停止
            </el-button>

            <el-button size="small" type="primary" @click="downloadRecording(recording, index)">
              <el-icon>
                <Download />
              </el-icon>
              下载
            </el-button>

            <el-button size="small" type="danger" @click="deleteRecording(index)">
              <el-icon>
                <Delete />
              </el-icon>
              删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 音频设置 -->
      <div class="audio-settings">
        <h3>录音设置</h3>
        <div class="settings-row">
          <label>音频质量:</label>
          <el-select v-model="audioQuality" @change="updateAudioSettings">
            <el-option label="高质量 (48kHz)" value="high" />
            <el-option label="标准质量 (44.1kHz)" value="standard" />
            <el-option label="低质量 (22kHz)" value="low" />
          </el-select>
        </div>

        <div class="settings-row">
          <label>音量监控:</label>
          <div class="volume-meter">
            <div class="volume-bar" :style="{ width: volumeLevel + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

// 声明lamejs模块的类型
declare module 'lamejs' {
enum MPEGMode {
STEREO = 0,
JOINT_STEREO = 1,
DUAL_CHANNEL = 2,
MONO = 3
}

class Mp3Encoder {
constructor(channels: number, sampleRate: number, kbps: number, mode?: MPEGMode)
encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array
flush(): Int8Array
}

export const MPEGMode: typeof MPEGMode
export const Mp3Encoder: typeof Mp3Encoder
export const WavHeader: any
}

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Microphone,
  VideoPlay,
  VideoPause,
  RefreshRight,
  Download,
  Delete
} from '@element-plus/icons-vue'
import { Mp3Encoder, MPEGMode } from 'lamejs'

import type { Recording } from '../types/media'

// 响应式数据
const canvasRef = ref<HTMLCanvasElement>()
const isReady = ref(false)
const isLoading = ref(false)
const isRecording = ref(false)
const recordingTime = ref(0)
const volumeLevel = ref(0)
const audioQuality = ref('standard')
const recordings = ref<Recording[]>([])
const currentPlaying = ref(-1)

// 媒体相关变量
let mediaStream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let recordingTimer: number | null = null
let animationFrame: number | null = null
let recordedChunks: Blob[] = []
let currentAudio: HTMLAudioElement | null = null

// 音频设置
const audioSettings = {
  high: { sampleRate: 44100, bitRate: 192000 },
  standard: { sampleRate: 22050, bitRate: 128000 },
  low: { sampleRate: 16000, bitRate: 64000 }
}

// 初始化麦克风
const initMicrophone = async () => {
  isLoading.value = true
  try {
    const constraints = {
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    }

    // 请求麦克风权限
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
    console.log('获取到媒体流:', mediaStream)

    // 创建音频上下文和分析器
    audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(mediaStream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    source.connect(analyser)

    // 初始化音频可视化
    initAudioVisualizer()

    // 设置录音机
    const quality = audioQuality.value as keyof typeof audioSettings
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    console.log('使用的音频格式:', mimeType)

    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType,
      audioBitsPerSecond: audioSettings[quality].bitRate
    })

    // 设置录音事件处理
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const timestamp = new Date().toLocaleString()
      const duration = formatTime(recordingTime.value)

      // 创建录音文件
      const audioBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType })
      console.log('录音完成，原始数据:', {
        size: audioBlob.size,
        type: audioBlob.type,
        duration: duration
      })

      // 添加到录音列表
      recordings.value.push({
        blob: audioBlob,
        timestamp,
        duration
      })

      // 重置录音数据
      recordedChunks = []
      recordingTime.value = 0
      if (recordingTimer) {
        clearInterval(recordingTimer)
        recordingTimer = null
      }
    }

    isReady.value = true
    isLoading.value = false
    console.log('麦克风初始化完成')
  } catch (error) {
    console.error('初始化麦克风失败:', error)
    ElMessage.error('初始化麦克风失败: ' + (error as Error).message)
    isLoading.value = false
  }
}

// 音频可视化
const initAudioVisualizer = () => {
  if (!canvasRef.value || !analyser) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  const barWidth = canvas.width / bufferLength * 2.5
  let barHeight
  let x = 0

  const draw = () => {
    if (!ctx || !analyser) return

    animationFrame = requestAnimationFrame(draw)
    x = 0

    analyser.getByteFrequencyData(dataArray)

    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] * 0.5

      const hue = (i / bufferLength) * 360
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`

      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
      x += barWidth + 1
    }

    // 更新音量指示器
    const sum = dataArray.reduce((acc, val) => acc + val, 0)
    const average = sum / bufferLength
    volumeLevel.value = Math.min(100, (average / 256) * 200)
  }

  draw()
}

// 开始录音
const startRecording = () => {
  if (!mediaRecorder || !isReady.value) return

  try {
    // 重置录音数据
    recordedChunks = []
    recordingTime.value = 0

    // 开始录音
    mediaRecorder.start()
    isRecording.value = true

    // 开始计时
    recordingTimer = window.setInterval(() => {
      recordingTime.value++
    }, 1000)

    console.log('开始录音')
  } catch (error) {
    console.error('开始录音失败:', error)
    ElMessage.error('开始录音失败: ' + (error as Error).message)
  }
}

// 停止录音
const stopRecording = () => {
  if (!mediaRecorder || !isRecording.value) return

  try {
    mediaRecorder.stop()
    isRecording.value = false
    console.log('停止录音')
  } catch (error) {
    console.error('停止录音失败:', error)
    ElMessage.error('停止录音失败: ' + (error as Error).message)
  }
}

// 重置麦克风
const resetMicrophone = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }

  isReady.value = false
  isRecording.value = false
  volumeLevel.value = 0

  ElMessage.info({
    message: '麦克风已重置',
    duration: 1500
  })
}

// 播放录音
const playRecording = (recording: Recording, index: number) => {
  try {
    if (currentPlaying.value === index) return

    // 停止当前播放的录音
    stopPlaying()

    // 创建新的音频元素
    currentAudio = new Audio()
    currentAudio.src = URL.createObjectURL(recording.blob)

    // 设置播放事件
    currentAudio.onended = () => {
      currentPlaying.value = -1
      if (currentAudio) {
        URL.revokeObjectURL(currentAudio.src)
        currentAudio = null
      }
    }

    currentAudio.onerror = (error) => {
      console.error('播放录音失败:', error)
      ElMessage.error('播放录音失败')
      currentPlaying.value = -1
      if (currentAudio) {
        URL.revokeObjectURL(currentAudio.src)
        currentAudio = null
      }
    }

    // 开始播放
    currentPlaying.value = index
    currentAudio.play().catch((error) => {
      console.error('播放录音失败:', error)
      ElMessage.error('播放录音失败: ' + error.message)
      currentPlaying.value = -1
      if (currentAudio) {
        URL.revokeObjectURL(currentAudio.src)
        currentAudio = null
      }
    })
  } catch (error) {
    console.error('播放录音失败:', error)
    ElMessage.error('播放录音失败: ' + (error as Error).message)
    currentPlaying.value = -1
  }
}

// 停止播放
const stopPlaying = () => {
  if (currentAudio) {
    currentAudio.pause()
    URL.revokeObjectURL(currentAudio.src)
    currentAudio = null
  }
  currentPlaying.value = -1
}

// 下载录音
const downloadRecording = async (recording: Recording, index: number) => {
  try {
    // 尝试转换为MP3格式
    let downloadBlob: Blob
    let fileExtension: string

    downloadBlob = recording.blob
    // 统一使用MP3扩展名
    fileExtension = '.mp3'

    // 创建下载链接
    const downloadUrl = URL.createObjectURL(downloadBlob)
    const downloadLink = document.createElement('a')
    downloadLink.href = downloadUrl
    downloadLink.download = `录音_${index + 1}_${new Date().getTime()}${fileExtension}`

    // 触发下载
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    // 清理URL
    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl)
    }, 100)

    console.log('下载完成')
  } catch (error) {
    console.error('下载录音失败:', error)
    ElMessage.error('下载录音失败: ' + (error as Error).message)
  }
}

// 删除录音
const deleteRecording = (index: number) => {
  if (currentPlaying.value === index) {
    stopPlaying()
  }
  recordings.value.splice(index, 1)
}

// 更新音频设置
const updateAudioSettings = () => {
  if (isReady.value) {
    ElMessage.info('设置将在下次初始化时生效')
  }
}

// 音量监控
const startVolumeMonitoring = () => {
  if (!analyser || !canvasRef.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const draw = () => {
    if (!analyser || !ctx) return

    analyser.getByteFrequencyData(dataArray)

    // 计算音量级别
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
    volumeLevel.value = Math.min(100, (average / 255) * 100)

    // 绘制波形
    ctx.fillStyle = '#f5f7fa'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const barWidth = canvas.width / bufferLength * 2.5
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height

      const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
      gradient.addColorStop(0, '#667eea')
      gradient.addColorStop(1, '#764ba2')

      ctx.fillStyle = gradient
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

      x += barWidth + 1
    }

    animationFrame = requestAnimationFrame(draw)
  }

  draw()
}

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 组件卸载时清理资源
onUnmounted(() => {
  resetMicrophone()
  stopPlaying()

  // 清理所有录音URL
  recordings.value.forEach(recording => {
    if (recording.blob) {
      URL.revokeObjectURL(URL.createObjectURL(recording.blob))
    }
  })

  if (recordingTimer) {
    clearInterval(recordingTimer)
  }
})
</script>

<style scoped>
.microphone-container {
  min-height: calc(100vh - 64px);
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.microphone-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.microphone-header h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
}

.microphone-header p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.microphone-content {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.recording-status {
  text-align: center;
  margin-bottom: 30px;
}

.status-indicator {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  background: #f5f7fa;
  color: #999;
  transition: all 0.3s ease;
}

.status-indicator.ready {
  background: #e1f3d8;
  color: #67c23a;
}

.status-indicator.recording {
  background: #fde2e2;
  color: #f56c6c;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

.status-text h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 20px;
}

.recording-time {
  font-size: 18px;
  color: #f56c6c;
  font-weight: 600;
  margin: 0;
}

.ready-hint {
  color: #666;
  margin: 0;
}

.audio-visualizer {
  margin: 20px 0;
  text-align: center;
}

.audio-visualizer canvas {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #f5f7fa;
}

.recording-controls {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.recordings-list {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.recordings-list h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
}

.recording-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 10px;
}

.recording-info {
  flex: 1;
}

.recording-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.recording-time {
  font-size: 12px;
  color: #999;
}

.recording-controls-item {
  display: flex;
  gap: 8px;
}

.audio-settings {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.audio-settings h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
}

.settings-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 15px;
}

.settings-row label {
  min-width: 80px;
  font-weight: 500;
  color: #333;
}

.volume-meter {
  flex: 1;
  height: 20px;
  background: #e4e7ed;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.volume-bar {
  height: 100%;
  background: linear-gradient(90deg, #67c23a 0%, #e6a23c 70%, #f56c6c 100%);
  transition: width 0.1s ease;
  border-radius: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .microphone-container {
    padding: 10px;
  }

  .microphone-content {
    padding: 20px;
  }

  .recording-controls {
    flex-direction: column;
    align-items: center;
  }

  .recording-controls .el-button {
    width: 200px;
  }

  .recording-item {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .recording-controls-item {
    width: 100%;
    justify-content: center;
  }

  .audio-visualizer canvas {
    width: 100%;
    max-width: 400px;
  }
}
</style>
