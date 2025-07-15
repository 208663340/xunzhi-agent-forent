// 用户评分相关类型定义

// 评分维度
export interface ScoreDimension {
  name: string
  value: number
  description?: string
}

// 用户评分结果
export interface UserScoreAnalysis {
  userName: string
  scores: ScoreDimension[]
  overallScore: number
  feedback: string
  timestamp: Date
}

// 雷达图数据响应
export interface RadarDataResp {
  resumeScore: number
  interviewPerformance: number
  demeanorEvaluation: number
  potentialIndex: number
  professionalSkills: number
}

// 简历分析请求
export interface ResumeAnalysisReq {
  resumeId: string
  candidateId: string
  content: string
}

// 简历分析响应
export interface ResumeAnalysisResp {
  analysis: UserScoreAnalysis
}

// 雷达图数据转换为分析结果
export function convertRadarToAnalysis(radar: RadarDataResp): UserScoreAnalysis {
  return {
    userName: '',
    scores: [
      { name: '简历得分', value: radar.resumeScore },
      { name: '面试表现', value: radar.interviewPerformance },
      { name: '神态管理', value: radar.demeanorEvaluation },
      { name: '用户潜力', value: radar.potentialIndex },
      { name: '专业技能', value: radar.professionalSkills }
    ],
    overallScore: (radar.resumeScore + radar.interviewPerformance + radar.demeanorEvaluation + radar.potentialIndex + radar.professionalSkills) / 5,
    feedback: '',
    timestamp: new Date()
  }
}

// 分析响应
export interface AnalysisResp {
  analysis: UserScoreAnalysis
}