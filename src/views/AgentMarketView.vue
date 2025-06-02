<template>
  <div class="agent-market-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- Agent广场入口 -->
      <div class="agent-market-header">
        <h3>Agent广场</h3>
        <el-button type="primary" size="small" @click="goToChat">
          <el-icon><ChatDotRound /></el-icon>
          返回对话
        </el-button>
      </div>

      <!-- 分类导航 -->
      <div class="category-nav">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          :class="{ active: category.id === activeCategory }"
          @click="switchCategory(category.id)"
        >
          <el-icon>{{ category.icon }}</el-icon>
          <span>{{ category.name }}</span>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="market-main">
      <!-- 顶部搜索栏 -->
      <div class="search-header">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索Agent..."
          class="search-input"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="createAgent">
          <el-icon><Plus /></el-icon>
          创建Agent
        </el-button>
      </div>

      <!-- Agent列表 -->
      <div class="agent-grid">
        <div v-if="!isApiConnected" class="api-notice">
          <el-alert
            title="接口暂未开通"
            description="Agent广场功能正在开发中，敬请期待！"
            type="info"
            :closable="false"
            show-icon
          />
        </div>

        <!-- 示例Agent卡片 -->
        <div v-for="agent in filteredAgents" :key="agent.id" class="agent-card">
          <div class="agent-avatar">
            <el-avatar :size="60" :src="agent.avatar">
              <el-icon size="30"><Robot /></el-icon>
            </el-avatar>
          </div>
          <div class="agent-info">
            <h4 class="agent-name">{{ agent.name }}</h4>
            <p class="agent-description">{{ agent.description }}</p>
            <div class="agent-tags">
              <el-tag v-for="tag in agent.tags" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>
            <div class="agent-stats">
              <span class="stat-item">
                <el-icon><User /></el-icon>
                {{ agent.users }}人使用
              </span>
              <span class="stat-item">
                <el-icon><Star /></el-icon>
                {{ agent.rating }}
              </span>
            </div>
          </div>
          <div class="agent-actions">
            <el-button type="primary" size="small" @click="useAgent(agent)">
              使用
            </el-button>
            <el-button size="small" @click="viewAgent(agent)">
              详情
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  ChatDotRound,
  Monitor,
  User,
  Star,
  Grid,
  Document,
  Picture,
  VideoCamera,
  Microphone
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const searchKeyword = ref('')
const activeCategory = ref('all')
const isApiConnected = ref(false) // 模拟接口未开通状态

// 分类数据
const categories = ref([
  { id: 'all', name: '全部', icon: Grid },
  { id: 'chat', name: '对话助手', icon: ChatDotRound },
  { id: 'writing', name: '写作助手', icon: Document },
  { id: 'image', name: '图像处理', icon: Picture },
  { id: 'video', name: '视频处理', icon: VideoCamera },
  { id: 'audio', name: '音频处理', icon: Microphone }
])

// 示例Agent数据
const agents = ref([
  {
    id: 1,
    name: 'GPT-4助手',
    description: '强大的通用AI助手，能够处理各种复杂任务',
    avatar: '',
    tags: ['通用', 'GPT-4', '智能'],
    users: 1250,
    rating: 4.8,
    category: 'chat'
  },
  {
    id: 2,
    name: '写作大师',
    description: '专业的写作助手，帮您创作优质内容',
    avatar: '',
    tags: ['写作', '创作', '文案'],
    users: 890,
    rating: 4.6,
    category: 'writing'
  },
  {
    id: 3,
    name: '图像生成器',
    description: 'AI图像生成和编辑工具',
    avatar: '',
    tags: ['图像', 'AI绘画', '设计'],
    users: 2100,
    rating: 4.9,
    category: 'image'
  },
  {
    id: 4,
    name: '代码助手',
    description: '编程开发的得力助手',
    avatar: '',
    tags: ['编程', '代码', '开发'],
    users: 1680,
    rating: 4.7,
    category: 'chat'
  }
])

// 计算属性
const filteredAgents = computed(() => {
  let filtered = agents.value

  // 按分类筛选
  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(agent => agent.category === activeCategory.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    filtered = filtered.filter(agent =>
      agent.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      agent.tags.some(tag => tag.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    )
  }

  return filtered
})

// 方法
const goToChat = () => {
  router.push('/chat')
}

const switchCategory = (categoryId: string) => {
  activeCategory.value = categoryId
}

const createAgent = () => {
  // TODO: 实现创建Agent功能
  console.log('创建Agent')
}

const useAgent = (agent: any) => {
  // TODO: 实现使用Agent功能
  console.log('使用Agent:', agent.name)
}

const viewAgent = (agent: any) => {
  // TODO: 实现查看Agent详情功能
  console.log('查看Agent详情:', agent.name)
}

onMounted(() => {
  // 组件挂载时的初始化逻辑
})
</script>

<style scoped>
.agent-market-container {
  height: 100%;
  display: flex;
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.sidebar {
  width: 280px;
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.agent-market-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.agent-market-header h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.category-nav {
  flex: 1;
  padding: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 8px;
}

.category-item:hover {
  background: white;
}

.category-item.active {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  color: #409eff;
}

.category-item span {
  font-size: 14px;
}

.market-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: white;
}

.search-header {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  flex: 1;
}

.api-notice {
  grid-column: 1 / -1;
  margin-bottom: 20px;
}

.agent-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.agent-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.agent-avatar {
  text-align: center;
  margin-bottom: 16px;
}

.agent-info {
  margin-bottom: 16px;
}

.agent-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.agent-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.agent-tags {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.agent-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.agent-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }

  .agent-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .agent-market-container {
    flex-direction: column;
  }

  .sidebar {
    display: none;
  }

  .market-main {
    padding: 16px;
  }

  .agent-grid {
    grid-template-columns: 1fr;
  }

  .search-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    max-width: none;
  }
}
</style>
