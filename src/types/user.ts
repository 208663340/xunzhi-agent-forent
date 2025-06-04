// 用户相关类型定义

// 用户信息
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
  id: string
  username: string
  avatar?: string
  phone?: string
}

// 用户注册请求参数
export interface UserRegisterReq {
  username: string
  password: string
  phone: string
  mail?: string
  realName?: string
}
