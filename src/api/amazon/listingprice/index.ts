import request from '@/config/axios'
import type { Dayjs } from 'dayjs';

/** 价格监控结果信息 */
export interface ListingPrice {
          id: number; // 主键
          userId?: number; // 用户ID
          taskExecLogId?: number; // 任务执行ID
          asin?: string; // 产品ASIN
          marketplace?: string; // 市场代码
          buyboxPrice: number; // BuyBox价格
          price: number; // 商品价格
          primePrice: number; // Prime价格
          couponPrice: number; // 优惠券价格
          couponDiscount: string; // 优惠券折扣
          dealPrice: number; // 促销价格
          dealInfo: string; // 促销信息
          fbaPrice: number; // FBA价格
          fbmPrice: number; // FBM价格
          listPrice: number; // 标价
          scrapedAt?: string | Dayjs; // 抓取时间
          remark: string; // 备注
  }

// 价格监控结果 API
export const ListingPriceApi = {
  // 查询价格监控结果分页
  getListingPricePage: async (params: any) => {
    return await request.get({ url: `/amazon/listing-price/page`, params })
  },

  // 查询价格监控结果详情
  getListingPrice: async (id: number) => {
    return await request.get({ url: `/amazon/listing-price/get?id=` + id })
  },

  // 新增价格监控结果
  createListingPrice: async (data: ListingPrice) => {
    return await request.post({ url: `/amazon/listing-price/create`, data })
  },

  // 修改价格监控结果
  updateListingPrice: async (data: ListingPrice) => {
    return await request.put({ url: `/amazon/listing-price/update`, data })
  },

  // 删除价格监控结果
  deleteListingPrice: async (id: number) => {
    return await request.delete({ url: `/amazon/listing-price/delete?id=` + id })
  },

  /** 批量删除价格监控结果 */
  deleteListingPriceList: async (ids: number[]) => {
    return await request.delete({ url: `/amazon/listing-price/delete-list?ids=${ids.join(',')}` })
  },

  // 导出价格监控结果 Excel
  exportListingPrice: async (params) => {
    return await request.download({ url: `/amazon/listing-price/export-excel`, params })
  }
}