import request from '@/config/axios'

// 关键词统计 API（预留接口）
export const WordCounterApi = {
  // 如果将来需要保存关键词统计数据，可以添加以下接口：

  // 保存关键词统计记录
  saveWordCountRecord: async (data: any) => {
    return await request.post({ url: `/amazon/word-counter/save`, data })
  },

  // 获取关键词统计历史记录
  getWordCountHistory: async (params: any) => {
    return await request.get({ url: `/amazon/word-counter/history`, params })
  },

  // 删除关键词统计记录
  deleteWordCountRecord: async (id: number) => {
    return await request.delete({ url: `/amazon/word-counter/delete?id=` + id })
  },

  // 导出关键词统计 Excel
  exportWordCountExcel: async (data: WordCountExportData) => {
    console.log(JSON.stringify(data))
    return await request.download({
      url: `/amazon/word-counter/export-excel`,
      method: 'POST',
      data
    })
  }
}

// 类型定义
export interface WordCountRecord {
  id?: number
  title: string
  descriptions: string[] // 五个独立的描述字段
  keywords: string[]
  createTime?: Date
}

// 导出Excel数据结构
export interface WordCountExportData {
  keywordStats: KeywordStatItem[]
}

export interface KeywordStatItem {
  keyword: string
  totalCount: number
  inTitle: boolean
  inDescription1: boolean
  inDescription2: boolean
  inDescription3: boolean
  inDescription4: boolean
  inDescription5: boolean
}
