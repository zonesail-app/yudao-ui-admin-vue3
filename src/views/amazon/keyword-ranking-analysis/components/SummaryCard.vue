<template>
  <el-card class="summary-card">
    <template #header>
      <div class="card-header">
        <span>数据汇总</span>
        <div class="header-info">
          <el-tag type="info" size="small">{{ summary.city }}</el-tag>
          <el-tag type="primary" size="small" class="ml-2">
            {{ getRankTypeText(summary.rankType) }}
          </el-tag>
        </div>
      </div>
    </template>

    <div class="summary-content-compact">
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-value">{{ summary.totalDays }}</span>
          <span class="stat-label">天</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ summary.totalPositions }}</span>
          <span class="stat-label">位置</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ summary.keywords.length }}</span>
          <span class="stat-label">关键词</span>
        </div>
        <div class="date-range">
          {{ formatDate(summary.dateRange[0]) }} ~ {{ formatDate(summary.dateRange[summary.dateRange.length - 1]) }}
        </div>
      </div>
      <div class="keywords-row">
        <el-tag
          v-for="(keyword, index) in summary.keywords"
          :key="index"
          :type="getKeywordTagType(index)"
          size="small"
          class="keyword-tag-compact"
        >
          {{ keyword }}
        </el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  summary: {
    dateRange: number[][] // 修正类型：嵌套数组格式 [[year, month, day], ...]
    totalDays: number
    totalPositions: number
    keywords: string[]
    city: string
    rankType: number
  }
}

const props = defineProps<Props>()

// 获取排名类型文本
const getRankTypeText = (rankType: number) => {
  const typeMap: { [key: number]: string } = {
    1: '广告位',
    2: '自然位'
  }
  return typeMap[rankType] || '全部'
}

// 获取关键词标签类型
const getKeywordTagType = (index: number) => {
  const types = ['primary', 'success', 'info', 'warning', 'danger']
  return types[index % types.length]
}

// 格式化日期数组为字符串
const formatDate = (dateArray: number[]) => {
  if (!dateArray || dateArray.length < 3) return ''
  const [year, month, day] = dateArray
  return `${month}月${day}日`
}
</script>

<style scoped lang="scss">
.summary-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;

    .header-info {
      display: flex;
      align-items: center;
    }
  }

  .summary-content-compact {
    .stats-row {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 12px;

      .stat-item {
        display: flex;
        align-items: baseline;
        gap: 4px;

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #409eff;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
        }
      }

      .date-range {
        margin-left: auto;
        font-size: 13px;
        color: #666;
        background: #f5f7fa;
        padding: 4px 8px;
        border-radius: 4px;
      }
    }

    .keywords-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .keyword-tag-compact {
        font-size: 12px;
        padding: 2px 8px;
      }
    }
  }
}
</style>
