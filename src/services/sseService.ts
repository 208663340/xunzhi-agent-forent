// SSE服务类
import type {
  SSEChoice,
  SSEWorkflowStep,
  SSEData,
  StreamMessage,
  SSEConfig,
  SSEEventCallback,
} from '@/types/sse'

// 重新导出类型供外部使用
export type { SSEChoice, SSEWorkflowStep, SSEData, StreamMessage, SSEConfig, SSEEventCallback }

export class SSEService {
  private eventSource: EventSource | null = null
  private config: SSEConfig
  private callbacks: SSEEventCallback
  private accumulatedContent = ''
  private retryCount = 0
  private isConnected = false
  private currentMessageId = ''
  private abortController: AbortController | null = null

  constructor(config: SSEConfig, callbacks: SSEEventCallback = {}) {
    this.config = {
      retryInterval: 3000,
      maxRetries: 3,
      withCredentials: false,
      ...config,
    }
    this.callbacks = callbacks
  }

  // 开始SSE连接
  connect(): void {
    if (this.eventSource) {
      this.disconnect()
    }

    try {
      // 对于POST请求，需要使用fetch API来建立SSE连接
      if (this.config.method === 'POST') {
        this.connectWithPost()
      } else {
        // 默认GET请求使用EventSource
        this.reset()
        this.createConnection()
      }
    } catch (error) {
      console.error('Failed to create EventSource:', error)
      this.callbacks.onError?.(error as Error)
    }
  }

  private async connectWithPost(): Promise<void> {
    try {
      // 重置状态
      this.reset()
      
      // 创建AbortController用于取消请求
      this.abortController = new AbortController()
      
      console.log('开始建立POST SSE连接...')

      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...this.config.headers,
        },
        body: JSON.stringify(this.config.body),
        credentials: this.config.withCredentials ? 'include' : 'same-origin',
        signal: this.abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      this.isConnected = true
      console.log('POST SSE连接建立成功')
      this.callbacks.onOpen?.()
      await this.readStream(response.body)
    } catch (error) {
      // 检查是否是主动断开连接导致的AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('SSE连接被主动中断')
        // 如果是主动断开，不需要触发错误回调
        return
      }
      
      console.error('Failed to connect with POST:', error)
      this.isConnected = false
      this.callbacks.onError?.(error as Error)
    }
  }

  private async readStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      console.log('开始读取SSE流数据...')
      while (true) {
        // 检查连接状态，如果已断开则停止读取
        if (!this.isConnected) {
          console.log('连接已断开，停止读取流')
          break
        }
        
        const { done, value } = await reader.read()

        if (done) {
          console.log('SSE流读取完成')
          this.callbacks.onClose?.()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留最后一个不完整的行

        for (const line of lines) {
          this.processSSELine(line)
        }
      }
    } catch (error) {
      // 检查是否是主动断开连接导致的错误
      if (error instanceof Error && (error.name === 'AbortError' || !this.isConnected)) {
        console.log('SSE流读取被中断')
        return
      }
      
      console.error('Error reading stream:', error)
      this.callbacks.onError?.(error as Error)
    } finally {
      try {
        reader.releaseLock()
        console.log('SSE流读取器已释放')
      } catch (error) {
        console.warn('释放流读取器时出错:', error)
      }
    }
  }

  private currentEventType: string | null = null

  private processSSELine(line: string): void {
    // 跳过空行
    if (!line.trim()) {
      return
    }

    // 处理事件类型行
    if (line.startsWith('event:')) {
      const eventType = line.slice(6).trim()
      if (eventType === 'end') {
        this.callbacks.onClose?.()
      } else if (eventType === 'sessionId') {
        // 设置当前事件类型，等待下一行的data
        this.currentEventType = 'sessionId'
      }
      return
    }

    // 处理数据行
    if (line.startsWith('data:')) {
      let data = line.slice(5).trim() // 移除 'data:' 前缀

      // 处理重复的data:前缀
      while (data.startsWith('data:')) {
        data = data.slice(5).trim()
      }

      // 跳过空数据
      if (!data) {
        return
      }

      // 处理sessionId事件的数据
      if (this.currentEventType === 'sessionId') {
        this.callbacks.onSessionId?.(data)
        this.currentEventType = null // 重置事件类型
        return
      }

      if (data === '[DONE]') {
        // 流结束标记
        this.callbacks.onClose?.()
        return
      }

      try {
        const sseData: SSEData = JSON.parse(data)
        this.handleSSEData(sseData)
      } catch (error) {
        console.error('Failed to parse SSE data:', error, 'Raw data:', data)
      }
    }
  }

  // 创建SSE连接
  private createConnection(): void {
    try {
      // 构建URL，如果有headers需要通过查询参数传递
      const url = this.config.url

      // 创建EventSource
      this.eventSource = new EventSource(url, {
        withCredentials: this.config.withCredentials,
      })

      this.setupEventListeners()
    } catch (error) {
      console.error('创建SSE连接失败:', error)
      this.handleError(new Error('无法创建SSE连接'))
    }
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    if (!this.eventSource) return

    // 连接打开
    this.eventSource.onopen = () => {
      console.log('SSE连接已建立')
      this.isConnected = true
      this.retryCount = 0
      this.callbacks.onOpen?.()
    }

    // 接收消息
    this.eventSource.onmessage = (event) => {
      try {
        const sseData: SSEData = JSON.parse(event.data)
        this.handleSSEData(sseData)
      } catch (error) {
        console.error('处理SSE消息失败:', error)
        this.handleError(error as Error)
      }
    }

    // 连接错误
    this.eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error)
      this.isConnected = false

      if (this.retryCount < (this.config.maxRetries || 3)) {
        this.scheduleRetry()
      } else {
        this.handleError(new Error('SSE连接失败，已达到最大重试次数'))
      }
    }
  }

  // 处理SSE数据
  private handleSSEData(sseData: SSEData): void {
    console.log('收到SSE数据:', sseData)

    // 检查响应状态
    if (sseData.code !== 0) {
      this.handleError(new Error(sseData.message || '服务器返回错误'))
      return
    }

    // 处理选择数据
    if (sseData.choices && sseData.choices.length > 0) {
      const choice = sseData.choices[0]

      // 更新消息ID
      if (sseData.id && sseData.id !== this.currentMessageId) {
        this.currentMessageId = sseData.id
      }

      // 累积内容
      if (choice.delta && choice.delta.content) {
        this.accumulatedContent += choice.delta.content

        // 创建流式消息对象
        const streamMessage: StreamMessage = {
          content: this.accumulatedContent,
          id: this.currentMessageId || '',
          progress: sseData.workflow_step ? sseData.workflow_step.progress : null,
          step: sseData.workflow_step ? sseData.workflow_step.seq : null,
          timestamp: new Date(sseData.created * 1000),
          isComplete: !!choice.finish_reason,
        }

        // 触发消息回调
        this.callbacks.onMessage?.(streamMessage)

        // 检查是否完成
        if (choice.finish_reason) {
          this.handleComplete()
        }
      }
    }
  }

  // 处理流式完成
  private handleComplete(): void {
    console.log('SSE流式传输完成')

    // 触发完成回调
    this.callbacks.onComplete?.(this.accumulatedContent)

    // 断开连接
    this.disconnect()
  }

  // 处理错误
  private handleError(error: Error): void {
    console.error('SSE服务错误:', error)
    this.callbacks.onError?.(error)
  }

  // 安排重试
  private scheduleRetry(): void {
    this.retryCount++
    console.log(`SSE连接重试 ${this.retryCount}/${this.config.maxRetries}`)

    setTimeout(() => {
      if (!this.isConnected) {
        this.createConnection()
      }
    }, this.config.retryInterval)
  }

  // 断开连接
  disconnect(): void {
    console.log('正在断开SSE连接...')
    
    // 设置断开状态，防止重复操作
    if (!this.isConnected && !this.eventSource && !this.abortController) {
      console.log('SSE连接已经断开')
      return
    }
    
    this.isConnected = false
    
    // 关闭EventSource连接
    if (this.eventSource) {
      try {
        this.eventSource.close()
        console.log('EventSource已关闭')
      } catch (error) {
        console.warn('关闭EventSource时出错:', error)
      }
      this.eventSource = null
    }
    
    // 对于POST请求，需要中断fetch请求
    if (this.abortController) {
      try {
        // 检查AbortController是否已经被中断
        if (!this.abortController.signal.aborted) {
          this.abortController.abort()
          console.log('Fetch请求已中断')
        }
      } catch (error) {
        console.warn('中断fetch请求时出错:', error)
      }
      this.abortController = null
    }
    
    this.retryCount = 0
    
    // 延迟调用onClose回调，避免在中断过程中触发错误
    setTimeout(() => {
      this.callbacks.onClose?.()
    }, 0)
  }

  // 重置状态
  private reset(): void {
    this.accumulatedContent = ''
    this.retryCount = 0
    this.currentMessageId = ''
  }

  // 获取连接状态
  getConnectionState(): {
    isConnected: boolean
    retryCount: number
    currentMessageId: string
    accumulatedContent: string
  } {
    return {
      isConnected: this.isConnected,
      retryCount: this.retryCount,
      currentMessageId: this.currentMessageId,
      accumulatedContent: this.accumulatedContent,
    }
  }

  // 更新配置
  updateConfig(newConfig: Partial<SSEConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // 更新回调
  updateCallbacks(newCallbacks: Partial<SSEEventCallback>): void {
    this.callbacks = { ...this.callbacks, ...newCallbacks }
  }
}

// 创建SSE服务实例的工厂函数
export function createSSEService(config: SSEConfig, callbacks?: SSEEventCallback): SSEService {
  return new SSEService(config, callbacks)
}

// 默认配置
export const defaultSSEConfig: Partial<SSEConfig> = {
  retryInterval: 3000,
  maxRetries: 3,
  withCredentials: false,
}
