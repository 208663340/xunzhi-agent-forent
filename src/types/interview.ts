// 面试相关类型定义

// 面试题获取请求
export interface InterviewQuestionsReq {
  sessionId: string
  agentId: number
  resumePdf: File
}

// 面试题响应
export interface InterviewQuestionsResp {
  [questionNumber: string]: string
}

// 回答面试题请求
export interface InterviewAnswerReq {
  questionNumber: string
  answerContent?: string
  sessionId?: string
  agentId?: number
  audioFile?: File
}

// 回答面试题响应
export interface InterviewAnswerResp {
  questionNumber: string
  questionContent: string
  score: number
  totalScore: number
  isSuccess: boolean
  errorMessage: string
  feedback: string
}

// 面试建议响应
export interface InterviewSuggestionsResp {
  [key: string]: string
}

// 雷达图数据响应
export interface RadarChartResp {
  resumeScore: number
  interviewPerformance: number
  demeanorEvaluation: number
  potentialIndex: number
  professionalSkills: number
}

// 神态评分请求
export interface DemeanorEvaluationReq {
  agentId: number
  sessionId: string
  userPhoto: File
}

// Agent会话创建请求
export interface AgentSessionCreateReq {
  userName: string
  agentId: number
  firstMessage: string
}

// Agent会话创建响应
export interface AgentSessionCreateResp {
  sessionId: string
  conversationTitle: string
}