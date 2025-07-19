<template>
  <el-card class="comparison-analysis">
    <template #header>
      <div class="card-header">
        <span>对比分析</span>
        <el-tag type="info" size="small">{{ comparisonTypeText }}</el-tag>
      </div>
    </template>

    <!-- 位置竞争分析 -->
    <div v-if="comparisonType === 'position'" class="position-competition">
      <div class="section-title">位置竞争分析</div>
      <div class="competition-grid">
        <div
          v-for="competition in comparison.positionCompetitions.slice(0, 6)"
          :key="competition.position"
          class="competition-item"
        >
          <el-card shadow="hover" class="competition-card">
            <template #header>
              <div class="position-header">
                <span class="position-text">{{ competition.position }}</span>
                <el-tag size="small" type="primary"> {{ competition.dates.length }} 天数据 </el-tag>
              </div>
            </template>

            <div class="competition-content">
              <div
                v-for="comp in competition.competitions"
                :key="comp.date"
                class="date-competition"
              >
                <div class="date-label">{{ comp.date }}</div>
                <div class="asins-comparison">
                  <div v-if="comp.sameAsins.length > 0" class="same-asins">
                    <el-tag type="success" size="small">
                      相同: {{ comp.sameAsins.join(', ') }}
                    </el-tag>
                  </div>
                  <div v-if="Object.keys(comp.differentAsins).length > 0" class="different-asins">
                    <div
                      v-for="(asin, keyword) in comp.differentAsins"
                      :key="keyword"
                      class="keyword-asin"
                    >
                      <el-tag type="warning" size="small"> {{ keyword }}: {{ asin }} </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- ASIN覆盖度分析 -->
    <div v-else-if="comparisonType === 'asin'" class="asin-coverage">
      <div class="section-title">ASIN覆盖度分析</div>
      <el-table :data="asinCoverageData" stripe max-height="500">
        <el-table-column prop="asin" label="ASIN" width="120" fixed="left">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.asin }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="关键词" width="200">
          <template #default="{ row }">
            <div class="keywords-list">
              <el-tag
                v-for="keyword in row.keywords"
                :key="keyword"
                size="small"
                class="keyword-tag"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="位置分布" width="200">
          <template #default="{ row }">
            <div class="positions-list">
              <el-tag
                v-for="position in row.positions.slice(0, 5)"
                :key="position"
                size="small"
                type="info"
                class="position-tag"
              >
                {{ position }}
              </el-tag>
              <span v-if="row.positions.length > 5" class="more-positions">
                +{{ row.positions.length - 5 }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="coverageRate" label="覆盖率" width="120" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.coverageRate"
              :color="getCoverageColor(row.coverageRate)"
              :show-text="false"
              :stroke-width="6"
            />
            <div class="coverage-text">{{ row.coverageRate.toFixed(1) }}%</div>
          </template>
        </el-table-column>

        <el-table-column prop="averagePosition" label="平均位置" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getPositionTagType(row.averagePosition)" size="small">
              {{ row.averagePosition.toFixed(1) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="stabilityScore" label="稳定性" width="100" align="center">
          <template #default="{ row }">
            <el-rate
              :model-value="row.stabilityScore / 20"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value}"
            />
          </template>
        </el-table-column>

        <el-table-column label="综合评级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getOverallRatingType(row)">
              {{ getOverallRating(row) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 覆盖度对比分析 -->
    <div v-else-if="comparisonType === 'coverage'" class="coverage-comparison">
      <div class="section-title">覆盖度对比分析</div>
      <div ref="coverageComparisonChartRef" class="coverage-chart"></div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { ComparisonData } from '../types'
import { getCoverageColor } from '../utils'

interface Props {
  comparison: ComparisonData
  comparisonType: string
}

const props = defineProps<Props>()

// 图表引用
const coverageComparisonChartRef = ref<HTMLDivElement>()
let coverageComparisonChart: echarts.ECharts | null = null

// 对比类型文本
const comparisonTypeText = computed(() => {
  const typeMap: { [key: string]: string } = {
    position: '位置竞争对比',
    asin: 'ASIN覆盖度对比',
    coverage: '覆盖度趋势对比'
  }
  return typeMap[props.comparisonType] || '未知对比类型'
})

// ASIN覆盖度表格数据
const asinCoverageData = computed(() => {
  return Object.values(props.comparison.asinCoverages).sort(
    (a, b) => b.coverageRate - a.coverageRate
  )
})

// 注意：getCoverageColor 函数已从 utils 导入

// 获取位置标签类型
const getPositionTagType = (position: number) => {
  if (position <= 10) return 'success'
  if (position <= 20) return 'warning'
  return 'danger'
}

// 获取综合评级
const getOverallRating = (row: any) => {
  const score =
    row.coverageRate * 0.4 + (100 - row.averagePosition) * 0.3 + row.stabilityScore * 0.3
  if (score >= 80) return 'S'
  if (score >= 70) return 'A'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C'
  return 'D'
}

// 获取综合评级标签类型
const getOverallRatingType = (row: any) => {
  const rating = getOverallRating(row)
  if (rating === 'S') return 'success'
  if (rating === 'A') return 'primary'
  if (rating === 'B') return 'warning'
  if (rating === 'C') return 'danger'
  return 'info'
}

// 初始化覆盖度对比图表
const initCoverageComparisonChart = () => {
  if (!coverageComparisonChartRef.value) return

  coverageComparisonChart = echarts.init(coverageComparisonChartRef.value)

  // 模拟覆盖度趋势数据
  const asinData = Object.values(props.comparison.asinCoverages).slice(0, 5)
  const dates = ['7-15', '7-16', '7-17', '7-18', '7-19'] // 示例日期

  const series = asinData.map((asin) => ({
    name: asin.asin,
    type: 'line',
    data: [
      asin.coverageRate,
      asin.coverageRate + (Math.random() - 0.5) * 10,
      asin.coverageRate + (Math.random() - 0.5) * 15,
      asin.coverageRate + (Math.random() - 0.5) * 8,
      asin.coverageRate + (Math.random() - 0.5) * 12
    ].map((val) => Math.max(0, Math.min(100, val)))
  }))

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: asinData.map((asin) => asin.asin),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value',
      name: '覆盖率(%)',
      min: 0,
      max: 100
    },
    series: series
  }

  coverageComparisonChart.setOption(option)
}

// 监听对比数据变化
watch(
  () => props.comparison,
  () => {
    if (props.comparison && props.comparisonType === 'coverage') {
      nextTick(() => {
        initCoverageComparisonChart()
      })
    }
  },
  { immediate: true, deep: true }
)

// 窗口大小变化时重新调整图表
const handleResize = () => {
  coverageComparisonChart?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  coverageComparisonChart?.dispose()
})
</script>

<style scoped lang="scss">
.comparison-analysis {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #333;
  }

  .position-competition {
    .competition-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;

      .competition-item {
        .competition-card {
          height: 100%;

          .position-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .position-text {
              font-weight: 600;
              color: #409eff;
            }
          }

          .competition-content {
            .date-competition {
              margin-bottom: 12px;
              padding: 8px;
              background-color: #f8f9fa;
              border-radius: 4px;

              &:last-child {
                margin-bottom: 0;
              }

              .date-label {
                font-size: 12px;
                color: #666;
                margin-bottom: 6px;
              }

              .asins-comparison {
                .same-asins,
                .different-asins {
                  margin-bottom: 4px;

                  .keyword-asin {
                    display: inline-block;
                    margin-right: 4px;
                    margin-bottom: 4px;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  .asin-coverage {
    .keywords-list,
    .positions-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .keyword-tag,
      .position-tag {
        margin: 0;
      }

      .more-positions {
        font-size: 12px;
        color: #999;
        margin-left: 4px;
      }
    }

    .coverage-text {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
  }

  .coverage-comparison {
    .coverage-chart {
      height: 400px;
      width: 100%;
    }
  }
}

@media (max-width: 768px) {
  .competition-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
