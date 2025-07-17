<template>
  <div class="agent-market-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- Agent广场入口 -->
      <div class="agent-market-header">
        <h3>Agent广场</h3>
        <el-button type="primary" size="small" @click="goToChat">
          <el-icon>
            <ChatDotRound />
          </el-icon>
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
          <el-icon>
            <component :is="category.icon" />
          </el-icon>
          <span>{{ category.name }}</span>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="market-main">
      <!-- 顶部搜索栏 -->
      <div class="search-header">
        <el-input v-model="searchKeyword" placeholder="搜索Agent..." class="search-input" clearable>
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="createAgent">
          <el-icon>
            <Plus />
          </el-icon>
          创建Agent
        </el-button>
      </div>

      <!-- Agent列表 -->
      <div class="agent-grid">
        <!-- Agent卡片 -->
        <div v-for="agent in filteredAgents" :key="agent.id" class="agent-card">
          <div class="agent-avatar">
            <el-avatar :size="60" :src="agent.avatar">
              <el-icon size="30">
                <User />
              </el-icon>
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
                <el-icon>
                  <User />
                </el-icon>
                {{ agent.users }}人使用
              </span>
              <span class="stat-item">
                <el-icon>
                  <Star />
                </el-icon>
                {{ agent.rating }}
              </span>
            </div>
          </div>
          <div class="agent-actions">
            <el-button type="primary" size="small" @click="useAgent(agent)"> 使用 </el-button>
            <el-button size="small" @click="viewAgent(agent)"> 详情 </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
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
  Microphone,
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const searchKeyword = ref('')
const activeCategory = ref('all')

// 分类数据
const categories = ref([
  { id: 'all', name: '全部', icon: Grid },
  { id: 'chat', name: '对话助手', icon: ChatDotRound },
  { id: 'writing', name: '写作助手', icon: Document },
  { id: 'image', name: '图像处理', icon: Picture },
  { id: 'video', name: '视频处理', icon: VideoCamera },
  { id: 'audio', name: '音频处理', icon: Microphone },
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
    category: 'chat',
  },
  {
    id: 2,
    name: '写作大师',
    description: '专业的写作助手，帮您创作优质内容',
    avatar: '',
    tags: ['写作', '创作', '文案'],
    users: 890,
    rating: 4.6,
    category: 'writing',
  },
  {
    id: 3,
    name: '图像生成器',
    description: 'AI图像生成和编辑工具',
    avatar: '',
    tags: ['图像', 'AI绘画', '设计'],
    users: 2100,
    rating: 4.9,
    category: 'image',
  },
  {
    id: 4,
    name: '代码助手',
    description: '编程开发的得力助手',
    avatar: '',
    tags: ['编程', '代码', '开发'],
    users: 1680,
    rating: 4.7,
    category: 'chat',
  },
  {
    id: 5,
    name: '翻译专家',
    description: '多语言翻译助手，支持100+种语言互译',
    avatar: '',
    tags: ['翻译', '多语言', '国际化'],
    users: 3200,
    rating: 4.9,
    category: 'chat',
  },
  {
    id: 6,
    name: '文档助手',
    description: '智能文档生成和格式化工具',
    avatar: '',
    tags: ['文档', '格式化', '自动化'],
    users: 756,
    rating: 4.5,
    category: 'writing',
  },
  {
    id: 7,
    name: '视频剪辑师',
    description: 'AI驱动的视频编辑和特效制作',
    avatar: '',
    tags: ['视频', '剪辑', '特效'],
    users: 1890,
    rating: 4.7,
    category: 'video',
  },
  {
    id: 8,
    name: '音频处理器',
    description: '专业的音频降噪、增强和编辑工具',
    avatar: '',
    tags: ['音频', '降噪', '编辑'],
    users: 1234,
    rating: 4.6,
    category: 'audio',
  },
  {
    id: 9,
    name: 'Logo设计师',
    description: '智能Logo设计和品牌视觉创作',
    avatar: '',
    tags: ['Logo', '设计', '品牌'],
    users: 2567,
    rating: 4.8,
    category: 'image',
  },
  {
    id: 10,
    name: '数据分析师',
    description: '智能数据分析和可视化报告生成',
    avatar: '',
    tags: ['数据', '分析', '可视化'],
    users: 987,
    rating: 4.4,
    category: 'chat',
  },
  {
    id: 11,
    name: '简历优化师',
    description: '专业简历优化和求职指导',
    avatar: '',
    tags: ['简历', '求职', '优化'],
    users: 1456,
    rating: 4.7,
    category: 'writing',
  },
  {
    id: 12,
    name: '短视频创作者',
    description: '短视频脚本创作和拍摄指导',
    avatar: '',
    tags: ['短视频', '脚本', '创作'],
    users: 3456,
    rating: 4.9,
    category: 'video',
  },
  {
    id: 13,
    name: '播客制作人',
    description: '播客内容策划和音频后期制作',
    avatar: '',
    tags: ['播客', '策划', '制作'],
    users: 678,
    rating: 4.5,
    category: 'audio',
  },
  {
    id: 14,
    name: '海报设计师',
    description: '创意海报和宣传物料设计',
    avatar: '',
    tags: ['海报', '宣传', '创意'],
    users: 1789,
    rating: 4.6,
    category: 'image',
  },
  {
    id: 15,
    name: '学习助手',
    description: '个性化学习计划和知识点梳理',
    avatar: '',
    tags: ['学习', '教育', '个性化'],
    users: 2890,
    rating: 4.8,
    category: 'chat',
  },
])

// 计算属性
const filteredAgents = computed(() => {
  let filtered = agents.value

  // 按分类筛选
  if (activeCategory.value !== 'all') {
    filtered = filtered.filter((agent) => agent.category === activeCategory.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    filtered = filtered.filter(
      (agent) =>
        agent.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        agent.tags.some((tag) => tag.toLowerCase().includes(searchKeyword.value.toLowerCase())),
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
  ElMessage({
    message: '创建Agent功能全力开发中，敬请期待！',
    type: 'info',
    duration: 3000,
  })
}

const useAgent = (agent: any) => {
  ElMessage({
    message: `${agent.name} 功能全力开发中，敬请期待！`,
    type: 'info',
    duration: 3000,
  })
}

const viewAgent = (agent: any) => {
  ElMessage({
    message: `${agent.name} 详情功能全力开发中，敬请期待！`,
    type: 'info',
    duration: 3000,
  })
}

onMounted(() => {
  // 组件挂载时的初始化逻辑
})
</script>

<style scoped>
.agent-market-container {
  height: 100vh;
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(228, 231, 237, 0.3);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.agent-market-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(228, 231, 237, 0.3);
  background: rgba(255, 255, 255, 0.8);
}

.agent-market-header h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.category-nav {
  flex: 1;
  padding: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  margin-bottom: 6px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 12px;
  font-weight: 500;
}

.category-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(4px);
}

.category-item.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.category-item span {
  font-size: 14px;
}

.market-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  min-height: 100vh;
  overflow-y: auto;
}

.search-header {
  display: flex;
  gap: 20px;
  margin-bottom: 32px;
  align-items: center;
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px 0;
  z-index: 1;
  border-radius: 16px;
  margin: 0 -8px 32px -8px;
  padding: 20px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.search-input {
  flex: 1;
  max-width: 450px;
}

.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
  flex: 1;
}

.agent-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.4s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.agent-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.agent-card:hover {
  box-shadow: 0 16px 48px rgba(102, 126, 234, 0.2);
  transform: translateY(-8px);
  border-color: rgba(102, 126, 234, 0.3);
}

.agent-card:hover::before {
  opacity: 1;
}

.agent-avatar {
  text-align: center;
  margin-bottom: 20px;
}

.agent-avatar .el-icon {
  font-size: 48px;
  color: #667eea;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.agent-info {
  margin-bottom: 20px;
}

.agent-name {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  text-align: center;
}

.agent-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #5a6c7d;
  line-height: 1.6;
  text-align: center;
}

.agent-tags {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.agent-stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #8492a6;
  justify-content: center;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.agent-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar {
    width: 260px;
  }

  .agent-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }

  .agent-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
  }

  .market-main {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .agent-market-container {
    flex-direction: column;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  }

  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .category-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 16px;
  }

  .category-item {
    margin: 0;
    flex: 1;
    min-width: 120px;
    justify-content: center;
    padding: 12px 16px;
    border-radius: 10px;
  }

  .market-main {
    padding: 16px;
  }

  .search-header {
    margin: 0 -8px 24px -8px;
    padding: 16px 20px;
  }

  .agent-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .agent-card {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .market-main {
    padding: 12px;
  }

  .search-header {
    padding: 12px 16px;
    margin: 0 -4px 20px -4px;
  }

  .agent-card {
    padding: 16px;
    border-radius: 16px;
  }

  .category-item {
    min-width: 100px;
    padding: 10px 12px;
  }
}
</style>
