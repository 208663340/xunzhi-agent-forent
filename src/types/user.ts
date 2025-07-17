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

// 用户更新请求参数
export interface UserUpdateReq {
  username: string
  password?: string
  realName?: string
  phone?: string
  mail?: string
}

// 管理员用户请求参数
export interface AdminUserReq {
  userId: number
}

// 用户响应DTO
export interface UserRespDTO {
  id: number
  username: string
  realName: string
  phone: string
  mail: string
}

// 用户实际响应DTO（无脱敏）
export interface UserActualRespDTO {
  id: number
  username: string
  realName: string
  phone: string
  mail: string
}
