<template>
  <ContentWrap>
    <!-- 标题栏 -->
    <div class="mb-4">
      <el-page-header :icon="ArrowLeft" @back="goBack">
        <template #content>
          <span class="text-large font-600 mr-3">评论数据分析</span>
        </template>
      </el-page-header>
    </div>

    <!-- 时间范围选择 -->
    <el-form :model="queryParams" :inline="true" class="mb-4">
      <el-form-item label="统计时间">
        <el-date-picker
          v-model="queryParams.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="loadAnalysisData"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadAnalysisData">
          <Icon icon="ep:refresh" class="mr-5px" />
          刷新数据
        </el-button>
        <el-button type="success" @click="exportToExcel">
          <Icon icon="ep:download" class="mr-5px" />
          导出Excel
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 数据统计表格 -->
    <el-card v-loading="loading">
      <div class="analysis-table-container">
        <table class="analysis-table">
          <thead>
            <tr>
              <th class="sticky-column">ASIN</th>
              <th v-for="date in dateColumns" :key="date" class="date-column">
                {{ formatDate(date) }}
              </th>
              <th class="total-column">总计</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asin in asinRows" :key="asin" class="data-row">
              <td class="sticky-column asin-cell">{{ asin }}</td>
              <td v-for="date in dateColumns" :key="`${asin}-${date}`" class="data-cell">
                {{ getReviewCount(asin, date) }}
              </td>
              <td class="total-cell">{{ getAsinTotal(asin) }}</td>
            </tr>
            <tr v-if="asinRows.length > 0" class="total-row">
              <td class="sticky-column">总计</td>
              <td v-for="date in dateColumns" :key="`total-${date}`" class="total-cell">
                {{ getDateTotal(date) }}
              </td>
              <td class="grand-total">{{ grandTotal }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 空数据提示 -->
      <el-empty v-if="!loading && asinRows.length === 0" description="暂无数据" />
    </el-card>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { dateFormatter } from '@/utils/formatTime'
import * as XLSX from 'xlsx'
import { AsinReviewApi, type AsinReviewAnalysisReq } from '@/api/amazon/asinreview'

defineOptions({ name: 'ReviewAnalysis' })

const router = useRouter()
const route = useRoute()
const message = useMessage()

const loading = ref(true)
const taskId = ref<number>()

// 查询参数
const queryParams = reactive({
  dateRange: [] as string[],
  taskId: undefined as number | undefined
})

// 分析数据
const analysisData = ref<Record<string, Record<string, number>>>({})
const asinRows = ref<string[]>([])
const dateColumns = ref<string[]>([])

// 计算属性
const grandTotal = computed(() => {
  return asinRows.value.reduce((total, asin) => total + getAsinTotal(asin), 0)
})

/** 返回上一页 */
const goBack = () => {
  router.back()
}

/** 格式化日期显示 */
const formatDate = (date: string) => {
  return date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$2-$3')
}

/** 获取指定ASIN和日期的评论数量 */
const getReviewCount = (asin: string, date: string): number => {
  return analysisData.value[asin]?.[date] || 0
}

/** 获取指定ASIN的总评论数 */
const getAsinTotal = (asin: string): number => {
  const asinData = analysisData.value[asin] || {}
  return Object.values(asinData).reduce((sum, count) => sum + count, 0)
}

/** 获取指定日期的总评论数 */
const getDateTotal = (date: string): number => {
  return asinRows.value.reduce((total, asin) => total + getReviewCount(asin, date), 0)
}

/** 生成日期范围数组 */
const generateDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  while (start <= end) {
    dates.push(start.toISOString().split('T')[0])
    start.setDate(start.getDate() + 1)
  }
  
  return dates
}

/** 加载分析数据 */
const loadAnalysisData = async () => {
  if (!taskId.value || queryParams.dateRange.length !== 2) {
    message.warning('请选择有效的时间范围')
    return
  }
  
  loading.value = true
  try {
    const reqData: AsinReviewAnalysisReq = {
      taskId: taskId.value,
      startDate: queryParams.dateRange[0],
      endDate: queryParams.dateRange[1]
    }
    
    const result = await AsinReviewApi.getReviewAnalysisData(reqData)
    
    analysisData.value = result.analysisData
    asinRows.value = result.asinList
    dateColumns.value = result.dateList
    
  } catch (error) {
    message.error('加载数据失败')
    console.error('Load analysis data error:', error)
    // 重置数据
    analysisData.value = {}
    asinRows.value = []
    dateColumns.value = []
  } finally {
    loading.value = false
  }
}

/** 导出Excel */
const exportToExcel = () => {
  if (asinRows.value.length === 0) {
    message.warning('暂无数据可导出')
    return
  }

  // 构建Excel数据
  const excelData: any[][] = []
  
  // 表头
  const headers = ['ASIN', ...dateColumns.value.map(date => formatDate(date)), '总计']
  excelData.push(headers)
  
  // 数据行
  asinRows.value.forEach(asin => {
    const row = [
      asin,
      ...dateColumns.value.map(date => getReviewCount(asin, date)),
      getAsinTotal(asin)
    ]
    excelData.push(row)
  })
  
  // 总计行
  const totalRow = [
    '总计',
    ...dateColumns.value.map(date => getDateTotal(date)),
    grandTotal.value
  ]
  excelData.push(totalRow)
  
  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet(excelData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '评论数据分析')
  
  // 导出文件
  const fileName = `评论数据分析_${new Date().getTime()}.xlsx`
  XLSX.writeFile(wb, fileName)
  
  message.success('导出成功')
}

/** 初始化 */
onMounted(() => {
  taskId.value = Number(route.query.taskId)
  queryParams.taskId = taskId.value
  
  // 设置默认时间范围（最近7天）
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000)
  
  queryParams.dateRange = [
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  ]
  
  loadAnalysisData()
})
</script>

<style scoped>
.analysis-table-container {
  overflow: auto;
  max-height: 70vh;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.analysis-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.analysis-table th,
.analysis-table td {
  padding: 12px 8px;
  text-align: center;
  border-bottom: 1px solid #e4e7ed;
  border-right: 1px solid #e4e7ed;
}

.analysis-table th {
  background-color: #f5f7fa;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

.sticky-column {
  position: sticky;
  left: 0;
  background-color: #fff;
  z-index: 5;
  font-weight: 500;
  min-width: 120px;
}

.analysis-table th.sticky-column {
  background-color: #f5f7fa;
  z-index: 15;
}

.date-column {
  min-width: 80px;
}

.total-column {
  min-width: 80px;
  background-color: #f0f9ff;
}

.asin-cell {
  font-family: monospace;
  color: #409eff;
}

.data-cell {
  transition: background-color 0.2s;
}

.data-cell:hover {
  background-color: #f0f9ff;
}

.total-cell {
  background-color: #f0f9ff;
  font-weight: 600;
}

.total-row {
  background-color: #f9f9f9;
  font-weight: 600;
}

.grand-total {
  background-color: #e6f7ff;
  font-weight: 700;
  color: #1890ff;
}

.data-row:hover {
  background-color: #fafafa;
}
</style>