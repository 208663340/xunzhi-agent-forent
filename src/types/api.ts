// API相关通用类型定义

// 通用响应结构
export interface ApiResponse<T = any> {
  code: string
  message: string
  data: T
  success: boolean
}

// HTTP请求方法
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// 请求配置
export interface RequestConfig {
  url: string
  method?: HttpMethod
  data?: any
  params?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
}

// 分页请求参数
export interface PaginationReq {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 分页响应数据
export interface PaginationResp<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
