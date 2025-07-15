<template>
  <div class="resume-analysis-container">
    <div class="page-header">
      <h1>综合评分报告</h1>
    </div>

    <div class="analysis-content">
      <div class="radar-chart-container">
        <div ref="radarChartRef" class="radar-chart"></div>
      </div>

      <div class="analysis-details">
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <h3>评分详情</h3>
            </div>
          </template>
          <div class="score-list">
            <div v-for="(score, index) in scores" :key="index" class="score-item">
              <span class="dimension-name">{{ score.name }}</span>
              <el-rate v-model="score.value" :max="10" :colors="rateColors" :show-score="true" disabled />
            </div>
          </div>
        </el-card>

        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <h3>评价与建议</h3>
            </div>
          </template>
          <div class="feedback-content">
            <p>{{ feedback }}</p>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { agentApi } from '../api'
import type { RadarDataResp } from '../types/resume'

// 路由参数
const route = useRoute()
const userId = route.query.userId as string

// 雷达图DOM引用
const radarChartRef = ref<HTMLElement | null>(null)
let radarChart: echarts.ECharts | null = null

// 评分数据
const scores = reactive([
  { name: '简历得分', value: 0 },
  { name: '面试表现', value: 0 },
  { name: '神态管理', value: 0 },
  { name: '用户潜力', value: 0 },
  { name: '专业技能', value: 0 }
])

// 评分颜色
const rateColors = ['#F7BA2A', '#F7BA2A', '#67C23A']

// 评价与建议
const feedback = ref('暂无评价')

//获取雷达图数据
const fetchRadarData = async () => {
  try {
    const response = await agentApi.getRadarData()
    if (response.data.success) {
      const radarData = response.data.data
      scores[0].value = radarData.resumeScore
      scores[1].value = radarData.interviewPerformance
      scores[2].value = radarData.demeanorEvaluation
      scores[3].value = radarData.potentialIndex
      scores[4].value = radarData.professionalSkills
      initRadarChart()
    }
  } catch (error) {
    console.error('获取雷达图数据失败:', error)
  }
}
// const fetchRadarData = async () => {
//   try {
//     //const response = await agentApi.getRadarData(userId)
//     if (true) {
//       //const radarData = response.data.data
//       scores[0].value = 10
//       scores[1].value = 10
//       scores[2].value = 10
//       scores[3].value = 10
//       scores[4].value = 10
//       initRadarChart()
//     }
//   } catch (error) {
//     console.error('获取雷达图数据失败:', error)
//   }
// }
// 初始化雷达图
const initRadarChart = () => {
  if (!radarChartRef.value) return

  // 创建ECharts实例
  radarChart = echarts.init(radarChartRef.value)

  // 准备数据
  const indicators = scores.map(score => ({
    name: score.name,
    max: 10
  }))

  const data = scores.map(score => score.value)

  // 配置项
  const option: EChartsOption = {
    title: {
      text: '候选人能力评估',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: ['评分'],
      bottom: 0
    },
    radar: {
      indicator: indicators,
      shape: 'circle',
      splitNumber: 5,
      axisName: {
        color: '#333',
        fontSize: 12
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(255, 255, 255, 0.5)', 'rgba(240, 240, 240, 0.5)']
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.2)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.2)'
        }
      }
    },
    series: [
      {
        name: '评分',
        type: 'radar',
        data: [
          {
            value: data,
            name: '评分',
            areaStyle: {
              color: 'rgba(64, 158, 255, 0.6)'
            },
            lineStyle: {
              width: 2
            },
            itemStyle: {
              color: '#409EFF'
            }
          }
        ]
      }
    ]
  }

  // 使用配置项设置图表
  radarChart.setOption(option)

  // 立即调用一次resize以确保图表正确渲染
  setTimeout(() => {
    radarChart?.resize()
  }, 0)
}

// 处理窗口大小变化
const handleResize = () => {
  radarChart?.resize()
}

// 组件挂载后初始化图表
onMounted(() => {
  fetchRadarData()
  window.addEventListener('resize', handleResize)
})

// 组件卸载前清理事件监听
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  radarChart?.dispose()
})
</script>

<style scoped>
.resume-analysis-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  font-size: 28px;
  color: #303133;
}

.analysis-content {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.radar-chart-container {
  flex: 1;
  min-width: 400px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.radar-chart {
  width: 100%;
  height: 400px;
}

.analysis-details {
  flex: 1;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.score-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dimension-name {
  font-weight: 500;
  min-width: 100px;
}

.feedback-content {
  line-height: 1.8;
  color: #606266;
}

@media (max-width: 900px) {
  .analysis-content {
    flex-direction: column;
  }

  .radar-chart-container,
  .analysis-details {
    width: 100%;
  }
}
</style>
