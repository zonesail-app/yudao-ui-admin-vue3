<template>
  <el-card class="statistics-charts">
    <template #header>
      <div class="card-header">
        <span>统计分析</span>
      </div>
    </template>

    <el-row :gutter="20">
      <!-- ASIN频次饼图 -->
      <el-col :span="8">
        <div class="chart-container">
          <div class="chart-title">ASIN出现频次</div>
          <div ref="asinFrequencyChartRef" class="chart"></div>
        </div>
      </el-col>

      <!-- 位置稳定性柱状图 -->
      <el-col :span="8">
        <div class="chart-container">
          <div class="chart-title">位置稳定性评分</div>
          <div ref="positionStabilityChartRef" class="chart"></div>
        </div>
      </el-col>

      <!-- 关键词覆盖度 -->
      <el-col :span="8">
        <div class="chart-container">
          <div class="chart-title">关键词覆盖度</div>
          <div ref="keywordCoverageChartRef" class="chart"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 关键词覆盖度详细表格 -->
    <el-divider />
    <div class="coverage-table-section">
      <div class="section-title">关键词覆盖度详情</div>
      <el-table :data="coverageTableData" stripe>
        <el-table-column prop="keyword" label="关键词" width="200" />
        <el-table-column prop="coveredPositions" label="覆盖位置数" width="120" align="center" />
        <el-table-column prop="totalPositions" label="总位置数" width="120" align="center" />
        <el-table-column label="覆盖率" width="120" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.coverageRate"
              :color="getCoverageColor(row.coverageRate)"
              :show-text="false"
              :stroke-width="8"
            />
            <span class="coverage-text">{{ row.coverageRate.toFixed(1) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="评级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getCoverageTagType(row.coverageRate)">
              {{ getCoverageLevel(row.coverageRate) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { StatisticsData } from '../types'
import { getCoverageColor, getCoverageTagType, getCoverageLevel } from '../utils'

interface Props {
  statistics: StatisticsData
}

const props = defineProps<Props>()

// 图表引用
const asinFrequencyChartRef = ref<HTMLDivElement>()
const positionStabilityChartRef = ref<HTMLDivElement>()
const keywordCoverageChartRef = ref<HTMLDivElement>()

// 图表实例
let asinFrequencyChart: echarts.ECharts | null = null
let positionStabilityChart: echarts.ECharts | null = null
let keywordCoverageChart: echarts.ECharts | null = null

// 覆盖度表格数据
const coverageTableData = ref<
  Array<{
    keyword: string
    coveredPositions: number
    totalPositions: number
    coverageRate: number
  }>
>([])

// 初始化ASIN频次饼图
const initAsinFrequencyChart = () => {
  if (!asinFrequencyChartRef.value) return

  asinFrequencyChart = echarts.init(asinFrequencyChartRef.value)

  const data = Object.entries(props.statistics.asinFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) // 只显示前10个
    .map(([asin, count]) => ({
      name: asin,
      value: count
    }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        fontSize: 10
      }
    },
    series: [
      {
        name: 'ASIN频次',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '12',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }

  asinFrequencyChart.setOption(option)
}

// 初始化位置稳定性柱状图
const initPositionStabilityChart = () => {
  if (!positionStabilityChartRef.value) return

  positionStabilityChart = echarts.init(positionStabilityChartRef.value)

  const data = Object.entries(props.statistics.positionStability)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20) // 只显示前20个位置

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(([position]) => position),
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      name: '稳定性评分'
    },
    series: [
      {
        name: '稳定性评分',
        type: 'bar',
        data: data.map(([, score]) => score),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  }

  positionStabilityChart.setOption(option)
}

// 初始化关键词覆盖度图表
const initKeywordCoverageChart = () => {
  if (!keywordCoverageChartRef.value) return

  keywordCoverageChart = echarts.init(keywordCoverageChartRef.value)

  const data = Object.values(props.statistics.keywordCoverage)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map((item) => item.keyword),
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      name: '覆盖率(%)',
      max: 100
    },
    series: [
      {
        name: '覆盖率',
        type: 'bar',
        data: data.map((item) => item.coverageRate),
        itemStyle: {
          color: function (params: any) {
            const rate = params.value
            if (rate >= 80) return '#67C23A'
            if (rate >= 60) return '#E6A23C'
            if (rate >= 40) return '#F56C6C'
            return '#909399'
          }
        }
      }
    ]
  }

  keywordCoverageChart.setOption(option)
}

// 更新覆盖度表格数据
const updateCoverageTableData = () => {
  coverageTableData.value = Object.values(props.statistics.keywordCoverage).sort(
    (a, b) => b.coverageRate - a.coverageRate
  )
}

// 注意：getCoverageColor, getCoverageTagType, getCoverageLevel 函数已从 utils 导入

// 初始化所有图表
const initAllCharts = () => {
  nextTick(() => {
    initAsinFrequencyChart()
    initPositionStabilityChart()
    initKeywordCoverageChart()
    updateCoverageTableData()
  })
}

// 窗口大小变化时重新调整图表
const handleResize = () => {
  asinFrequencyChart?.resize()
  positionStabilityChart?.resize()
  keywordCoverageChart?.resize()
}

// 监听统计数据变化
watch(
  () => props.statistics,
  () => {
    if (props.statistics) {
      initAllCharts()
    }
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
const cleanup = () => {
  window.removeEventListener('resize', handleResize)
  asinFrequencyChart?.dispose()
  positionStabilityChart?.dispose()
  keywordCoverageChart?.dispose()
}

// 在组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(cleanup)
</script>

<style scoped lang="scss">
.statistics-charts {
  .card-header {
    font-size: 16px;
    font-weight: 600;
  }

  .chart-container {
    .chart-title {
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #333;
    }

    .chart {
      height: 300px;
      width: 100%;
    }
  }

  .coverage-table-section {
    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #333;
    }

    .coverage-text {
      margin-left: 8px;
      font-size: 12px;
      color: #666;
    }
  }
}
</style>
