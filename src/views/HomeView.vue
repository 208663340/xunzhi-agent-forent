<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const agentsSection = ref(null)

// 标题分词
const titleWords = ref(['迅智', '多模态', '评测平台'])

// 特性数据
const features = ref([
  {
    icon: '🎯',
    title: '精准评测',
    desc: 'AI智能分析',
  },
  {
    icon: '🚀',
    title: '高效提升',
    desc: '快速进步',
  },
  {
    icon: '💼',
    title: '专业指导',
    desc: '专家建议',
  },
])

// 统计数据
const stats = ref([
  {
    number: '10,000+',
    label: '用户信赖',
    progress: 95,
  },
  {
    number: '50,000+',
    label: '面试场次',
    progress: 88,
  },
  {
    number: '98%',
    label: '满意度',
    progress: 98,
  },
  {
    number: '24/7',
    label: '在线服务',
    progress: 100,
  },
])

// 智能体数据
const agents = ref([
  {
    id: 1,
    name: '前端面试官',
    description: 'HTML/CSS/JavaScript/Vue/React技术栈面试评测',
    icon: '🌐',
    color: '#409EFF',
    category: 'frontend',
  },
  {
    id: 2,
    name: '后端面试官',
    description: 'Java/Python/Node.js/数据库等后端技术面试',
    icon: '⚙️',
    color: '#67C23A',
    category: 'backend',
  },
  {
    id: 3,
    name: '测试面试官',
    description: '软件测试理论与实践、自动化测试面试评测',
    icon: '🔍',
    color: '#E6A23C',
    category: 'testing',
  },
  {
    id: 4,
    name: '物联网面试官',
    description: '嵌入式开发、传感器、通信协议面试评测',
    icon: '📡',
    color: '#F56C6C',
    category: 'iot',
  },
  {
    id: 5,
    name: '算法面试官',
    description: '数据结构与算法、编程题目面试评测',
    icon: '🧮',
    color: '#909399',
    category: 'algorithm',
  },
  {
    id: 6,
    name: '产品面试官',
    description: '产品设计、用户体验、商业分析面试评测',
    icon: '💡',
    color: '#9C27B0',
    category: 'product',
  },
])

// 粒子样式生成
const getParticleStyle = (index: number) => {
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const animationDuration = Math.random() * 20 + 10
  const animationDelay = Math.random() * 5

  return {
    width: size + 'px',
    height: size + 'px',
    left: left + '%',
    animationDuration: animationDuration + 's',
    animationDelay: animationDelay + 's',
  }
}

// 滚动到智能体区域
const scrollToAgents = () => {
  if (agentsSection.value) {
    agentsSection.value.scrollIntoView({ behavior: 'smooth' })
  }
}

// 卡片悬停效果
const handleCardHover = (index: number) => {
  // 可以添加更多交互逻辑
  console.log('Card hovered:', index)
}

const handleCardLeave = (index: number) => {
  // 可以添加更多交互逻辑
  console.log('Card left:', index)
}

// 开始面试
const startInterview = (agent: any) => {
  // 跳转到对话页面，可以传递智能体信息
  router.push({
    path: '/chat',
    query: { agent: agent.category },
  })
}

// 组件挂载后的初始化
onMounted(() => {
  // 可以添加一些初始化动画
  nextTick(() => {
    // 动画初始化逻辑
  })
})
</script>

<template>
  <div class="home-container">
    <!-- 粒子背景 -->
    <div class="particles-bg">
      <div v-for="i in 50" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>

    <!-- 宣传广告区域 -->
    <div class="hero-section">
      <div class="hero-bg-effects">
        <div class="floating-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
          <div class="shape shape-4"></div>
        </div>
      </div>

      <div class="hero-content">
        <div class="hero-text">
          <div class="title-container">
            <h1 class="hero-title">
              <span
                class="title-word"
                v-for="(word, index) in titleWords"
                :key="index"
                :style="{ animationDelay: index * 0.2 + 's' }"
              >
                {{ word }}
              </span>
            </h1>

            <p class="platform-intro-simple">一个基于讯飞平台的多模态智能面试评测系统</p>

            <div class="title-underline"></div>
          </div>

          <p class="hero-subtitle">
            <span class="subtitle-highlight">在这里你可以</span>
            <span class="typing-text">高效进行模拟面试，来进行查漏补缺</span>
          </p>

          <div class="hero-features">
            <div
              class="feature-item"
              v-for="(feature, index) in features"
              :key="index"
              :style="{ animationDelay: (index + 1) * 0.3 + 's' }"
            >
              <div class="feature-icon-wrapper">
                <span class="feature-icon">{{ feature.icon }}</span>
                <div class="icon-glow"></div>
              </div>
              <div class="feature-content">
                <span class="feature-title">{{ feature.title }}</span>
                <span class="feature-desc">{{ feature.desc }}</span>
              </div>
            </div>
          </div>

          <div class="cta-section">
            <button class="cta-button" @click="scrollToAgents">
              <span class="cta-text">开始体验</span>
              <div class="cta-ripple"></div>
            </button>
          </div>
        </div>

        <div class="hero-image">
          <div class="hero-graphic">
            <div class="graphic-main">
              <div class="center-orb"></div>
              <div class="orbit-ring ring-1">
                <div class="orbit-dot dot-1"></div>
                <div class="orbit-dot dot-2"></div>
                <div class="orbit-dot dot-3"></div>
              </div>
              <div class="orbit-ring ring-2">
                <div class="orbit-dot dot-4"></div>
                <div class="orbit-dot dot-5"></div>
              </div>
              <div class="orbit-ring ring-3">
                <div class="orbit-dot dot-6"></div>
              </div>
            </div>
            <div class="graphic-glow"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计数据区域 -->
    <div class="stats-section">
      <div class="stats-container">
        <div class="stat-item" v-for="(stat, index) in stats" :key="index">
          <div class="stat-number">{{ stat.number }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-progress">
            <div class="progress-bar" :style="{ width: stat.progress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 智能体展示区域 -->
    <div class="agents-section" ref="agentsSection">
      <div class="section-bg-pattern"></div>

      <div class="section-header">
        <div class="header-decoration">
          <div class="deco-line left"></div>
          <div class="deco-icon">⚡</div>
          <div class="deco-line right"></div>
        </div>
        <h2 class="section-title">
          <span class="title-gradient">选择面试方向</span>
        </h2>
        <p class="section-subtitle">选择你想要练习的技术方向，开始专业的模拟面试</p>
      </div>

      <div class="agents-grid">
        <div
          v-for="(agent, index) in agents"
          :key="agent.id"
          class="agent-card"
          :class="`card-${index % 3}`"
          @click="startInterview(agent)"
          @mouseenter="handleCardHover(index)"
          @mouseleave="handleCardLeave(index)"
        >
          <div class="card-bg-effect"></div>
          <div class="card-border-glow"></div>

          <div class="agent-header">
            <div class="agent-icon-container">
              <div class="agent-icon" :style="{ backgroundColor: agent.color }">
                {{ agent.icon }}
              </div>
              <div class="icon-rings">
                <div class="ring ring-1"></div>
                <div class="ring ring-2"></div>
              </div>
            </div>
            <div class="agent-badge">{{ agent.category.toUpperCase() }}</div>
          </div>

          <div class="agent-content">
            <h3 class="agent-name">{{ agent.name }}</h3>
            <p class="agent-description">{{ agent.description }}</p>

            <div class="agent-skills">
              <div class="skill-bar" v-for="i in 3" :key="i">
                <div class="skill-progress" :style="{ width: 80 + i * 5 + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="agent-action">
            <div class="start-btn">
              <span class="btn-text">开始面试</span>
              <div class="btn-arrow">→</div>
              <div class="btn-glow"></div>
            </div>
          </div>

          <div class="card-corner-effects">
            <div class="corner corner-tl"></div>
            <div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div>
            <div class="corner corner-br"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow-y: auto;
  position: relative;
}

/* 粒子背景 */
.particles-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.particle {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float linear infinite;
}

@keyframes float {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

/* 宣传广告区域 */
.hero-section {
  min-height: 25vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px 40px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%);
  color: #333;
  position: relative;
  overflow: hidden;
  z-index: 2;
}

.hero-bg-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  animation: floatShape 15s ease-in-out infinite;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 10%;
  animation-delay: 5s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  bottom: 20%;
  left: 20%;
  animation-delay: 10s;
}

.shape-4 {
  width: 120px;
  height: 120px;
  top: 30%;
  right: 30%;
  animation-delay: 7s;
}

@keyframes floatShape {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-30px) rotate(120deg);
  }
  66% {
    transform: translateY(20px) rotate(240deg);
  }
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 50px;
  position: relative;
  z-index: 3;
}

.hero-text {
  flex: 1;
}

.title-container {
  position: relative;
  margin-bottom: 30px;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 20px;
  background: linear-gradient(45deg, #333, #555, #444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-word {
  display: inline-block;
  animation: titleSlideIn 1s ease-out forwards;
  opacity: 0;
  transform: translateY(50px);
}

@keyframes titleSlideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.title-underline {
  height: 4px;
  background: linear-gradient(90deg, #333, transparent);
  border-radius: 2px;
  animation: underlineExpand 2s ease-out 1s forwards;
  width: 0;
}

@keyframes underlineExpand {
  to {
    width: 200px;
  }
}

.hero-subtitle {
  font-size: 1.4rem;
  margin-bottom: 30px;
  line-height: 1.8;
}

.subtitle-highlight {
  background: rgba(0, 0, 0, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  margin-right: 10px;
}

.typing-text {
  position: relative;
  overflow: hidden;
  border-right: 2px solid #333;
  animation:
    typing 3s steps(20) 2s forwards,
    blink 1s infinite 2s;
  white-space: nowrap;
  width: 0;
}

@keyframes typing {
  to {
    width: 100%;
  }
}

@keyframes blink {
  50% {
    border-color: transparent;
  }
}

.platform-intro-simple {
  margin: 1rem 0;
  font-size: 1.4rem;
  color: #333;
  text-align: center;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-features {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px 25px;
  border-radius: 15px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: featureSlideIn 0.8s ease-out forwards;
  opacity: 0;
  transform: translateX(-50px);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(10px);
}

@keyframes featureSlideIn {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.feature-icon-wrapper {
  position: relative;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon {
  font-size: 1.8rem;
  z-index: 2;
  position: relative;
}

.icon-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 50%;
  animation: iconGlow 2s ease-in-out infinite;
}

@keyframes iconGlow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.feature-content {
  display: flex;
  flex-direction: column;
}

.feature-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.feature-desc {
  font-size: 0.9rem;
  opacity: 0.8;
}

.cta-section {
  margin-top: 25px;
}

.cta-button {
  position: relative;
  background: linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
  background-size: 300% 300%;
  border: none;
  padding: 18px 40px;
  border-radius: 50px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  animation: gradientShift 3s ease infinite;
  transition: all 0.3s ease;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.cta-text {
  position: relative;
  z-index: 2;
}

.cta-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.6s ease;
}

.cta-button:active .cta-ripple {
  width: 300px;
  height: 300px;
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-graphic {
  position: relative;
  width: 400px;
  height: 400px;
}

.graphic-main {
  position: relative;
  width: 100%;
  height: 100%;
}

.center-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, #fff, #e6f3ff);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: orbPulse 3s ease-in-out infinite;
  box-shadow: 0 0 50px rgba(255, 255, 255, 0.5);
}

@keyframes orbPulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.orbit-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.ring-1 {
  width: 150px;
  height: 150px;
  animation: orbitRotate 10s linear infinite;
}

.ring-2 {
  width: 220px;
  height: 220px;
  animation: orbitRotate 15s linear infinite reverse;
}

.ring-3 {
  width: 300px;
  height: 300px;
  animation: orbitRotate 20s linear infinite;
}

@keyframes orbitRotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.orbit-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
}

.dot-1 {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}
.dot-2 {
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
}
.dot-3 {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
}
.dot-4 {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}
.dot-5 {
  bottom: -6px;
  right: 50%;
  transform: translateX(50%);
}
.dot-6 {
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
}

.graphic-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.8;
  }
}

/* 统计数据区域 */
.stats-section {
  padding: 40px 40px;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  position: relative;
  z-index: 2;
}

.stats-container {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
}

.stat-item {
  text-align: center;
  color: white;
  padding: 30px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-10px);
  background: rgba(255, 255, 255, 0.1);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #3498db, #e74c3c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 15px;
}

.stat-progress {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #e74c3c);
  border-radius: 2px;
  animation: progressFill 2s ease-out forwards;
  width: 0;
}

@keyframes progressFill {
  to {
    width: var(--progress, 100%);
  }
}

/* 智能体展示区域 */
.agents-section {
  padding: 60px 40px;
  background: #f8fafc;
  position: relative;
  z-index: 2;
}

.section-bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(118, 75, 162, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.section-header {
  text-align: center;
  margin-bottom: 50px;
}

.header-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}

.deco-line {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
}

.deco-icon {
  font-size: 2rem;
  color: #667eea;
  animation: iconBounce 2s ease-in-out infinite;
}

@keyframes iconBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.section-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.title-gradient {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-subtitle {
  font-size: 1.2rem;
  color: #718096;
  max-width: 600px;
  margin: 0 auto;
}

.agents-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 40px;
}

.agent-card {
  background: white;
  border-radius: 20px;
  padding: 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  border: 2px solid transparent;
}

.agent-card:hover {
  transform: translateY(-15px) scale(1.02);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
  border-color: #667eea;
}

.card-bg-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.agent-card:hover .card-bg-effect {
  opacity: 1;
}

.card-border-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #667eea, #764ba2, #667eea);
  background-size: 200% 200%;
  border-radius: 22px;
  opacity: 0;
  animation: borderGlow 3s ease infinite;
  z-index: -1;
}

.agent-card:hover .card-border-glow {
  opacity: 1;
}

@keyframes borderGlow {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.agent-header {
  padding: 30px 30px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.agent-icon-container {
  position: relative;
}

.agent-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  color: white;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
}

.agent-card:hover .agent-icon {
  transform: scale(1.1) rotate(10deg);
}

.icon-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring {
  position: absolute;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring-1 {
  width: 100px;
  height: 100px;
  animation: ringRotate 8s linear infinite;
}

.ring-2 {
  width: 120px;
  height: 120px;
  animation: ringRotate 12s linear infinite reverse;
}

@keyframes ringRotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.agent-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 1px;
}

.agent-content {
  padding: 0 30px 20px;
}

.agent-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 15px;
  transition: color 0.3s ease;
}

.agent-card:hover .agent-name {
  color: #667eea;
}

.agent-description {
  color: #718096;
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 1rem;
}

.agent-skills {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.skill-progress {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  animation: skillFill 1.5s ease-out forwards;
  width: 0;
}

@keyframes skillFill {
  to {
    width: var(--width, 85%);
  }
}

.agent-action {
  padding: 20px 30px 30px;
}

.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 30px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.agent-card:hover .start-btn {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.btn-text {
  position: relative;
  z-index: 2;
}

.btn-arrow {
  position: relative;
  z-index: 2;
  transition: transform 0.3s ease;
}

.agent-card:hover .btn-arrow {
  transform: translateX(5px);
}

.btn-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.agent-card:hover .btn-glow {
  left: 100%;
}

.card-corner-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #667eea;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.agent-card:hover .corner {
  opacity: 1;
}

.corner-tl {
  top: 10px;
  left: 10px;
  border-right: none;
  border-bottom: none;
}

.corner-tr {
  top: 10px;
  right: 10px;
  border-left: none;
  border-bottom: none;
}

.corner-bl {
  bottom: 10px;
  left: 10px;
  border-right: none;
  border-top: none;
}

.corner-br {
  bottom: 10px;
  right: 10px;
  border-left: none;
  border-top: none;
}

/* 卡片变体样式 */
.card-0 {
  animation: cardSlideIn 0.8s ease-out forwards;
  animation-delay: 0.1s;
}

.card-1 {
  animation: cardSlideIn 0.8s ease-out forwards;
  animation-delay: 0.3s;
}

.card-2 {
  animation: cardSlideIn 0.8s ease-out forwards;
  animation-delay: 0.5s;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
    gap: 30px;
  }

  .hero-title {
    font-size: 2.8rem;
  }

  .hero-features {
    align-items: center;
  }

  .agents-grid {
    grid-template-columns: 1fr;
    gap: 25px;
  }

  .hero-section,
  .agents-section,
  .stats-section {
    padding: 40px 20px;
  }

  .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .hero-graphic {
    width: 300px;
    height: 300px;
  }

  .section-header {
    margin-bottom: 30px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2.2rem;
  }

  .section-title {
    font-size: 2.2rem;
  }

  .stats-container {
    grid-template-columns: 1fr;
  }
}
</style>
