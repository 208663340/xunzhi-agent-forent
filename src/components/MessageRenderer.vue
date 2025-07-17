<template>
  <div class="message-renderer" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { computed, defineProps, withDefaults } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import 'highlight.js/styles/github.css'

interface Props {
  content: string
  type?: 'user' | 'ai'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'ai'
})

// 配置 marked
marked.setOptions({
  breaks: true, // 支持换行
  gfm: true, // 启用GitHub风格的Markdown
})

// 渲染内容
const renderedContent = computed(() => {
  if (props.type === 'user') {
    // 用户消息直接显示，不进行Markdown解析
    return escapeHtml(props.content)
  }

  try {
    // AI消息进行Markdown解析
    let html = marked.parse(props.content) as string
    
    // 手动处理代码高亮
    html = html.replace(/<pre><code class="language-(\w+)">(.*?)<\/code><\/pre>/gs, (match, lang, code) => {
      try {
        if (hljs.getLanguage(lang)) {
          const highlighted = hljs.highlight(code, { language: lang }).value
          return `<pre><code class="language-${lang}">${highlighted}</code></pre>`
        }
      } catch (err) {
        console.warn('代码高亮失败:', err)
      }
      return match
    })
    
    return sanitizeHtml(html)
  } catch (error) {
    console.error('Markdown解析失败:', error)
    return escapeHtml(props.content)
  }
})

// HTML转义函数
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 使用DOMPurify进行HTML清理（增强XSS防护）
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'strong', 'em', 'del', 'img', 'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id', 'style',
      'src', 'alt', 'title', 'width', 'height'
    ],
    FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  })
}
</script>

<style scoped>
.message-renderer {
  line-height: 1.6;
  word-wrap: break-word;
}

/* Markdown样式 */
.message-renderer :deep(h1),
.message-renderer :deep(h2),
.message-renderer :deep(h3),
.message-renderer :deep(h4),
.message-renderer :deep(h5),
.message-renderer :deep(h6) {
  margin: 16px 0 8px 0;
  font-weight: 600;
  line-height: 1.4;
}

.message-renderer :deep(h1) {
  font-size: 1.5em;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.message-renderer :deep(h2) {
  font-size: 1.3em;
}

.message-renderer :deep(h3) {
  font-size: 1.1em;
}

.message-renderer :deep(p) {
  margin: 8px 0;
}

.message-renderer :deep(ul),
.message-renderer :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.message-renderer :deep(li) {
  margin: 4px 0;
}

.message-renderer :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 4px solid #409eff;
  background-color: #f8f9fa;
  color: #666;
}

.message-renderer :deep(code) {
  background-color: #f1f3f4;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.message-renderer :deep(pre) {
  background-color: #f8f9fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  margin: 12px 0;
  overflow-x: auto;
  position: relative;
}

.message-renderer :deep(pre code) {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: 0.85em;
  line-height: 1.45;
}

.message-renderer :deep(table) {
  border-collapse: collapse;
  margin: 12px 0;
  width: 100%;
}

.message-renderer :deep(th),
.message-renderer :deep(td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.message-renderer :deep(th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

.message-renderer :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.message-renderer :deep(a:hover) {
  text-decoration: underline;
}

.message-renderer :deep(strong) {
  font-weight: 600;
}

.message-renderer :deep(em) {
  font-style: italic;
}

.message-renderer :deep(hr) {
  border: none;
  border-top: 1px solid #eee;
  margin: 16px 0;
}

/* 代码高亮主题调整 */
.message-renderer :deep(.hljs) {
  background: #f8f9fa !important;
  color: #333 !important;
}
</style>
