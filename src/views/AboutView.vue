<template>
  <div class="about-container">
    <div class="about-content">
      <div class="about-header">
        <el-icon class="about-icon" size="64"><InfoFilled /></el-icon>
        <h1>关于我们</h1>
        <p class="subtitle">一个不起眼的个人独立开发</p>
      </div>

      <div class="about-sections">
        <el-card class="section-card developer-intro-full" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Avatar /></el-icon>
              <span>开发者介绍</span>
            </div>
          </template>
          <div class="developer-full-content">
            <div class="intro-section">
              <p class="intro-text">
                我是一名来自南京林业大学的独立开发者<strong>程序员牛鞭</strong>，专注于AI技术的研究与应用开发。
              </p>
              <p class="intro-text">
                致力于打造智能化的多模态评测平台，为用户提供优质的AI对话体验。
              </p>
              <p class="intro-text">
                如果对该项目感兴趣，欢迎加入我们的学习圈子，微信公众号搜索<strong>程序员牛肉</strong>即可。
              </p>
            </div>
            <div class="usage-section">
              <h3 class="section-title">
                <el-icon><User /></el-icon>
                使用说明
              </h3>
              <div class="usage-guide">
                <p>1. 注册或登录您的账号</p>
                <p>2. 在首页输入您的问题</p>
                <p>3. AI助手将为您提供专业回答</p>
                <p>4. 支持连续对话和上下文理解</p>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="section-card school-photos" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Picture /></el-icon>
              <span>南京林业大学风采</span>
            </div>
          </template>
          <div class="photo-gallery">
             <div class="photo-item" v-for="(photo, index) in schoolPhotos" :key="index">
               <el-image
                 :src="photo.src"
                 :alt="photo.alt"
                 fit="cover"
                 class="school-image"
               />
             </div>
           </div>
        </el-card>
        
        <el-card class="section-card product-features" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Star /></el-icon>
              <span>产品特色</span>
            </div>
          </template>
          <ul class="feature-list">
            <li>🤖 多模态AI对话：支持文本、图像、语音等多种输入方式</li>
            <li>🎯 智能评测系统：专业的AI能力评估和反馈机制</li>
            <li>💡 个性化推荐：根据用户需求提供定制化解决方案</li>
            <li>🔒 数据安全保障：严格的隐私保护和数据加密措施</li>
            <li>⚡ 实时响应：毫秒级的AI响应速度</li>
            <li>📱 跨平台支持：Web端、移动端全覆盖</li>
          </ul>
        </el-card>
        
        <el-card class="section-card tech-stack" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Tools /></el-icon>
              <span>技术栈</span>
            </div>
          </template>
          <div class="tech-content">
            <div class="tech-category">
              <h4>前端技术</h4>
              <p>Vue 3 + TypeScript + Element Plus + Vite</p>
            </div>
            <div class="tech-category">
              <h4>后端架构</h4>
              <p>Spring Boot + MyBatis + Redis + MongoDB</p>
            </div>
            <div class="tech-category">
              <h4>AI服务</h4>
              <p>科大讯飞 API + 多模态处理引擎</p>
            </div>
            <div class="tech-category">
              <h4>数据库</h4>
              <p>MySQL + ShardingSphere 分库分表</p>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { InfoFilled, Star, Tools, User, Avatar, Picture } from '@element-plus/icons-vue'

const schoolPhotos = [
  {
    src: '/avter/school1.png',
    alt: '南京林业大学校园风光1'
  },
  {
    src: '/avter/school2.png',
    alt: '南京林业大学校园风光2'
  },
  {
    src: '/avter/school3.png',
    alt: '南京林业大学校园风光3'
  }
]
</script>

<style scoped>
.about-container {
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 20px;
}

.about-content {
  max-width: 1000px;
  margin: 0 auto;
}

.about-header {
  text-align: center;
  margin-bottom: 40px;
}

.about-icon {
  color: #409eff;
  margin-bottom: 20px;
}

.about-header h1 {
  font-size: 36px;
  color: #333;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.subtitle {
  font-size: 18px;
  color: #666;
  margin: 0;
}

.about-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.section-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.section-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.tech-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.tech-category {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.tech-category h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.tech-category p {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tag {
  font-size: 12px;
}

.usage-guide p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.developer-intro-full {
  grid-column: 1 / -1;
}

.product-features {
  grid-column: span 1;
}

.tech-stack {
  grid-column: span 1;
}

.developer-full-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  padding: 8px 0;
}

.intro-section {
  padding-right: 16px;
}

.usage-section {
  padding-left: 16px;
  border-left: 2px solid #e4e7ed;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.intro-text {
  margin: 12px 0;
  font-size: 15px;
  color: #555;
  line-height: 1.8;
  text-align: justify;
}

.school-photos {
  grid-column: 1 / -1 !important;
}

.photo-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 8px 0;
}

.photo-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
  cursor: pointer;
}

.photo-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.school-image {
  width: 100%;
  height: 200px;
}



@media (max-width: 768px) {
  .about-container {
    padding: 20px 16px;
  }

  .about-header h1 {
    font-size: 28px;
  }

  .about-sections {
    grid-template-columns: 1fr;
  }

  .photo-gallery {
    grid-template-columns: 1fr;
  }

  .school-image {
    height: 180px;
  }

  .developer-full-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .intro-section {
    padding-right: 0;
  }

  .usage-section {
    padding-left: 0;
    border-left: none;
    border-top: 2px solid #e4e7ed;
    padding-top: 24px;
  }
}


</style>
