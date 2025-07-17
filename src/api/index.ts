// 需要先安装axios依赖: npm install axios @types/axios
// 需要先安装axios依赖包
// npm install axios
// npm install @types/axios --save-dev
import axios, { type AxiosResponse } from 'axios'
import type {
  ApiResponse,
  User,
  UserLoginReq,
  UserLoginResp,
  UserRegisterReq,
  UserUpdateReq,
  AdminUserReq,
  UserRespDTO,
  UserActualRespDTO,
  UserMessageReq,
  AgentChatReq,
  XunfeiAudioToTextReq,
  XunfeiAudioToTextResp,
  XunfeiFaceCompareReq,
  XunfeiFaceCompareResp,
  XunfeiFaceAttributeReq,
  XunfeiFaceAttributeResp,
  ResumeAnalysisReq,
  ResumeAnalysisResp,
  RadarDataResp,
  InterviewQuestionsReq,
  InterviewQuestionsResp,
  InterviewAnswerReq,
  InterviewAnswerResp,
  InterviewSuggestionsResp,
  RadarChartResp,
  DemeanorEvaluationReq,
  AgentSessionCreateReq,
  AgentSessionCreateResp,
} from './types'

// 创建axios实例
const api = axios.create({
  baseURL: '', // 使用相对路径，通过Vite代理转发到后端
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加token到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('发送请求时使用的token:', token)
    } else {
      console.warn('请求时未找到token')
    }

    // 添加用户信息到请求头
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        // 对可能包含中文字符的字段进行URL编码
        config.headers.username = encodeURIComponent(user.username || '')
        config.headers.userId = user.id
        // realName字段如果存在的话也添加，需要进行URL编码以支持中文字符
        if (user.realName) {
          config.headers.realName = encodeURIComponent(user.realName)
        }
      } catch (error) {
        console.error('解析用户信息失败:', error)
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    if (data.success) {
      return response
    } else {
      // 增强错误信息，包含更多调试上下文
      const errorMessage = `API请求失败: ${data.message || '未知错误'}`
      const errorDetails = {
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
        status: response.status,
        data: data
      }
      console.error('API响应错误:', errorDetails)
      return Promise.reject(new Error(errorMessage))
    }
  },
  (error) => {
    // 网络错误或其他HTTP错误的处理
    if (error.response?.status === 401) {
      // token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('isLoggedIn')
      window.location.href = '/login'
    } else {
      // 记录详细的错误信息
      const errorDetails = {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }
      console.error('HTTP请求错误:', errorDetails)
    }
    return Promise.reject(error)
  },
)

// 用户相关API
export const userApi = {
  // 用户登录
  login: (data: UserLoginReq): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post('/api/xunzhi/v1/users/login', data)
  },

  // 用户注册
  register: (data: UserRegisterReq): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.post('/api/xunzhi/v1/users/register', data)
  },

  // 检查用户是否登录
  checkLogin: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get('/api/xunzhi/v1/users/check-login')
  },

  // 用户退出登录
  logout: (): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.post('/api/xunzhi/v1/users/logout')
  },

  // 根据用户名查询用户信息
  getUserByUsername: (username: string): Promise<AxiosResponse<ApiResponse<UserRespDTO>>> => {
    return api.get(`/api/xunzhi/v1/users/${username}`)
  },

  // 根据用户名查询无脱敏用户信息
  getActualUserByUsername: (
    username: string,
  ): Promise<AxiosResponse<ApiResponse<UserActualRespDTO>>> => {
    return api.get(`/api/xunzhi/v1/users/actual/${username}`)
  },

  // 查询用户名是否存在
  hasUsername: (username: string): Promise<AxiosResponse<ApiResponse<boolean>>> => {
    return api.get('/api/xunzhi/v1/users/has-username', {
      params: { username },
    })
  },

  // 修改用户信息
  updateUser: (data: UserUpdateReq): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.put('/api/xunzhi/v1/users', data)
  },

  // 校验当前用户是否为管理员
  isAdmin: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get('/api/xunzhi/v1/users/is-admin')
  },

  // 添加管理员 (需要管理员权限)
  addAdmin: (data: AdminUserReq): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.post('/api/xunzhi/v1/users/admin', data)
  },
}

// Agent聊天相关API
export const agentApi = {
  // Agent聊天（SSE流式响应）
  chat: (data: UserMessageReq): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post('/api/xunzhi-agent/admin/v1/agent/chat', data)
  },

  // 普通聊天请求（如果需要非SSE方式）
  chatSync: (data: UserMessageReq): Promise<AxiosResponse<ApiResponse<string>>> => {
    return api.post('/api/xunzhi-agent/admin/v1/agent/chat-sync', data)
  },

  // 获取雷达图数据
  getRadarData: (): Promise<AxiosResponse<ApiResponse<RadarChartResp>>> => {
    return api.get('/api/xunzhi/v1/agents/radar-chart', {})
  },

  // 创建Agent会话
  createSession: (data: AgentSessionCreateReq): Promise<AxiosResponse<ApiResponse<AgentSessionCreateResp>>> => {
    return api.post('/api/xunzhi/v1/agents/sessions', data)
  },

  // 面试题获取接口（长时间请求）
  generateInterviewQuestions: (sessionId: string, resumePdf: File): Promise<AxiosResponse<any>> => {
    const formData = new FormData()
    formData.append('resumePdf', resumePdf)
    
    return api.post(`/api/xunzhi/v1/agents/sessions/${sessionId}/interview-questions?agentId=8`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2分钟超时
    })
  },

  // 获取面试题列表
  getInterviewQuestions: (sessionId: string): Promise<AxiosResponse<ApiResponse<InterviewQuestionsResp>>> => {
    return api.get('/api/xunzhi/v1/agents/interview/questions', {
      params: { sessionId, agentId: 11 }
    })
  },

  // 回答面试题
  answerQuestion: (data: InterviewAnswerReq): Promise<AxiosResponse<ApiResponse<InterviewAnswerResp>>> => {
    const formData = new FormData()
    
    // 添加必需参数
    if (data.questionNumber) formData.append('questionNumber', data.questionNumber)
    if (data.answerContent) formData.append('answerContent', data.answerContent)
    if (data.sessionId) formData.append('sessionId', data.sessionId)
    if (data.agentId) formData.append('agentId', data.agentId.toString())
    if (data.audioFile) formData.append('audioFile', data.audioFile)

    return api.post('/api/xunzhi/v1/agents/interview/answer', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // 获取面试建议
  getInterviewSuggestions: (sessionId?: string): Promise<AxiosResponse<ApiResponse<InterviewSuggestionsResp>>> => {
    return api.get('/api/xunzhi/v1/agents/interview/suggestions', {
      params: sessionId ? { sessionId } : {}
    })
  },

  // 获取用户当前总分
  getInterviewScore: (): Promise<AxiosResponse<ApiResponse<number>>> => {
    return api.get('/api/xunzhi/v1/agents/interview/score')
  },

  // 获取用户简历评分
  getResumeScore: (sessionId?: string): Promise<AxiosResponse<ApiResponse<number>>> => {
    return api.get('/api/xunzhi/v1/agents/resume/score', {
      params: sessionId ? { sessionId } : {}
    })
  },

  // 神态评分接口
  evaluateDemeanor: (data: DemeanorEvaluationReq): Promise<AxiosResponse<ApiResponse<string>>> => {
    const formData = new FormData()
    formData.append('userPhoto', data.userPhoto)
    
    return api.post(`/api/xunzhi/v1/agents/demeanor-evaluation?agentId=${data.agentId}&sessionId=${data.sessionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// AI会话管理相关API
export const aiConversationApi = {
  // 创建AI会话
  createConversation: (data: {
    userName: string
    aiId: number
    firstMessage: string
  }): Promise<AxiosResponse<ApiResponse<{ sessionId: string; conversationTitle: string }>>> => {
    return api.post('/api/xunzhi/v1/ai/conversations', data)
  },

  // 分页查询会话列表
  getConversations: (params: {
    current?: number
    size?: number
    aiId?: number
    status?: number
    title?: string
  }): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get('/api/xunzhi/v1/ai/conversations', { params })
  },

  // 根据会话ID获取会话信息
  getConversationById: (sessionId: string): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/api/xunzhi/v1/ai/conversations/${sessionId}`)
  },

  // 更新会话信息
  updateConversation: (sessionId: string, params: {
    messageCount?: number
    title?: string
  }): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.put(`/api/xunzhi/v1/ai/conversations/${sessionId}`, null, { params })
  },

  // 删除会话
  deleteConversation: (sessionId: string): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/api/xunzhi/v1/ai/conversations/${sessionId}`)
  },

  // 结束会话
  endConversation: (sessionId: string): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.put(`/api/xunzhi/v1/ai/conversations/${sessionId}/end`)
  },
}

// AI消息管理相关API
export const aiMessageApi = {
  // AI聊天SSE接口
  chatSSE: (sessionId: string, data: {
    sessionId: string
    inputMessage: string
    aiId: number
    messageSeq: number
    userName: string
  }): Promise<AxiosResponse<any>> => {
    return api.post(`/api/xunzhi/v1/ai/sessions/${sessionId}/chat`, data)
  },

  // 查询会话历史消息
  getHistory: (sessionId: string): Promise<AxiosResponse<ApiResponse<any[]>>> => {
    return api.get(`/api/xunzhi/v1/ai/history/${sessionId}`)
  },

  // 分页查询历史消息
  getHistoryPage: (params: {
    sessionId?: string
    current: number
    size: number
  }): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get('/api/xunzhi/v1/ai/history/page', { params })
  },
}

// 讯飞API相关
export const xunfeiApi = {
  // 音频转文字
  audioToText: (audioFile: File): Promise<AxiosResponse<ApiResponse<XunfeiAudioToTextResp>>> => {
    const formData = new FormData()
    formData.append('audioFile', audioFile)

    return api.post('/api/xunzhi-agent/admin/v1/xunfei/audio-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // 实时音频转文字
  realtimeAudioToText: (audioFile: File): Promise<AxiosResponse<ApiResponse<string>>> => {
    const formData = new FormData()
    formData.append('audioFile', audioFile)

    return api.post('/api/xunzhi-agent/admin/v1/xunfei/realtime-audio-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // 人脸对比
  // compareFaces: (image1: File, image2: File): Promise<AxiosResponse<ApiResponse<XunfeiFaceCompareResp>>> => {
  //   const formData = new FormData()
  //   formData.append('image1', image1)
  //   formData.append('image2', image2)

  //   return api.post('/api/xunzhi-agent/admin/v1/xunfei/compare-faces', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   })
  // },

  // 检测所有人脸属性
  // detectAllAttributes: (image: File): Promise<AxiosResponse<ApiResponse<XunfeiFaceAttributeResp>>> => {
  //   const formData = new FormData()
  //   formData.append('image', image)

  //   return api.post('/api/xunzhi-agent-agent/admin/v1/xunfei/detect-all-attributes', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   })
  // },

  // 检测单个人脸属性
  // detectSingleAttribute: (image: File, attribute: string): Promise<AxiosResponse<ApiResponse<string>>> => {
  //   const formData = new FormData()
  //   formData.append('image', image)

  //   return api.post(`/api/xunzhi-agent/admin/v1/xunfei/detect-single-attribute/${attribute}`, formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   })
  // }
}

// 简历分析相关API
export const resumeApi = {
  // 获取简历分析结果
  getAnalysis: (
    resumeId: string,
    candidateId: string,
  ): Promise<AxiosResponse<ApiResponse<ResumeAnalysisResp>>> => {
    return api.get('/api/xunzhi-agent/admin/v1/resume/analysis', {
      params: { resumeId, candidateId },
    })
  },

  // 提交简历进行分析
  submitForAnalysis: (
    data: ResumeAnalysisReq,
  ): Promise<AxiosResponse<ApiResponse<ResumeAnalysisResp>>> => {
    return api.post('/api/xunzhi-agent/admin/v1/resume/analyze', data)
  },
}

// 导出默认的axios实例
export default api
