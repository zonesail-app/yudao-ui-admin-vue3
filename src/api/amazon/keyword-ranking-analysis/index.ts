import request from '@/config/axios'
import type {
  AnalysisRequest,
  AnalysisResponse,
  TaskInfo
} from '@/views/amazon/keyword-ranking-analysis/types'

// 获取任务信息
export const getTaskInfo = (taskId: number) => {
  return request.get<TaskInfo>({
    url: `/amazon/keyword-ranking/task/${taskId}`
  })
}

// 获取关键词排名分析数据
export const getKeywordRankingAnalysis = (params: AnalysisRequest) => {
  return request.get<AnalysisResponse>({
    url: '/amazon/keyword-ranking/analysis',
    params
  })
}

// 导出分析数据为Excel
export const exportAnalysisData = (params: AnalysisRequest) => {
  return request.download({
    url: '/amazon/keyword-ranking/analysis/export',
    params
  })
}
