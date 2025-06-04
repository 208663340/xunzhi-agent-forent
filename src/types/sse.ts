// SSE流式传输相关类型定义

// SSE选择项数据结构
export interface SSEChoice {
  delta: {
    role: string
    content: string
    reasoning_content: string
  }
  index: number
  finish_reason: string | null
}

// SSE工作流步骤
export interface SSEWorkflowStep {
  seq: number
  progress: number
}

// SSE数据结构
export interface SSEData {
  code: number
  message: string
  id: string
  created: number
  choices: SSEChoice[]
  workflow_step: SSEWorkflowStep
}

// 流式消息
export interface StreamMessage {
  content: string
  id: string
  progress: number | null
  step: number | null
  timestamp: Date
  isComplete: boolean
}

// 完成的消息
export interface CompletedMessage {
  content: string
  timestamp: Date
}

// SSE连接配置
export interface SSEConfig {
  url: string
  method?: 'GET' | 'POST'
  body?: any
  headers?: Record<string, string>
  withCredentials?: boolean
  retryInterval?: number
  maxRetries?: number
}

// 事件回调类型
export type SSEEventCallback = {
  onMessage?: (message: StreamMessage) => void
  onComplete?: (finalMessage: string) => void
  onError?: (error: Error) => void
  onOpen?: () => void
  onClose?: () => void
  onSessionId?: (sessionId: string) => void
}
