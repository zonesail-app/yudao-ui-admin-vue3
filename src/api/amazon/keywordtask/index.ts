import request from '@/config/axios'
import type { Dayjs } from 'dayjs'

/** 关键词排名任务信息 */
export interface KeywordTask {
  id: number // ID
  taskName?: string // 任务名称
  keywords?: object // 关键词列表
  cities?: object // 城市列表
  asins: object // ASIN列表
  cronTab: string // Cron表达式
  enabled?: number // 启用状态
  taskType?: number // 任务类型
  shared?: number // 任务共享状态
  description: string // 任务描述
  startTime?: string // 开始时间
  endTime?: string // 结束时间
}

// 关键词排名任务 API
export const KeywordTaskApi = {
  // 查询关键词排名任务分页
  getKeywordTaskPage: async (params: any) => {
    return await request.get({ url: `/amazon/keyword-task/page`, params })
  },

  // 查询关键词排名任务详情
  getKeywordTask: async (id: number) => {
    return await request.get({ url: `/amazon/keyword-task/get?id=` + id })
  },

  // 新增关键词排名任务
  createKeywordTask: async (data: KeywordTask) => {
    return await request.post({ url: `/amazon/keyword-task/create`, data })
  },

  // 修改关键词排名任务
  updateKeywordTask: async (data: KeywordTask) => {
    return await request.put({ url: `/amazon/keyword-task/update`, data })
  },

  // 删除关键词排名任务
  deleteKeywordTask: async (id: number) => {
    return await request.delete({ url: `/amazon/keyword-task/delete?id=` + id })
  },

  /** 批量删除关键词排名任务 */
  deleteKeywordTaskList: async (ids: number[]) => {
    return await request.delete({ url: `/amazon/keyword-task/delete-list?ids=${ids.join(',')}` })
  },

  // 导出关键词排名任务 Excel
  exportKeywordTask: async (params) => {
    return await request.download({ url: `/amazon/keyword-task/export-excel`, params })
  },

  updateKeywordTaskStatus: async (id: number, enabled: number) => {
    const data = {
      id,
      enabled
    }
    return await request.put({ url: '/amazon/keyword-task/update-status', data: data })
  }
}
