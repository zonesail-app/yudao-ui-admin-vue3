<template>
  <div class="matrix-table-container">
    <div class="table-info" v-if="!compact">
      <el-alert
        :title="`关键词: ${keyword} - 共 ${matrixData.rows.length} 个位置`"
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <div class="table-wrapper">
      <el-table
        :data="matrixData.rows"
        :height="compact ? 500 : 700"
        stripe
        border
        class="matrix-table"
        :class="{ compact: compact }"
      >
        <!-- 位置列（固定） -->
        <el-table-column prop="position" label="位置" width="60" fixed="left" align="center">
          <template #default="{ row }">
            <div class="position-cell">
              <div class="position-code">{{ row.position }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- 动态日期列 -->
        <el-table-column
          v-for="(header, index) in dateHeaders"
          :key="header"
          :label="header"
          :width="compact ? 110 : 130"
          align="center"
        >
          <template #default="{ row }">
            <div class="asin-cell">
              <div
                v-if="row.data[index] && row.data[index] !== '-'"
                class="asin-tag"
                :style="{
                  backgroundColor: asinColors[row.data[index]] || '#f0f0f0',
                  color: getTextColor(asinColors[row.data[index]] || '#f0f0f0')
                }"
                :title="`ASIN: ${row.data[index]}`"
              >
                {{ row.data[index] }}
              </div>
              <div v-else class="empty-cell">-</div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 表格统计信息 -->
    <div class="table-stats" v-if="!compact">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-statistic title="总位置数" :value="matrixData.rows.length" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="有数据位置" :value="filledPositions" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="数据覆盖率" :value="coverageRate" suffix="%" :precision="1" />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AsinColorMap } from '../types'
import { formatAsin, getTextColor } from '../utils'

interface Props {
  keyword: string
  matrixData: {
    keyword: string
    rows: Array<{
      position: string
      positionCode: string
      pageNumber: number
      positionInPage: number
      data: string[]
    }>
  }
  headers: string[]
  asinColors: AsinColorMap
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

// 日期表头（排除第一个"位置"列）
const dateHeaders = computed(() => {
  return props.headers.slice(1)
})

// 有数据的位置数量
const filledPositions = computed(() => {
  return props.matrixData.rows.filter((row) => row.data.some((asin) => asin && asin !== '-')).length
})

// 数据覆盖率
const coverageRate = computed(() => {
  if (props.matrixData.rows.length === 0) return 0
  return (filledPositions.value / props.matrixData.rows.length) * 100
})

// 注意：formatAsin 和 getTextColor 函数已从 utils 导入
</script>

<style scoped lang="scss">
.matrix-table-container {
  .table-info {
    margin-bottom: 16px;
  }

  .table-wrapper {
    .matrix-table {
      font-size: 12px;

      &.compact {
        font-size: 11px;
      }

      :deep(.el-table__header) {
        th {
          background-color: #f8f9fa;
          font-weight: 600;
          font-size: 13px;

          .cell {
            padding: 8px 4px;
          }
        }
      }

      :deep(.el-table__body) {
        td {
          padding: 2px 0;
          height: 36px;

          .cell {
            padding: 2px 4px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      }

      .position-cell {
        text-align: center;

        .position-code {
          font-weight: 600;
          color: #409eff;
          font-size: 11px;
        }
      }

      .asin-cell {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 32px;
        padding: 1px;

        .asin-tag {
          padding: 3px 5px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
          font-family: monospace;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          overflow: visible;
          text-overflow: clip;
          max-width: 100%;
          word-break: keep-all;

          &:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
        }

        .empty-cell {
          color: #ccc;
          font-size: 14px;
        }
      }
    }
  }

  .table-stats {
    margin-top: 16px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 6px;

    :deep(.el-statistic) {
      text-align: center;

      .el-statistic__head {
        font-size: 13px;
        color: #666;
      }

      .el-statistic__content {
        font-size: 20px;
        font-weight: 600;
        color: #409eff;
      }
    }
  }
}
</style>
