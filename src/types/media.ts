// 媒体相关类型定义

// 录音数据结构
export interface Recording {
  blob: Blob
  timestamp: string
  duration: string
}

// 讯飞语音转文字请求参数
export interface XunfeiAudioToTextReq {
  audioFile: File
}

// 讯飞语音转文字响应
export interface XunfeiAudioToTextResp {
  text: string
  confidence?: number
}

// 讯飞人脸比对请求参数
export interface XunfeiFaceCompareReq {
  image1: File
  image2: File
}

// 讯飞人脸比对响应
export interface XunfeiFaceCompareResp {
  similarity: number
  isMatch: boolean
}

// 讯飞人脸属性检测请求参数
export interface XunfeiFaceAttributeReq {
  image: File
  attributes?: string[]  // 可选，指定要检测的属性
}

// 讯飞人脸属性检测响应
export interface XunfeiFaceAttributeResp {
  age?: number
  gender?: string
  emotion?: string
  [key: string]: any  // 其他属性
}
