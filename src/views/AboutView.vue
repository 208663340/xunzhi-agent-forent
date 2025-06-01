<template>
  <div class="about-container">
    <div class="about-content">
      <div class="about-header">
        <el-icon class="about-icon" size="64"><InfoFilled /></el-icon>
        <h1>关于智能问答助手</h1>
        <p class="subtitle">基于AI技术的智能对话系统</p>
      </div>
      
      <div class="about-sections">
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Star /></el-icon>
              <span>产品特色</span>
            </div>
          </template>
          <ul class="feature-list">
            <li>🤖 智能AI对话，理解自然语言</li>
            <li>⚡ 快速响应，实时交互体验</li>
            <li>🎯 精准回答，专业知识库支持</li>
            <li>📱 响应式设计，多端适配</li>
          </ul>
        </el-card>
        
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Tools /></el-icon>
              <span>技术栈</span>
            </div>
          </template>
          <div class="tech-stack">
            <el-tag class="tech-tag" type="primary">Vue 3</el-tag>
            <el-tag class="tech-tag" type="success">TypeScript</el-tag>
            <el-tag class="tech-tag" type="info">Element Plus</el-tag>
            <el-tag class="tech-tag" type="warning">Pinia</el-tag>
            <el-tag class="tech-tag">Vite</el-tag>
          </div>
        </el-card>
        
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>使用说明</span>
            </div>
          </template>
          <div class="usage-guide">
            <p>1. 注册或登录您的账号</p>
            <p>2. 在首页输入您的问题</p>
            <p>3. AI助手将为您提供专业回答</p>
            <p>4. 支持连续对话和上下文理解</p>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

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
}
</style>
