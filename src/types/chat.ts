// 聊天相关类型定义

// 聊天消息类型
export interface ChatMessage {
  id: string // 唯一标识
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  messageSeq: number // 消息序列号
  isStreaming?: boolean // 是否正在流式传输
  isComplete?: boolean  // 是否传输完成
}

// 聊天会话类型
export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  lastMessage: Date
  agentId?: number
  messageSeq: number // 消息序列号计数器
  backendSessionId?: string // 后端返回的真实会话ID
}

// Agent类型定义
export interface Agent {
  id: number
  name: string
  description: string
  avatar?: string
  category?: string
  isActive: boolean
}

// Agent聊天请求参数
export interface AgentChatReq {
  sessionId?: string  // 可选，新会话时为空
  agentId: number
  inputMessage: string
  userName: string
}

// 用户消息请求参数
export interface UserMessageReq {
  userName: string
  agentId: number
  inputMessage: string
  messageSeq: number
  sessionId?: string // 会话ID，首次对话时为空
}
