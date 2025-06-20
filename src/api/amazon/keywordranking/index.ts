import request from '@/config/axios'
import type { Dayjs } from 'dayjs';

/** 关键词排名任务结果信息 */
export interface KeywordRanking {
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
          isSponsored: boolean; // 是否为付费广告位
          crawlTime?: string | Dayjs; // 采集时间
          crawlDate?: string | Dayjs; // 爬取日期
          remark: string; // 备注信息
  }

// 关键词排名任务结果 API
export const KeywordRankingApi = {
  // 查询关键词排名任务结果分页
  getKeywordRankingPage: async (params: any) => {
    return await request.get({ url: `/amazon/keyword-ranking/page`, params })
  },

  // 查询关键词排名任务结果详情
  getKeywordRanking: async (id: number) => {
    return await request.get({ url: `/amazon/keyword-ranking/get?id=` + id })
  },

  // 新增关键词排名任务结果
  createKeywordRanking: async (data: KeywordRanking) => {
    return await request.post({ url: `/amazon/keyword-ranking/create`, data })
  },

  // 修改关键词排名任务结果
  updateKeywordRanking: async (data: KeywordRanking) => {
    return await request.put({ url: `/amazon/keyword-ranking/update`, data })
  },

  // 删除关键词排名任务结果
  deleteKeywordRanking: async (id: number) => {
    return await request.delete({ url: `/amazon/keyword-ranking/delete?id=` + id })
  },

  /** 批量删除关键词排名任务结果 */
  deleteKeywordRankingList: async (ids: number[]) => {
    return await request.delete({ url: `/amazon/keyword-ranking/delete-list?ids=${ids.join(',')}` })
  },

  // 导出关键词排名任务结果 Excel
  exportKeywordRanking: async (params) => {
    return await request.download({ url: `/amazon/keyword-ranking/export-excel`, params })
  }
}