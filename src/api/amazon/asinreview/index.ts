import request from '@/config/axios'
import type { Dayjs } from 'dayjs';

/** Amazon ASIN商品评论数据信息 */
export interface AsinReview {
          id: number; // 主键ID
          userId?: number; // 用户ID
          asin?: string; // Amazon标准识别码
          parentAsin: string; // 父级ASIN（用于变体商品）
          taskId?: number; // 数据采集任务ID
          reviewNum?: number; // 评论总数
          score: number; // 平均评分（1-5分）
          ratings?: number; // 评级总数
          remark: string; // 备注
  }

/** Amazon ASIN评论统计分析请求 */
export interface AsinReviewAnalysisReq {
  taskId: number; // 任务ID
  startDate: string; // 开始日期 YYYY-MM-DD
  endDate: string; // 结束日期 YYYY-MM-DD
}

/** Amazon ASIN评论统计分析响应 */
export interface AsinReviewAnalysisResp {
  analysisData: Record<string, Record<string, number>>; // ASIN -> 日期 -> 评论数量
  asinList: string[]; // ASIN列表
  dateList: string[]; // 日期列表
  totalCount: number; // 总评论数
}

// Amazon ASIN商品评论数据 API
export const AsinReviewApi = {
  // 查询Amazon ASIN商品评论数据分页
  getAsinReviewPage: async (params: any) => {
    return await request.get({ url: `/amazon/asin-review/page`, params })
  },

  // 查询Amazon ASIN商品评论数据详情
  getAsinReview: async (id: number) => {
    return await request.get({ url: `/amazon/asin-review/get?id=` + id })
  },

  // 新增Amazon ASIN商品评论数据
  createAsinReview: async (data: AsinReview) => {
    return await request.post({ url: `/amazon/asin-review/create`, data })
  },

  // 修改Amazon ASIN商品评论数据
  updateAsinReview: async (data: AsinReview) => {
    return await request.put({ url: `/amazon/asin-review/update`, data })
  },

  // 删除Amazon ASIN商品评论数据
  deleteAsinReview: async (id: number) => {
    return await request.delete({ url: `/amazon/asin-review/delete?id=` + id })
  },

  /** 批量删除Amazon ASIN商品评论数据 */
  deleteAsinReviewList: async (ids: number[]) => {
    return await request.delete({ url: `/amazon/asin-review/delete-list?ids=${ids.join(',')}` })
  },

  // 导出Amazon ASIN商品评论数据 Excel
  exportAsinReview: async (params) => {
    return await request.download({ url: `/amazon/asin-review/export-excel`, params })
  },

  // 获取Amazon ASIN评论统计分析数据
  getReviewAnalysisData: async (data: AsinReviewAnalysisReq): Promise<AsinReviewAnalysisResp> => {
    return await request.post({ url: `/amazon/asin-review/analysis`, data })
  }
}