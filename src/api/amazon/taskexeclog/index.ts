import request from '@/config/axios'
import type { Dayjs } from 'dayjs';

/** Amazon任务执行日志信息 */
export interface TaskExecLog {
          id: number; // 主键ID
          taskId?: number; // 任务ID
          status?: string; // 执行状态
          startTime?: string | Dayjs; // 开始时间
          endTime: string | Dayjs; // 结束时间
          durationSeconds: number; // 执行时长(秒)
          errorMessage: string; // 错误信息
          recordsSaved?: number; // 保存记录数
          userId?: number; // 用户ID
          zipcodeNum: number; // 邮编数量
          keywordNum: number; // 关键词数量
          pageNum: number; // 爬取页面数量
  }

// Amazon任务执行日志 API
export const TaskExecLogApi = {
  // 查询Amazon任务执行日志分页
  getTaskExecLogPage: async (params: any) => {
    return await request.get({ url: `/amazon/task-exec-log/page`, params })
  },

  // 查询Amazon任务执行日志详情
  getTaskExecLog: async (id: number) => {
    return await request.get({ url: `/amazon/task-exec-log/get?id=` + id })
  },

  // 新增Amazon任务执行日志
  createTaskExecLog: async (data: TaskExecLog) => {
    return await request.post({ url: `/amazon/task-exec-log/create`, data })
  },

  // 修改Amazon任务执行日志
  updateTaskExecLog: async (data: TaskExecLog) => {
    return await request.put({ url: `/amazon/task-exec-log/update`, data })
  },

  // 删除Amazon任务执行日志
  deleteTaskExecLog: async (id: number) => {
    return await request.delete({ url: `/amazon/task-exec-log/delete?id=` + id })
  },

  /** 批量删除Amazon任务执行日志 */
  deleteTaskExecLogList: async (ids: number[]) => {
    return await request.delete({ url: `/amazon/task-exec-log/delete-list?ids=${ids.join(',')}` })
  },

  // 导出Amazon任务执行日志 Excel
  exportTaskExecLog: async (params) => {
    return await request.download({ url: `/amazon/task-exec-log/export-excel`, params })
  }
}