import request from '@/config/axios'
import type { Dayjs } from 'dayjs';

/** 关键词排名任务结果信息 */
export interface KeywordAsinRanking {
          id: number; // ID
          taskId?: number; // 任务ID
          keyword?: string; // 关键词
          keywordHash?: string; // 关键词的哈希值
          asin?: string; // ASIN
          city?: string; // 搜索城市/地区
          rankType?: number; // 排名类型
          rankPosition?: number; // 整体排名位置
          pageNumber?: number; // 搜索结果页码
          positionInPage?: number; // 页内位置
          adsType: number; // 广告类型
          crawlTime?: string | Dayjs; // 采集时间
          crawlDate?: string | Dayjs; // 爬取日期
          remark: string; // 备注信息
          userId?: number; // 用户ID
  }

// 关键词排名任务结果 API
export const KeywordAsinRankingApi = {
  // 查询关键词排名任务结果分页
  getKeywordAsinRankingPage: async (params: any) => {
    return await request.get({ url: `/amazon/keyword-asin-ranking/page`, params })
  },

  // 查询关键词排名任务结果详情
  getKeywordAsinRanking: async (id: number) => {
    return await request.get({ url: `/amazon/keyword-asin-ranking/get?id=` + id })
  },

  // 新增关键词排名任务结果
  createKeywordAsinRanking: async (data: KeywordAsinRanking) => {
    return await request.post({ url: `/amazon/keyword-asin-ranking/create`, data })
  },

  // 修改关键词排名任务结果
  updateKeywordAsinRanking: async (data: KeywordAsinRanking) => {
    return await request.put({ url: `/amazon/keyword-asin-ranking/update`, data })
  },

  // 删除关键词排名任务结果
  deleteKeywordAsinRanking: async (id: number) => {
    return await request.delete({ url: `/amazon/keyword-asin-ranking/delete?id=` + id })
  },

  /** 批量删除关键词排名任务结果 */
  deleteKeywordAsinRankingList: async (ids: number[]) => {
    return await request.delete({ url: `/amazon/keyword-asin-ranking/delete-list?ids=${ids.join(',')}` })
  },

  // 导出关键词排名任务结果 Excel
  exportKeywordAsinRanking: async (params) => {
    return await request.download({ url: `/amazon/keyword-asin-ranking/export-excel`, params })
  }
}