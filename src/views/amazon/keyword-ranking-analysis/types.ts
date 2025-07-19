// 请求参数接口
export interface AnalysisRequest {
  startDate?: string // 开始日期 YYYY-MM-DD，默认7天前
  endDate?: string // 结束日期 YYYY-MM-DD，默认今天
  city?: string // 城市（从任务获取，可选择）
  rankType?: number // 排名类型（可选）
  taskId?: number // 任务ID（可选）
  keywords?: string[] // 关键词列表（可选）
  maxPosition?: number // 最大位置数，默认50
  aggregationType?: string // 聚合方式：latest/first/all，默认latest
  displayMode?: string // 显示模式：single/comparison，默认single
  comparisonType?: string // 对比类型：position/asin/coverage，默认position
}

// 任务信息接口
export interface TaskInfo {
  taskId: number
  taskName: string
  cities: string[] // 任务中的城市列表（去重后）
  keywords: string[] // 任务中的关键词列表
  rankType: number
  createTime: string
  updateTime: string
}

// 响应数据结构
export interface AnalysisResponse {
  summary: {
    dateRange: number[][] // 日期范围 [[year, month, day], ...]
    totalDays: number // 总天数
    totalPositions: number // 总位置数
    keywords: string[] // 关键词列表
    city: string // 城市
    rankType: number // 排名类型
  }
  matrix: {
    headers: string[] // 表头：["位置", "7月15日", "7月16日", ...]
    keywordMatrices: {
      [keyword: string]: {
        keyword: string
        rows: Array<{
          position: string // 位置编码 P1-01
          positionCode: string // 位置代码 1-1
          pageNumber: number // 页码
          positionInPage: number // 页内位置
          data: string[] // 每日ASIN数据
        }>
      }
    }
  }
  statistics: {
    asinFrequency: { [asin: string]: number } // ASIN频次
    positionStability: { [position: string]: number } // 位置稳定性
    keywordCoverage: {
      [keyword: string]: {
        keyword: string
        coveredPositions: number
        totalPositions: number
        coverageRate: number
      }
    }
  }
  comparison?: {
    positionCompetitions: Array<{
      position: string
      dates: string[]
      competitions: Array<{
        date: string
        sameAsins: string[]
        differentAsins: { [keyword: string]: string }
      }>
    }>
    asinCoverages: {
      [asin: string]: {
        asin: string
        keywords: string[]
        positions: string[]
        coverageRate: number
        averagePosition: number
        stabilityScore: number
      }
    }
  }
}

// 矩阵行数据
export interface MatrixRow {
  position: string
  positionCode: string
  pageNumber: number
  positionInPage: number
  data: string[]
}

// 关键词矩阵
export interface KeywordMatrix {
  keyword: string
  rows: MatrixRow[]
}

// ASIN颜色映射
export interface AsinColorMap {
  [asin: string]: string
}

// 统计数据类型
export interface StatisticsData {
  asinFrequency: { [asin: string]: number }
  positionStability: { [position: string]: number }
  keywordCoverage: {
    [keyword: string]: {
      keyword: string
      coveredPositions: number
      totalPositions: number
      coverageRate: number
    }
  }
}

// 对比分析数据
export interface ComparisonData {
  positionCompetitions: Array<{
    position: string
    dates: string[]
    competitions: Array<{
      date: string
      sameAsins: string[]
      differentAsins: { [keyword: string]: string }
    }>
  }>
  asinCoverages: {
    [asin: string]: {
      asin: string
      keywords: string[]
      positions: string[]
      coverageRate: number
      averagePosition: number
      stabilityScore: number
    }
  }
}
