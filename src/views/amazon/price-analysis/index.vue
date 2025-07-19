<template>
  <ContentWrap>
    <!-- 页面头部 -->
    <div class="mb-4">
      <el-page-header :icon="ArrowLeft" @back="goBack">
        <template #content>
          <span class="text-large font-600 mr-3">价格分析</span>
        </template>
      </el-page-header>
    </div>

    <!-- 筛选条件表单 -->
    <el-form :model="queryParams" :inline="true" class="mb-4">
      <el-form-item label="日期范围">
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
      <el-form-item label="价格类型">
        <el-select
          v-model="queryParams.priceType"
          placeholder="选择价格类型"
          @change="loadAnalysisData"
        >
          <el-option label="BuyBox价格" value="buyboxPrice" />
          <el-option label="售价" value="price" />
          <el-option label="Prime价格" value="primePrice" />
          <el-option label="定价" value="listPrice" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadAnalysisData">
          <Icon icon="ep:refresh" class="mr-5px" />
          刷新分析
        </el-button>
        <el-button type="success" @click="exportToExcel">
          <Icon icon="ep:download" class="mr-5px" />
          导出Excel
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 分析结果表格 -->
    <el-card v-loading="loading">
      <div class="analysis-table-container">
        <table class="analysis-table">
          <thead>
            <tr>
              <th class="sticky-column">ASIN</th>
              <th v-for="date in dateColumns" :key="date" class="date-column">
                {{ formatDate(date) }}
              </th>
              <th class="total-column">平均价格</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asin in asinRows" :key="asin" class="data-row">
              <td class="sticky-column asin-cell">{{ asin }}</td>
              <td v-for="date in dateColumns" :key="`${asin}-${date}`" class="data-cell">
                {{ formatPrice(getPrice(asin, date)) }}
              </td>
              <td class="total-cell">{{ formatPrice(getAsinAveragePrice(asin)) }}</td>
            </tr>
            <tr v-if="asinRows.length > 0" class="total-row">
              <td class="sticky-column">平均价格</td>
              <td v-for="date in dateColumns" :key="`total-${date}`" class="total-cell">
                {{ formatPrice(getDateAveragePrice(date)) }}
              </td>
              <td class="grand-total">{{ formatPrice(overallAveragePrice) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 空状态提示 -->
      <el-empty v-if="!loading && asinRows.length === 0" description="暂无数据" />
    </el-card>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { dateFormatter } from '@/utils/formatTime'
import * as XLSX from 'xlsx'
import { ListingPriceApi, type PriceAnalysisReq } from '@/api/amazon/listingprice'

defineOptions({ name: 'PriceAnalysis' })

const router = useRouter()
const route = useRoute()
const message = useMessage()

const loading = ref(true)
const taskId = ref<number>()

// 查询参数
const queryParams = reactive({
  dateRange: [] as string[],
  taskId: undefined as number | undefined,
  priceType: 'buyboxPrice' as 'buyboxPrice' | 'price' | 'primePrice' | 'listPrice'
})

// 分析数据
const analysisData = ref<Record<string, Record<string, number>>>({})
const asinRows = ref<string[]>([])
const dateColumns = ref<string[]>([])
const overallAveragePrice = ref<number>(0)

/** 返回上一页 */
const goBack = () => {
  router.back()
}

/** 格式化日期显示 */
const formatDate = (date: string) => {
  return date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$2-$3')
}

/** 格式化价格显示 */
const formatPrice = (price: number): string => {
  if (price === 0 || isNaN(price)) return '-'
  return `$${price.toFixed(2)}`
}

/** 获取指定ASIN和日期的价格 */
const getPrice = (asin: string, date: string): number => {
  return analysisData.value[asin]?.[date] || 0
}

/** 获取指定ASIN的平均价格 */
const getAsinAveragePrice = (asin: string): number => {
  const asinData = analysisData.value[asin] || {}
  const prices = Object.values(asinData).filter((price) => price > 0)
  if (prices.length === 0) return 0
  return prices.reduce((sum, price) => sum + price, 0) / prices.length
}

/** 获取指定日期的平均价格 */
const getDateAveragePrice = (date: string): number => {
  const prices = asinRows.value.map((asin) => getPrice(asin, date)).filter((price) => price > 0)
  if (prices.length === 0) return 0
  return prices.reduce((sum, price) => sum + price, 0) / prices.length
}

/** 生成日期范围 */
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
    message.warning('请选择正确的任务和日期范围')
    return
  }

  loading.value = true
  try {
    const reqData: PriceAnalysisReq = {
      taskId: taskId.value,
      startDate: queryParams.dateRange[0],
      endDate: queryParams.dateRange[1],
      priceType: queryParams.priceType
    }

    const result = await ListingPriceApi.getPriceAnalysisData(reqData)

    analysisData.value = result.analysisData
    asinRows.value = result.asinList
    dateColumns.value = result.dateList
    overallAveragePrice.value = result.averagePrice
  } catch (error) {
    message.error('加载分析数据失败')
    console.error('Load analysis data error:', error)
    // 清空数据
    analysisData.value = {}
    asinRows.value = []
    dateColumns.value = []
    overallAveragePrice.value = 0
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

  // 准备Excel数据
  const excelData: any[][] = []

  // 表头
  const headers = ['ASIN', ...dateColumns.value.map((date) => formatDate(date)), '平均价格']
  excelData.push(headers)

  // 数据行
  asinRows.value.forEach((asin) => {
    const row = [
      asin,
      ...dateColumns.value.map((date) => {
        const price = getPrice(asin, date)
        return price > 0 ? price.toFixed(2) : '-'
      }),
      getAsinAveragePrice(asin).toFixed(2)
    ]
    excelData.push(row)
  })

  // 平均价格行
  const averageRow = [
    '平均价格',
    ...dateColumns.value.map((date) => {
      const avgPrice = getDateAveragePrice(date)
      return avgPrice > 0 ? avgPrice.toFixed(2) : '-'
    }),
    overallAveragePrice.value.toFixed(2)
  ]
  excelData.push(averageRow)

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet(excelData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '价格分析报告')

  // 生成文件名
  const priceTypeNames = {
    buyboxPrice: 'BuyBox价格',
    price: '售价',
    primePrice: 'Prime价格',
    listPrice: '定价'
  }
  const fileName = `价格分析报告_${priceTypeNames[queryParams.priceType]}_${new Date().getTime()}.xlsx`
  XLSX.writeFile(wb, fileName)

  message.success('导出成功')
}

/** 组件挂载时初始化 */
onMounted(() => {
  taskId.value = Number(route.query.taskId)
  queryParams.taskId = taskId.value

  // 默认查询最近7天数据
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
  min-width: 90px;
}

.total-column {
  min-width: 100px;
  background-color: #f0f9ff;
}

.asin-cell {
  font-family: monospace;
  color: #409eff;
}

.data-cell {
  transition: background-color 0.2s;
  font-family: monospace;
}

.data-cell:hover {
  background-color: #f0f9ff;
}

.total-cell {
  background-color: #f0f9ff;
  font-weight: 600;
  font-family: monospace;
}

.total-row {
  background-color: #f9f9f9;
  font-weight: 600;
}

.grand-total {
  background-color: #e6f7ff;
  font-weight: 700;
  color: #1890ff;
  font-family: monospace;
}

.data-row:hover {
  background-color: #fafafa;
}
</style>
