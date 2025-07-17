<template>
  <div class="interview-microphone">
    <!-- 麦克风状态指示器 -->
    <div class="microphone-indicator" :class="{ ready: isReady, checking: isCheckingDevices }">
      <el-icon size="24">
        <Microphone />
      </el-icon>
      <span class="status-text">
        {{ getStatusText() }}
      </span>
    </div>

    <!-- 设备选择器 -->
    <div v-if="showDeviceSelector" class="device-selector">
      <el-select
        v-model="selectedDeviceId"
        placeholder="选择麦克风设备"
        size="small"
        style="width: 100%"
        @change="handleDeviceChange"
      >
        <el-option
          v-for="device in audioDevices"
          :key="device.deviceId"
          :label="device.label || `麦克风 ${device.deviceId.slice(0, 8)}`"
          :value="device.deviceId"
        />
      </el-select>
      <div class="device-info">
        <span class="device-count">检测到 {{ audioDevices.length }} 个音频设备</span>
      </div>
    </div>

    <!-- 音量指示器 -->
    <div v-if="isReady" class="volume-indicator">
      <div class="volume-bar">
        <div class="volume-level" :style="{ width: volumeLevel + '%' }"></div>
      </div>
      <span class="volume-text">音量: {{ Math.round(volumeLevel) }}%</span>
    </div>

    <!-- 控制按钮 -->
    <div class="microphone-controls">
      <el-button
        v-if="!hasCheckedDevices"
        type="primary"
        size="small"
        @click="checkMicrophoneDevices"
        :loading="isCheckingDevices"
      >
        <el-icon><Microphone /></el-icon>
        检测麦克风
      </el-button>

      <template v-else-if="!isReady">
        <el-button
          type="success"
          size="small"
          @click="initMicrophone"
          :loading="isLoading"
          :disabled="!selectedDeviceId"
        >
          <el-icon><Microphone /></el-icon>
          初始化麦克风
        </el-button>
        <el-button size="small" @click="resetDeviceSelection"> 重新检测 </el-button>
      </template>

      <template v-else>
        <div class="status-ready">
          <el-icon color="#67c23a"><Microphone /></el-icon>
          <span>麦克风就绪</span>
          <span v-if="isRecording" class="recording-indicator"
            >● 录音中 {{ recordingDuration }}s</span
          >
        </div>

        <!-- 录音控制按钮 -->
        <el-button v-if="!isRecording" type="danger" size="small" @click="startRecording">
          <el-icon><VideoPlay /></el-icon>
          开始录音
        </el-button>

        <el-button v-else type="warning" size="small" @click="stopRecording">
          <el-icon><VideoPlay /></el-icon>
          停止录音
        </el-button>

        <el-button size="small" @click="resetMicrophone" :disabled="isRecording"> 重置 </el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Microphone, VideoPlay } from '@element-plus/icons-vue'

// Props
interface Props {
  autoInit?: boolean
  sampleRate?: number
  channels?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoInit: false,
  sampleRate: 16000, // PCM常用采样率
  channels: 1, // 单声道
})

// Emits
const emit = defineEmits<{
  recordingStart: []
  recordingStop: [pcmData: ArrayBuffer]
  error: [error: string]
  volumeChange: [volume: number]
}>()

// 响应式数据
const isReady = ref(false)
const isLoading = ref(false)
const volumeLevel = ref(0)
const isCheckingDevices = ref(false)
const hasCheckedDevices = ref(false)
const showDeviceSelector = ref(false)
const selectedDeviceId = ref('')
const audioDevices = ref<MediaDeviceInfo[]>([])

// 音频相关变量
let mediaStream: MediaStream | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let scriptProcessor: ScriptProcessorNode | null = null
let animationFrame: number | null = null
let pcmBuffer: Float32Array[] = []
const isRecording = ref(false)
let recordingStartTime = 0
const recordingDuration = ref(0)
let recordingTimer: number | null = null

// 获取状态文本
const getStatusText = (): string => {
  if (isCheckingDevices.value) return '检测设备中...'
  if (isReady.value) return '就绪'
  if (hasCheckedDevices.value) return '请选择设备'
  return '未检测'
}

// 检测麦克风设备
const checkMicrophoneDevices = async () => {
  isCheckingDevices.value = true
  try {
    // 首先请求权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop()) // 立即停止，只是为了获取权限

    // 获取设备列表
    const devices = await navigator.mediaDevices.enumerateDevices()
    audioDevices.value = devices.filter((device) => device.kind === 'audioinput')

    if (audioDevices.value.length === 0) {
      throw new Error('未检测到音频输入设备')
    }

    // 自动选择第一个设备
    selectedDeviceId.value = audioDevices.value[0].deviceId

    hasCheckedDevices.value = true
    showDeviceSelector.value = true

    ElMessage.success(`检测到 ${audioDevices.value.length} 个音频设备`)
  } catch (error) {
    console.error('检测设备失败:', error)
    const errorMsg = error instanceof Error ? error.message : '未知错误'
    ElMessage.error(`检测设备失败: ${errorMsg}`)
    emit('error', errorMsg)
  } finally {
    isCheckingDevices.value = false
  }
}

// 处理设备选择变化
const handleDeviceChange = (deviceId: string) => {
  selectedDeviceId.value = deviceId
  const selectedDevice = audioDevices.value.find((device) => device.deviceId === deviceId)
  if (selectedDevice) {
    ElMessage.success(`已选择: ${selectedDevice.label || '未命名设备'}`)
  }
}

// 重置设备选择
const resetDeviceSelection = () => {
  hasCheckedDevices.value = false
  showDeviceSelector.value = false
  selectedDeviceId.value = ''
  audioDevices.value = []
  cleanup()
}

// 重置麦克风
const resetMicrophone = () => {
  cleanup()
  ElMessage.info('麦克风已重置')
}

// 初始化麦克风
const initMicrophone = async () => {
  if (!selectedDeviceId.value) {
    ElMessage.warning('请先选择麦克风设备')
    return
  }

  isLoading.value = true
  try {
    // 使用选定的设备请求麦克风权限
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: selectedDeviceId.value },
        channelCount: props.channels,
        sampleRate: props.sampleRate,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    // 创建音频上下文
    audioContext = new AudioContext({
      sampleRate: props.sampleRate,
    })

    // 创建音频源和分析器
    const source = audioContext.createMediaStreamSource(mediaStream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048

    // 创建音频处理器（使用更小的缓冲区以减少延迟）
    scriptProcessor = audioContext.createScriptProcessor(1024, 1, 1)

    // 连接音频节点
    source.connect(analyser)
    source.connect(scriptProcessor)
    scriptProcessor.connect(audioContext.destination)

    // 处理音频数据
    scriptProcessor.onaudioprocess = (event) => {
      if (isRecording.value) {
        // 获取输入音频数据
        const inputBuffer = event.inputBuffer.getChannelData(0)

        // 检查缓冲区大小，防止内存溢出（限制为约5分钟的音频）
        const maxBuffers = Math.ceil((300 * props.sampleRate) / 1024) // 5分钟
        if (pcmBuffer.length >= maxBuffers) {
          console.warn('录音时间过长（超过5分钟），自动停止录音')
          stopRecording()
          return
        }

        // 复制数据到PCM缓冲区
        const bufferCopy = new Float32Array(inputBuffer.length)
        bufferCopy.set(inputBuffer)
        pcmBuffer.push(bufferCopy)

        // 添加调试信息（每10秒输出一次）
        if (pcmBuffer.length % 1000 === 0) {
          const currentSize = pcmBuffer.reduce((sum, buf) => sum + buf.length, 0) * 2
          const currentDuration = (pcmBuffer.length * 1024) / props.sampleRate
          console.log(
            `录音进度: ${currentDuration.toFixed(1)}秒, ${pcmBuffer.length} 块缓冲区, 约 ${(currentSize / 1024).toFixed(1)} KB`,
          )
        }
      }
    }

    // 开始音量监控
    startVolumeMonitoring()

    isReady.value = true
    ElMessage.success('麦克风初始化成功')
  } catch (error) {
    console.error('初始化麦克风失败:', error)
    const errorMsg = error instanceof Error ? error.message : '未知错误'
    ElMessage.error(`初始化麦克风失败: ${errorMsg}`)
    emit('error', errorMsg)
  } finally {
    isLoading.value = false
  }
}

// 音量监控
const startVolumeMonitoring = () => {
  if (!analyser) return

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const updateVolume = () => {
    if (!analyser) return

    analyser.getByteFrequencyData(dataArray)

    // 计算平均音量
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
    volumeLevel.value = Math.min(100, (average / 255) * 100)

    animationFrame = requestAnimationFrame(updateVolume)
  }

  updateVolume()
}

// 清理资源
const cleanup = () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }

  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }

  if (scriptProcessor) {
    scriptProcessor.disconnect()
    scriptProcessor = null
  }

  if (analyser) {
    analyser.disconnect()
    analyser = null
  }

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }

  isReady.value = false
  isRecording.value = false
  volumeLevel.value = 0
  recordingDuration.value = 0
  pcmBuffer = []

  // 不重置设备选择状态，保持用户的选择
  // hasCheckedDevices.value = false
  // showDeviceSelector.value = false
  // selectedDeviceId.value = ''
  // audioDevices.value = []
}

// 组件挂载时自动检测设备
onMounted(() => {
  if (props.autoInit) {
    checkMicrophoneDevices()
  }
})

// 组件卸载时清理资源
onUnmounted(() => {
  cleanup()
})

// 开始录音
const startRecording = () => {
  if (!isReady.value) {
    ElMessage.warning('请先初始化麦克风')
    return
  }

  if (isRecording.value) {
    ElMessage.warning('正在录音中')
    return
  }

  // 检查音频上下文状态
  if (audioContext && audioContext.state === 'suspended') {
    console.log('音频上下文被暂停，尝试恢复...')
    audioContext
      .resume()
      .then(() => {
        console.log('音频上下文已恢复')
      })
      .catch((err) => {
        console.error('恢复音频上下文失败:', err)
      })
  }

  // 清空之前的缓冲区
  pcmBuffer = []
  isRecording.value = true
  recordingStartTime = Date.now()
  recordingDuration.value = 0

  // 启动录音时长计时器
  recordingTimer = setInterval(() => {
    recordingDuration.value = Math.floor((Date.now() - recordingStartTime) / 1000)
  }, 1000)

  console.log('开始录音，音频配置:')
  console.log(`- 采样率: ${props.sampleRate} Hz`)
  console.log(`- 声道数: ${props.channels}`)
  console.log(`- 缓冲区大小: 1024 样本`)

  emit('recordingStart')
  ElMessage.success('开始录音')
}

// 停止录音
const stopRecording = () => {
  if (!isRecording.value) {
    ElMessage.warning('当前未在录音')
    return
  }

  isRecording.value = false

  // 清除录音计时器
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }

  // 将Float32Array数据转换为PCM格式
  const pcmData = convertToPCM()

  emit('recordingStop', pcmData)
  ElMessage.success(`录音结束，时长: ${recordingDuration.value}秒`)
}

// 将Float32Array转换为16位PCM数据
const convertToPCM = (): ArrayBuffer => {
  if (pcmBuffer.length === 0) {
    console.warn('PCM缓冲区为空')
    return new ArrayBuffer(0)
  }

  // 计算总样本数
  const totalSamples = pcmBuffer.reduce((sum, buffer) => sum + buffer.length, 0)
  console.log(`转换PCM数据: ${pcmBuffer.length} 个缓冲区, ${totalSamples} 个样本`)

  // 创建16位PCM数据
  const pcmData = new Int16Array(totalSamples)
  let offset = 0

  // 将Float32数据转换为Int16
  for (const buffer of pcmBuffer) {
    for (let i = 0; i < buffer.length; i++) {
      // 将-1到1的浮点数转换为-32768到32767的整数
      let sample = buffer[i]

      // 确保样本值在有效范围内
      sample = Math.max(-1, Math.min(1, sample))

      // 转换为16位整数（使用更精确的转换）
      pcmData[offset + i] = Math.round(sample * 32767)
    }
    offset += buffer.length
  }

  const resultSize = pcmData.buffer.byteLength
  const durationSeconds = totalSamples / props.sampleRate

  console.log(`PCM转换完成:`)
  console.log(`- 数据大小: ${resultSize} 字节 (${(resultSize / 1024).toFixed(1)} KB)`)
  console.log(`- 时长: ${durationSeconds.toFixed(2)} 秒`)
  console.log(`- 采样率: ${props.sampleRate} Hz`)
  console.log(`- 位深: 16位`)
  console.log(`- 声道: 单声道`)

  // 检查数据质量
  const samples = new Int16Array(pcmData.buffer)
  const nonZeroSamples = samples.filter((s) => s !== 0).length
  const dataQuality = (nonZeroSamples / samples.length) * 100
  console.log(`- 数据质量: ${dataQuality.toFixed(1)}% 非零样本`)

  if (dataQuality < 10) {
    console.warn('警告: 音频数据质量较低，可能录音有问题')
  }

  return pcmData.buffer
}

// 暴露方法给父组件
defineExpose({
  checkMicrophoneDevices,
  initMicrophone,
  resetMicrophone,
  resetDeviceSelection,
  cleanup,
  startRecording,
  stopRecording,
  isReady,
  isRecording,
  hasCheckedDevices,
  selectedDeviceId,
  audioDevices,
  recordingDuration,
})
</script>

<style scoped>
.interview-microphone {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.microphone-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.microphone-indicator.ready {
  background: #e8f5e8;
  color: #67c23a;
}

.microphone-indicator.checking {
  background: #f0f9ff;
  color: #409eff;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.status-text {
  font-size: 14px;
  font-weight: 500;
}

.device-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.device-info {
  display: flex;
  justify-content: center;
}

.device-count {
  font-size: 12px;
  color: #909399;
}

.volume-indicator {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.volume-bar {
  width: 100%;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.volume-level {
  height: 100%;
  background: linear-gradient(90deg, #67c23a 0%, #e6a23c 50%, #f56c6c 100%);
  transition: width 0.1s ease;
  border-radius: 2px;
}

.volume-text {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.microphone-controls {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.microphone-controls .el-button {
  min-width: 80px;
  flex: 1;
}

.status-ready {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #67c23a;
  font-size: 14px;
  font-weight: 500;
}

.recording-indicator {
  color: #f56c6c;
  font-weight: bold;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0.3;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .interview-microphone {
    padding: 12px;
  }

  .microphone-indicator {
    padding: 6px 10px;
  }

  .status-text {
    font-size: 13px;
  }
}
</style>
