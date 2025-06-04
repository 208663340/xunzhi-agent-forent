# API 接口使用说明

本文档说明了前端项目中各个API接口的使用方法和参数说明。

## 目录结构

```
src/api/
├── index.ts      # API接口定义
├── types.ts      # TypeScript类型定义
└── README.md     # 本文档
```

## 基础配置

### 后端服务地址
默认配置为 `http://localhost:8080`，可在 `src/api/index.ts` 中修改。

### 认证机制
- 登录成功后，token会自动保存到 localStorage
- 后续请求会自动在请求头中添加 `Authorization: Bearer {token}`
- token过期时会自动清除本地存储并跳转到登录页

## 用户相关接口

### 1. 用户登录

```typescript
import { userApi } from '@/api'

// 登录
const handleLogin = async () => {
  try {
    const response = await userApi.login({
      username: 'your_username',
      password: 'your_password'
    })
    
    const { token } = response.data.data
    localStorage.setItem('token', token)
    console.log('登录成功')
  } catch (error) {
    console.error('登录失败:', error.message)
  }
}
```

**请求参数：**
- `username`: string - 用户名
- `password`: string - 密码

**响应数据：**
- `token`: string - 用户认证令牌

### 2. 用户注册

```typescript
// 注册
const handleRegister = async () => {
  try {
    await userApi.register({
      username: 'new_username',
      password: 'new_password',
      realName: '真实姓名',
      phone: '13800138000',
      mail: 'user@example.com'
    })
    console.log('注册成功')
  } catch (error) {
    console.error('注册失败:', error.message)
  }
}
```

**请求参数：**
- `username`: string - 用户名
- `password`: string - 密码
- `realName`: string - 真实姓名
- `phone`: string - 手机号
- `mail`: string - 邮箱

### 3. 检查登录状态

```typescript
// 检查登录状态
const checkLoginStatus = async () => {
  try {
    const response = await userApi.checkLogin('username', 'token')
    const isLoggedIn = response.data.data
    console.log('登录状态:', isLoggedIn)
  } catch (error) {
    console.error('检查登录状态失败:', error.message)
  }
}
```

### 4. 用户退出登录

```typescript
// 退出登录
const handleLogout = async () => {
  try {
    await userApi.logout('username', 'token')
    localStorage.removeItem('token')
    console.log('退出成功')
  } catch (error) {
    console.error('退出失败:', error.message)
  }
}
```

## Agent聊天接口

### SSE流式聊天

```typescript
import { agentApi } from '@/api'

// SSE流式聊天
const chatWithAgent = (message: string) => {
  const eventSource = agentApi.chat({
    userName: 'current_user',
    agentId: 1,
    inputMessage: message
  })

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.content) {
        // 处理接收到的消息片段
        console.log('收到消息:', data.content)
      }
    } catch (error) {
      console.error('解析SSE数据失败:', error)
    }
  }

  eventSource.onerror = (error) => {
    console.error('SSE连接错误:', error)
    eventSource.close()
  }

  eventSource.addEventListener('close', () => {
    eventSource.close()
  })
}
```

**请求参数：**
- `userName`: string - 用户名
- `agentId`: number - Agent ID
- `inputMessage`: string - 用户输入的消息

## 讯飞API接口

### 1. 音频转文字

```typescript
import { xunfeiApi } from '@/api'

// 音频转文字
const convertAudioToText = async (audioFile: File) => {
  try {
    const response = await xunfeiApi.audioToText(audioFile)
    const result = response.data.data
    console.log('转换结果:', result.text)
  } catch (error) {
    console.error('音频转文字失败:', error.message)
  }
}
```

### 2. 实时音频转文字

```typescript
// 实时音频转文字
const realtimeAudioToText = async (audioFile: File) => {
  try {
    const response = await xunfeiApi.realtimeAudioToText(audioFile)
    const text = response.data.data
    console.log('实时转换结果:', text)
  } catch (error) {
    console.error('实时音频转文字失败:', error.message)
  }
}
```

### 3. 人脸对比

```typescript
// 人脸对比
const compareFaces = async (image1: File, image2: File) => {
  try {
    const response = await xunfeiApi.compareFaces(image1, image2)
    const result = response.data.data
    console.log('相似度:', result.similarity)
    console.log('是否匹配:', result.isMatch)
  } catch (error) {
    console.error('人脸对比失败:', error.message)
  }
}
```

### 4. 人脸属性检测

```typescript
// 检测所有人脸属性
const detectAllAttributes = async (image: File) => {
  try {
    const response = await xunfeiApi.detectAllAttributes(image)
    const attributes = response.data.data
    console.log('人脸属性:', attributes)
  } catch (error) {
    console.error('人脸属性检测失败:', error.message)
  }
}

// 检测单个人脸属性
const detectSingleAttribute = async (image: File, attribute: string) => {
  try {
    const response = await xunfeiApi.detectSingleAttribute(image, attribute)
    const result = response.data.data
    console.log(`${attribute}属性:`, result)
  } catch (error) {
    console.error('单个属性检测失败:', error.message)
  }
}
```

## 文件上传处理

### 从input元素获取文件

```typescript
// HTML
// <input type="file" @change="handleFileChange" accept="audio/*,image/*">

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // 根据文件类型调用不同的API
    if (file.type.startsWith('audio/')) {
      convertAudioToText(file)
    } else if (file.type.startsWith('image/')) {
      detectAllAttributes(file)
    }
  }
}
```

## 错误处理

所有API调用都应该使用try-catch进行错误处理：

```typescript
try {
  const response = await userApi.login(loginData)
  // 处理成功响应
} catch (error: any) {
  // 处理错误
  console.error('API调用失败:', error.message)
  
  // 根据错误类型进行不同处理
  if (error.response?.status === 401) {
    // 未授权，跳转到登录页
  } else if (error.response?.status === 500) {
    // 服务器错误
  }
}
```

## 类型定义

所有的接口参数和响应类型都定义在 `src/api/types.ts` 中，使用时可以导入：

```typescript
import {
  ApiResponse,
  User,
  UserLoginReq,
  UserLoginResp,
  UserRegisterReq
} from '@/types/user'
import {
  ChatMessage,
  ChatSession
} from '@/types/chat'
import type { ApiResponse } from '@/types/api'
```

## 注意事项

1. **文件上传**：音频和图片文件需要使用FormData格式上传
2. **SSE连接**：记得在组件卸载时关闭EventSource连接
3. **Token管理**：token会自动处理，无需手动添加到请求头
4. **错误处理**：建议统一处理API错误，提供用户友好的错误提示
5. **类型安全**：使用TypeScript类型定义确保参数正确性