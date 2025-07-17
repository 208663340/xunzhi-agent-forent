<template>
  <div class="interview-container">
    <div class="interview-content">
      <!-- 欢迎区域 -->
      <div v-if="!resumeUploaded" class="welcome-section">
        <div class="welcome-text">
          <h2>欢迎来到智能面试室</h2>
          <p>我是你的智能面试官，上传简历即可开始面试</p>
        </div>
        
        <div class="upload-section">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="false"
            accept=".pdf,.doc,.docx"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将简历文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF、Word 格式文件
              </div>
            </template>
          </el-upload>
          
          <!-- 文件状态显示区域 -->
          <div v-if="selectedFile" class="file-status">
            <div class="file-info">
              <el-icon class="file-icon" :class="getFileIconClass(selectedFile.name)">
                <Document />
              </el-icon>
              <div class="file-details">
                <span class="file-name">{{ selectedFile.name }}</span>
                <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
              </div>
              <el-icon class="success-icon"><CircleCheck /></el-icon>
            </div>
          </div>
          
          <el-button 
            v-if="selectedFile"
            type="primary" 
            size="large" 
            @click="uploadResume"
            :loading="uploading"
            class="upload-btn"
          >
            {{ uploading ? '正在分析简历...' : '开始面试' }}
          </el-button>
        </div>
      </div>

      <!-- 面试题目区域 -->
      <div v-else class="interview-section">
        <div class="interview-header">
          <h2>智能面试进行中</h2>
          <p>请依次回答以下问题，每题录音完成后会自动标记为已完成</p>
          <div class="progress-info">
            <span>进度：{{ questions.filter(q => q.completed).length }} / {{ questions.length }}</span>
            <el-progress 
              :percentage="Math.round((questions.filter(q => q.completed).length / questions.length) * 100)"
              :stroke-width="8"
              class="progress-bar"
            />
          </div>
        </div>

        <div class="questions-list">
          <InterviewQuestion
            v-for="(question, index) in questions"
            :key="question.id"
            :question-number="`${index + 1}`"
            :question-text="question.content"
            :is-completed="question.completed || false"
            :is-current="index === currentQuestionIndex"
            @recording-complete="handleQuestionRecordingComplete"
          />
        </div>



        <!-- 面试完成区域 -->
        <div v-if="questions.length > 0 && questions.every(q => q.completed === true)" class="completion-section">
          <el-result
            icon="success"
            title="面试完成！"
            sub-title="感谢您的参与，正在生成您的综合评分报告..."
          >
            <template #extra>
              <el-button type="primary" @click="viewReport" :loading="generatingReport">
                {{ generatingReport ? '正在生成报告...' : '查看评分报告' }}
              </el-button>
              <el-button @click="resetInterview">重新面试</el-button>
              <el-button @click="$router.push('/')">返回首页</el-button>
            </template>
          </el-result>
        </div>
      </div>
    </div>

    <!-- 摄像头小窗口 -->
    <InterviewCamera
      v-if="showCamera"
      :auto-start="true"
      :session-id="sessionId"
      :agent-id="AGENT_IDS.DEMEANOR_ANALYZER"
      :capture-interval="20"
      @close="handleCameraClose"
      @recording-start="handleRecordingStart"
      @recording-stop="handleRecordingStop"
      @demeanor-evaluated="handleDemeanorEvaluated"
    />



    <!-- 评分报告弹窗 -->
    <el-dialog
      v-model="showReportDialog"
      title="综合评分报告"
      width="1200px"
      top="3vh"
      :before-close="() => showReportDialog = false"
    >
      <div v-if="reportData" class="report-content">
         <div class="report-layout">
           <!-- 顶部评分区域 -->
           <div class="top-section">
             <div class="left-scores">
               <div class="overall-score">
                 <h3>综合得分</h3>
                 <div class="score-circle">
                   <span class="score-number">{{ reportData.overallScore }}</span>
                   <span class="score-label">分</span>
                 </div>
               </div>
             </div>
             
             <div class="right-scores">
               <div class="detailed-scores">
                 <h3>详细评分</h3>
                 <div class="score-items">
                   <div class="score-item">
                     <span class="item-name">简历得分</span>
                     <el-progress :percentage="reportData.resumeScore" :stroke-width="8" />
                     <span class="item-score">{{ reportData.resumeScore }}分</span>
                   </div>
                   <div class="score-item">
                     <span class="item-name">面试表现</span>
                     <el-progress :percentage="reportData.interviewPerformance" :stroke-width="8" />
                     <span class="item-score">{{ reportData.interviewPerformance }}分</span>
                   </div>
                   <div class="score-item">
                     <span class="item-name">神态管理</span>
                     <el-progress :percentage="reportData.demeanorEvaluation" :stroke-width="8" />
                     <span class="item-score">{{ reportData.demeanorEvaluation }}分</span>
                   </div>
                   <div class="score-item">
                     <span class="item-name">用户潜力</span>
                     <el-progress :percentage="reportData.potentialIndex" :stroke-width="8" />
                     <span class="item-score">{{ reportData.potentialIndex }}分</span>
                   </div>
                   <div class="score-item">
                     <span class="item-name">专业技能</span>
                     <el-progress :percentage="reportData.professionalSkills" :stroke-width="8" />
                     <span class="item-score">{{ reportData.professionalSkills }}分</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>
           
           <!-- 中间面试建议区域 -->
           <div v-if="reportData.suggestions && Object.keys(reportData.suggestions).length > 0" class="center-suggestions">
             <div class="suggestions-header">
               <h2>面试建议</h2>
               <p class="suggestions-subtitle">基于您的面试表现，我们为您提供以下专业建议</p>
             </div>
             <div class="suggestions-grid">
               <div v-for="(suggestion, key) in reportData.suggestions" :key="key" class="suggestion-card">
                 <div class="suggestion-body">
                   <div class="suggestion-title">{{ key }}</div>
                   <div class="suggestion-content">{{ suggestion }}</div>
                 </div>
               </div>
             </div>
           </div>
           
           <!-- 底部雷达图区域 -->
           <div class="bottom-section">
             <div class="radar-section">
               <h3>技能雷达图</h3>
               <div ref="radarChartRef" class="radar-chart"></div>
             </div>
           </div>
         </div>
       </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showReportDialog = false">关闭</el-button>
          <el-button type="primary" @click="downloadReport">下载报告</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document, CircleCheck, TrendCharts } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import InterviewQuestion from '@/components/InterviewQuestion.vue'
import InterviewCamera from '@/components/InterviewCamera.vue'

import * as echarts from 'echarts'
import { agentApi } from '@/api'
import type { InterviewQuestionsResp, InterviewSuggestionsResp, RadarChartResp } from '@/types'

const router = useRouter()

// 响应式数据
const resumeUploaded = ref(false)
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const generatingReport = ref(false)
const showCamera = ref(false)
const currentQuestionIndex = ref(0)

// 会话管理
const sessionId = ref<string>('')
// 不同智能体的ID
const AGENT_IDS = {
  QUESTION_GENERATOR: 8,  // 抽题官
  DEMEANOR_ANALYZER: 9,   // 神态分析官
  INTERVIEW_CHECKER: 11   // 面试题检查官
}
const currentUser = ref<string>('')

// 面试题目数据（从API获取）
const questions = ref<Array<{ id: string; content: string; completed?: boolean }>>([])

// 面试建议数据
const interviewSuggestions = ref<InterviewSuggestionsResp>({})

// 检查登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  
  console.log('页面加载时检查登录状态:')
  console.log('- Token存在:', !!token)
  console.log('- Token长度:', token?.length || 0)
  console.log('- 用户信息存在:', !!user)
  
  if (!token || !user) {
    ElMessage.error('请先登录后再进行面试')
    router.push('/login')
    return false
  }
  
  return true
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取文件图标类型
const getFileIconClass = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf':
      return 'pdf-file'
    case 'doc':
    case 'docx':
      return 'word-file'
    default:
      return 'default-file'
  }
}



// 处理文件选择
const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
  ElMessage.success(`已选择文件：${file.name}`)
}

// 上传简历
const uploadResume = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择简历文件')
    return
  }

  uploading.value = true
  
  try {
    // 获取当前用户信息
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      ElMessage.error('用户未登录，请先登录')
      router.push('/login')
      return
    }
    
    const user = JSON.parse(userStr)
    currentUser.value = user.username
    
    // 1. 创建Agent会话
    ElMessage.info('正在创建面试会话...')
    const sessionResponse = await agentApi.createSession({
      userName: currentUser.value,
      agentId: AGENT_IDS.INTERVIEW_CHECKER,
      firstMessage: '开始面试'
    })
    
    if (sessionResponse.data.success) {
      sessionId.value = sessionResponse.data.data.sessionId
      ElMessage.success('面试会话创建成功')
    } else {
      throw new Error('创建会话失败')
    }
    
    // 2. 生成面试题（长时间请求）
    ElMessage.info('正在分析简历并生成面试题，请稍候...')
    await agentApi.generateInterviewQuestions(sessionId.value, selectedFile.value)
    ElMessage.success('面试题生成完成')
    
    // 3. 获取面试题列表
      const questionsResponse = await agentApi.getInterviewQuestions(sessionId.value)
    if (questionsResponse.data.success) {
      const questionsData = questionsResponse.data.data
      questions.value = Object.entries(questionsData).map(([id, content]) => ({
        id,
        content: content as string,
        completed: false
      }))
      ElMessage.success(`成功获取${questions.value.length}道面试题`)
    }
    
    resumeUploaded.value = true
    showCamera.value = true // 面试开始时显示摄像头
    
    console.log('简历上传完成，状态更新:')
    console.log('- resumeUploaded:', resumeUploaded.value)
    console.log('- questions数量:', questions.value.length)
    console.log('- sessionId:', sessionId.value)
    
    ElMessage.success('简历上传成功，面试正式开始！')
  } catch (error) {
    console.error('面试准备失败:', error)
    ElMessage.error('面试准备失败，请重试')
  } finally {
    uploading.value = false
  }
}

// 处理题目录音完成
const handleQuestionRecordingComplete = async (questionNumber: string, pcmData: ArrayBuffer) => {
  const questionIndex = parseInt(questionNumber) - 1
  const question = questions.value[questionIndex]
  
  if (!question || question.completed) {
    return
  }

  try {
    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.error('未登录，请先登录')
      return
    }

    console.log('题目录音完成:', {
      questionNumber,
      pcmDataSize: pcmData.byteLength,
      sessionId: sessionId.value
    })

    // 调用回答面试题接口
    const response = await agentApi.answerQuestion({
      questionNumber: questionNumber,
      sessionId: sessionId.value,
      agentId: AGENT_IDS.INTERVIEW_CHECKER,
      audioFile: new File([pcmData], 'answer.pcm', { type: 'application/octet-stream' })
    })

    if (response.data.success) {
      // 更新题目完成状态
      question.completed = true
      
      ElMessage.success(`第${questionNumber}题完成！得分: ${response.data.data?.score || 0}分`)
      
      if (response.data.data?.feedback) {
        console.log('AI反馈:', response.data.data.feedback)
      }
      
      // 自动移动到下一题
      if (currentQuestionIndex.value < questions.value.length - 1) {
        currentQuestionIndex.value++
        ElMessage.info(`请回答第${currentQuestionIndex.value + 1}题`)
      } else {
        ElMessage.success('所有题目已完成！正在生成面试报告...')
        // 可以在这里触发生成面试报告
        await viewReport()
      }
    } else {
      ElMessage.error(response.data.message || '答案提交失败，请重试')
    }
  } catch (error) {
    console.error('提交答案失败:', error)
    ElMessage.error(`提交答案失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 重置面试
const resetInterview = () => {
  resumeUploaded.value = false
  selectedFile.value = null
  generatingReport.value = false
  showCamera.value = false
  showReportDialog.value = false
  currentQuestionIndex.value = 0
  
  // 重置题目完成状态
  questions.value.forEach(question => {
    question.completed = false
  })
  
  // 清理会话数据
  sessionId.value = ''
  questions.value = []
  reportData.value = null
  interviewSuggestions.value = {}
  
  // 清理雷达图
  if (radarChart) {
    radarChart.dispose()
    radarChart = null
  }
  
  ElMessage.info('面试已重置')
}

// 摄像头事件处理
const handleCameraClose = () => {
  showCamera.value = false
  ElMessage.info('摄像头已关闭')
}

const handleRecordingStart = () => {
  ElMessage.success('开始录制面试视频')
}

const handleRecordingStop = () => {
  ElMessage.success('面试视频录制完成')
}

// 神态评分数据存储
const demeanorScores = ref<number[]>([])

// 处理神态评分事件
const handleDemeanorEvaluated = (score: string) => {
  const numScore = parseFloat(score)
  console.log('收到神态评分:', numScore)
  demeanorScores.value.push(numScore)
  // 保持最近20个评分记录
  if (demeanorScores.value.length > 20) {
    demeanorScores.value.shift()
  }
}



// 显示评分报告弹窗
const showReportDialog = ref(false)
const reportData = ref(null)

// 雷达图相关
const radarChartRef = ref<HTMLElement | null>(null)
let radarChart: echarts.ECharts | null = null



// 查看评分报告
const viewReport = async () => {
  generatingReport.value = true
  
  try {
    ElMessage.info('正在生成评分报告...')
    
    // 1. 获取雷达图数据
    const radarResponse = await agentApi.getRadarData()
    let radarData: RadarChartResp
    
    if (radarResponse.data.success) {
      radarData = radarResponse.data.data
    } else {
      throw new Error('获取雷达图数据失败')
    }
    
    // 2. 获取面试建议
    const suggestionsResponse = await agentApi.getInterviewSuggestions(sessionId.value)
    if (suggestionsResponse.data.success) {
      interviewSuggestions.value = suggestionsResponse.data.data
    }
    
    // 3. 如果后端没有神态评分数据，则使用实时计算的神态评分
    if (radarData.demeanorEvaluation === 0 && demeanorScores.value.length > 0) {
      const sum = demeanorScores.value.reduce((acc, score) => acc + score, 0)
      const demeanorScore = Math.round((sum / demeanorScores.value.length) * 10) / 10
      radarData.demeanorEvaluation = demeanorScore
      console.log('使用实时计算的神态评分:', demeanorScore, '基于', demeanorScores.value.length, '个评分')
    } else {
      console.log('使用后端返回的神态评分:', radarData.demeanorEvaluation)
    }
    
    // 5. 计算综合得分
    const overallScore = (
      radarData.resumeScore +
      radarData.interviewPerformance +
      radarData.demeanorEvaluation +
      radarData.potentialIndex +
      radarData.professionalSkills
    ) / 5
    
    // 设置报告数据
    reportData.value = {
      ...radarData,
      overallScore: Math.round(overallScore * 10) / 10,
      suggestions: interviewSuggestions.value
    }
    
    // 显示报告弹窗
    showReportDialog.value = true
    
    // 等待DOM更新后初始化雷达图
    await nextTick()
    initRadarChart()
    
    ElMessage.success('评分报告已生成！')
  } catch (error) {
    console.error('生成报告失败:', error)
    ElMessage.error('生成报告失败，请重试')
  } finally {
    generatingReport.value = false
  }
}

// 初始化雷达图
const initRadarChart = () => {
  if (!radarChartRef.value || !reportData.value) return
  
  // 销毁已存在的图表
  if (radarChart) {
    radarChart.dispose()
  }
  
  radarChart = echarts.init(radarChartRef.value)
  
  // 设置固定的平均水平为70分
  const averageScore = 70
  
  const option = {
    title: {
      text: `综合评分: ${reportData.value.overallScore}分`,
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        const data = params.data
        const indicators = ['简历得分', '面试表现', '神态管理', '用户潜力', '专业技能']
        let result = `<div style="padding: 10px;">`
        result += `<div style="font-weight: bold; margin-bottom: 8px; color: #333;">${data.name}</div>`
        data.value.forEach((value: number, index: number) => {
          const color = value >= 80 ? '#67C23A' : value >= 60 ? '#E6A23C' : '#F56C6C'
          result += `<div style="margin: 4px 0; display: flex; justify-content: space-between; align-items: center;">`
          result += `<span style="color: #666;">${indicators[index]}:</span>`
          result += `<span style="color: ${color}; font-weight: bold; margin-left: 10px;">${value}分</span>`
          result += `</div>`
        })
        result += `</div>`
        return result
      }
    },
    legend: {
      data: ['当前评分', '平均水平'],
      bottom: 10,
      textStyle: {
        color: '#666'
      }
    },
    radar: {
      indicator: [
        { name: '简历得分', max: 100, color: '#409EFF' },
        { name: '面试表现', max: 100, color: '#67C23A' },
        { name: '神态管理', max: 100, color: '#E6A23C' },
        { name: '用户潜力', max: 100, color: '#F56C6C' },
        { name: '专业技能', max: 100, color: '#909399' }
      ],
      radius: '65%',
      center: ['50%', '55%'],
      axisName: {
        color: '#333',
        fontSize: 13,
        fontWeight: 'bold'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#e6e6e6',
          width: 1
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: [
            'rgba(102, 126, 234, 0.02)',
            'rgba(102, 126, 234, 0.05)',
            'rgba(102, 126, 234, 0.08)',
            'rgba(102, 126, 234, 0.12)',
            'rgba(102, 126, 234, 0.15)'
          ]
        }
      },
      splitNumber: 5
    },
    series: [{
      name: '技能评分',
      type: 'radar',
      data: [
        {
          value: [
            reportData.value.resumeScore,
            reportData.value.interviewPerformance,
            reportData.value.demeanorEvaluation,
            reportData.value.potentialIndex,
            reportData.value.professionalSkills
          ],
          name: '当前评分',
          areaStyle: {
            color: 'rgba(102, 126, 234, 0.25)'
          },
          lineStyle: {
            color: '#667eea',
            width: 3
          },
          itemStyle: {
            color: '#667eea',
            borderColor: '#fff',
            borderWidth: 2
          },
          symbol: 'circle',
          symbolSize: 8
        },
        {
          value: [averageScore, averageScore, averageScore, averageScore, averageScore],
          name: '平均水平',
          areaStyle: {
            color: 'rgba(255, 193, 7, 0.1)'
          },
          lineStyle: {
            color: '#ffc107',
            width: 2,
            type: 'dashed'
          },
          itemStyle: {
            color: '#ffc107',
            borderColor: '#fff',
            borderWidth: 1
          },
          symbol: 'diamond',
          symbolSize: 6
        }
      ]
    }]
  }
  
  radarChart.setOption(option)
  
  // 添加动画效果
  radarChart.setOption({
    animation: true,
    animationDuration: 1500,
    animationEasing: 'cubicOut'
  })
  
  // 监听窗口大小变化
  const resizeHandler = () => {
    radarChart?.resize()
  }
  window.addEventListener('resize', resizeHandler)
  
  // 清理事件监听器
  const cleanup = () => {
    window.removeEventListener('resize', resizeHandler)
  }
  
  // 存储清理函数以便后续调用
  if (radarChart) {
    (radarChart as any).cleanup = cleanup
  }
}

// 下载报告
const downloadReport = () => {
  ElMessage.success('报告下载功能开发中...')
}

// 组件挂载时的初始化
onMounted(() => {
  // 检查登录状态
  checkLoginStatus()
})

// 组件卸载时清理雷达图
onUnmounted(() => {
  if (radarChart) {
    // 清理事件监听器
    if ((radarChart as any).cleanup) {
      (radarChart as any).cleanup()
    }
    radarChart.dispose()
    radarChart = null
  }
})
</script>

<style scoped>
.interview-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.interview-content {
  max-width: 800px;
  margin: 0 auto;
}

.welcome-section {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.welcome-text h2 {
  font-size: 32px;
  color: #333;
  margin-bottom: 16px;
  font-weight: 600;
}

.welcome-text p {
  font-size: 18px;
  color: #666;
  margin-bottom: 40px;
}

.upload-section {
  max-width: 400px;
  margin: 0 auto;
}

.upload-demo {
  margin-bottom: 20px;
}

.upload-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

/* 文件状态显示样式 */
.file-status {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 24px;
  color: #409eff;
}

.file-icon.pdf-file {
  color: #e74c3c;
}

.file-icon.word-file {
  color: #2980b9;
}

.file-icon.default-file {
  color: #95a5a6;
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  word-break: break-all;
}

.file-size {
  font-size: 12px;
  color: #666;
}

.success-icon {
  font-size: 20px;
  color: #67c23a;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.interview-section {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.interview-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.interview-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 600;
}

.interview-header p {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.progress-info span {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.progress-bar {
  width: 300px;
}

.questions-list {
  margin-bottom: 30px;
}

.test-section {
  margin-top: 30px;
  padding: 20px;
  background: #fef9e7;
  border: 1px dashed #fadb14;
  border-radius: 8px;
  text-align: center;
}

.test-radar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.test-hint {
  font-size: 12px;
  color: #8c8c8c;
  font-style: italic;
}

.completion-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #f0f0f0;
}



/* 评分报告弹窗样式 */
.report-content {
  padding: 20px 0;
}

.report-content {
  max-height: 70vh;
  overflow-y: auto;
}

.report-layout {
  display: flex;
  flex-direction: column;
  gap: 30px;
  min-height: 700px;
  width: 100%;
}

.top-section {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.left-scores {
  flex: 0 0 300px;
}

.right-scores {
  flex: 1;
  min-width: 400px;
}

.center-suggestions {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  border-radius: 16px;
  padding: 40px;
  margin: 20px 0;
  border: 1px solid #e8f0ff;
}

.bottom-section {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 20px;
}

.radar-section {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.overall-score {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid #f0f0f0;
}

.overall-score h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
}

.score-circle {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-number {
  font-size: 36px;
  font-weight: bold;
  line-height: 1;
}

.score-label {
  font-size: 14px;
  margin-top: 4px;
}

.detailed-scores h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
}

.score-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.item-name {
  min-width: 80px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.score-item .el-progress {
  flex: 1;
}

.item-score {
  min-width: 50px;
  font-size: 14px;
  color: #333;
  font-weight: 600;
  text-align: right;
}

.radar-section {
  height: auto;
  min-height: 400px;
}

.radar-section h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
  text-align: center;
}

.radar-chart {
  width: 100%;
  height: 500px;
  min-height: 450px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.suggestions-header {
  text-align: center;
  margin-bottom: 30px;
}

.suggestions-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.suggestions-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  font-weight: 400;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
  margin-top: 30px;
}

.suggestion-card {
  padding: 25px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8f0ff;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.suggestion-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.suggestion-body {
  width: 100%;
}

.suggestion-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.4;
}

.suggestion-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  text-align: justify;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .interview-container {
    padding: 10px;
  }
  
  .welcome-section,
  .interview-section {
    padding: 20px;
  }
  
  .welcome-text h2 {
    font-size: 24px;
  }
  
  .interview-header h2 {
    font-size: 22px;
  }
  
  .progress-bar {
    width: 100%;
  }
  

  
  .report-layout {
    gap: 20px;
  }
  
  .top-section {
    flex-direction: column;
    gap: 20px;
  }
  
  .left-scores,
  .right-scores {
    flex: none;
    min-width: auto;
  }
  
  .center-suggestions {
    padding: 20px;
    margin: 10px 0;
  }
  
  .suggestions-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .suggestion-card {
    padding: 20px;
  }
  
  .suggestions-header h2 {
    font-size: 24px;
  }
  
  .radar-chart {
    height: 400px;
    min-height: 350px;
  }
  
  .score-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .item-name {
    min-width: auto;
  }
  
  .score-item .el-progress {
    width: 100%;
  }
  
  .item-score {
    align-self: flex-end;
  }
}
</style>