<template>
  <div class="camera-test">
    <h1>摄像头定时抓拍测试</h1>
    
    <div class="test-controls">
      <el-button @click="showCamera = !showCamera" type="primary">
        {{ showCamera ? '隐藏摄像头' : '显示摄像头' }}
      </el-button>
      
      <el-form inline>
        <el-form-item label="会话ID:">
          <el-input v-model="sessionId" placeholder="请输入会话ID" style="width: 200px" />
        </el-form-item>
        
        <el-form-item label="Agent ID:">
          <el-input-number v-model="agentId" :min="1" style="width: 120px" />
        </el-form-item>
        
        <el-form-item label="抓拍间隔(秒):">
          <el-input-number v-model="captureInterval" :min="1" :max="60" style="width: 120px" />
        </el-form-item>
      </el-form>
    </div>
    
    <div class="evaluation-results">
      <h3>神态评分结果:</h3>
      <div class="score-list">
        <div v-for="(score, index) in evaluationScores" :key="index" class="score-item">
          <span class="score-time">{{ score.time }}</span>
          <span class="score-value">{{ score.score }}分</span>
        </div>
      </div>
    </div>
    
    <!-- 摄像头组件 -->
    <InterviewCamera
      v-if="showCamera"
      :session-id="sessionId"
      :agent-id="agentId"
      :capture-interval="captureInterval"
      :auto-start="true"
      @close="showCamera = false"
      @demeanor-evaluated="handleDemeanorEvaluated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import InterviewCamera from '@/components/InterviewCamera.vue'

// 响应式数据
const showCamera = ref(false)
const sessionId = ref('test-session-123')
const agentId = ref(1)
const captureInterval = ref(5)
const evaluationScores = ref<Array<{ time: string; score: string }>>([])

// 处理神态评分结果
const handleDemeanorEvaluated = (score: string) => {
  const now = new Date()
  const timeStr = now.toLocaleTimeString()
  
  evaluationScores.value.unshift({
    time: timeStr,
    score: score
  })
  
  // 只保留最近20条记录
  if (evaluationScores.value.length > 20) {
    evaluationScores.value = evaluationScores.value.slice(0, 20)
  }
  
  ElMessage.success(`神态评分: ${score}分`)
}
</script>

<style scoped>
.camera-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-controls {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.evaluation-results {
  margin: 20px 0;
  padding: 20px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.score-list {
  max-height: 400px;
  overflow-y: auto;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin: 4px 0;
  background: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.score-time {
  color: #666;
  font-size: 14px;
}

.score-value {
  font-weight: bold;
  color: #409eff;
  font-size: 16px;
}
</style>