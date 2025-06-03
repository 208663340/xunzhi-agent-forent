// API接口类型定义

// 通用响应结构
export interface ApiResponse<T = any> {
  code: string
  message: string
  data: T
  success: boolean
}

// 用户相关类型定义
export interface User {
  id: string
  username: string
  realName?: string
  phone?: string
  mail?: string
  avatar?: string
}

// 用户登录请求参数
export interface UserLoginReq {
  username: string
  password: string
}

// 用户登录响应
export interface UserLoginResp {
  token: string
}

// 用户注册请求参数
export interface UserRegisterReq {
  username: string
  password: string
  realName: string
  phone: string
  mail: string
}

// 用户消息请求参数
export interface UserMessageReq {
  userName: string
  agentId: number
  inputMessage: string
}

// Agent聊天请求参数
export interface AgentChatReq {
  sessionId?: string  // 可选，新会话时为空
  agentId: number
  inputMessage: string
  userName: string
}

// 聊天消息类型
export interface ChatMessage {
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

// 聊天会话类型
export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  lastMessage: Date
  agentId?: number
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

// 讯飞API相关类型
export interface XunfeiAudioToTextReq {
  audioFile: File
}

export interface XunfeiAudioToTextResp {
  text: string
  confidence?: number
}

export interface XunfeiFaceCompareReq {
  image1: File
  image2: File
}

export interface XunfeiFaceCompareResp {
  similarity: number
  isMatch: boolean
}

export interface XunfeiFaceAttributeReq {
  image: File
  attributes?: string[]  // 可选，指定要检测的属性
}

export interface XunfeiFaceAttributeResp {
  age?: number
  gender?: string
  emotion?: string
  [key: string]: any  // 其他属性
}
