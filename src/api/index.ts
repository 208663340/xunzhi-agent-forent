// 需要先安装axios依赖: npm install axios @types/axios
// 需要先安装axios依赖包
// npm install axios
// npm install @types/axios --save-dev
import axios, { type AxiosResponse } from 'axios'
import type {
  ApiResponse,
  UserLoginReq,
  UserLoginResp,
  UserRegisterReq,
  UserMessageReq,
  AgentChatReq,
  XunfeiAudioToTextReq,
  XunfeiAudioToTextResp,
  XunfeiFaceCompareReq,
  XunfeiFaceCompareResp,
  XunfeiFaceAttributeReq,
  XunfeiFaceAttributeResp
} from './types'

// 创建axios实例
const api = axios.create({
  baseURL: '', // 使用相对路径，通过Vite代理转发到后端
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加token到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加用户信息到请求头
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        config.headers.username = user.username
        config.headers.userId = user.id
        // realName字段如果存在的话也添加
        if (user.realName) {
          config.headers.realName = user.realName
        }
      } catch (error) {
        console.error('解析用户信息失败:', error)
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    if (data.success) {
      return response
    } else {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      // token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('isLoggedIn')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 用户相关API
export const userApi = {
  // 用户登录
  login: (data: UserLoginReq): Promise<AxiosResponse<ApiResponse<UserLoginResp>>> => {
    return api.post('/api/short-link/admin/v1/user/login', data)
  },

  // 用户注册
  register: (data: UserRegisterReq): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.post('/api/short-link/admin/v1/user', data)
  },

  // 检查登录状态
  checkLogin: (username: string, token: string): Promise<AxiosResponse<ApiResponse<boolean>>> => {
    return api.get('/api/short-link/admin/v1/user/check-login', {
      params: { username, token }
    })
  },

  // 用户退出登录
  logout: (username: string, token: string): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete('/api/short-link/admin/v1/user/logout', {
      params: { username, token }
    })
  }
}

// Agent聊天相关API
export const agentApi = {
  // Agent聊天（SSE流式响应）
  chat: (data: UserMessageReq): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post('/api/short-link/admin/v1/agent/chat', data)
  },

  // 普通聊天请求（如果需要非SSE方式）
  chatSync: (data: UserMessageReq): Promise<AxiosResponse<ApiResponse<string>>> => {
    return api.post('/api/short-link/admin/v1/agent/chat-sync', data)
  }
}

// 讯飞API相关
export const xunfeiApi = {
  // 音频转文字
  audioToText: (audioFile: File): Promise<AxiosResponse<ApiResponse<XunfeiAudioToTextResp>>> => {
    const formData = new FormData()
    formData.append('audioFile', audioFile)

    return api.post('/api/short-link/admin/v1/xunfei/audio-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 实时音频转文字
  realtimeAudioToText: (audioFile: File): Promise<AxiosResponse<ApiResponse<string>>> => {
    const formData = new FormData()
    formData.append('audioFile', audioFile)

    return api.post('/api/short-link/admin/v1/xunfei/realtime-audio-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  // 人脸对比
  // compareFaces: (image1: File, image2: File): Promise<AxiosResponse<ApiResponse<XunfeiFaceCompareResp>>> => {
  //   const formData = new FormData()
  //   formData.append('image1', image1)
  //   formData.append('image2', image2)

  //   return api.post('/api/short-link/admin/v1/xunfei/compare-faces', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   })
  // },

  // 检测所有人脸属性
  // detectAllAttributes: (image: File): Promise<AxiosResponse<ApiResponse<XunfeiFaceAttributeResp>>> => {
  //   const formData = new FormData()
  //   formData.append('image', image)

  //   return api.post('/api/short-link/admin/v1/xunfei/detect-all-attributes', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   })
  // },

  // 检测单个人脸属性
  // detectSingleAttribute: (image: File, attribute: string): Promise<AxiosResponse<ApiResponse<string>>> => {
  //   const formData = new FormData()
  //   formData.append('image', image)

  //   return api.post(`/api/short-link/admin/v1/xunfei/detect-single-attribute/${attribute}`, formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   })
  // }
}

// 导出默认的axios实例
export default api
