<template>
  <el-card class="matrix-display">
    <template #header>
      <div class="card-header">
        <span>排名矩阵数据</span>
        <div class="header-actions">
          <el-button size="small" @click="exportData" icon="Download"> 导出数据 </el-button>
        </div>
      </div>
    </template>

    <!-- 单关键词模式 -->
    <div v-if="displayMode === 'single' && keywordList.length === 1">
      <MatrixTable
        :keyword="keywordList[0]"
        :matrix-data="matrix.keywordMatrices[keywordList[0]]"
        :headers="matrix.headers"
        :asin-colors="asinColors"
      />
    </div>

    <!-- 多关键词Tab模式 -->
    <div v-else-if="displayMode === 'single' && keywordList.length > 1">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane v-for="keyword in keywordList" :key="keyword" :label="keyword" :name="keyword">
          <MatrixTable
            :keyword="keyword"
            :matrix-data="matrix.keywordMatrices[keyword]"
            :headers="matrix.headers"
            :asin-colors="asinColors"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 对比模式 -->
    <div v-else-if="displayMode === 'comparison'">
      <div class="comparison-mode">
        <div class="comparison-header">
          <el-alert title="对比分析模式" type="info" :closable="false" show-icon>
            <template #default>
              正在对比 {{ keywordList.length }} 个关键词的排名数据，
              相同ASIN用相同颜色标识，便于识别竞争关系
            </template>
          </el-alert>
        </div>

        <!-- 关键词对比表格 -->
        <div class="comparison-tables">
          <div v-for="keyword in keywordList" :key="keyword" class="comparison-table-item">
            <div class="table-title">
              <el-tag type="primary">{{ keyword }}</el-tag>
            </div>
            <MatrixTable
              :keyword="keyword"
              :matrix-data="matrix.keywordMatrices[keyword]"
              :headers="matrix.headers"
              :asin-colors="asinColors"
              :compact="true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ASIN颜色分类图例 -->
    <div class="color-legend">
      <div class="legend-title">ASIN颜色分类</div>
      <div class="legend-items">
        <div class="legend-item">
          <div class="color-box" style="background-color: #f0f0f0"></div>
          <span class="legend-text">默认ASIN（灰色）</span>
        </div>
        <div v-if="taskAsins && taskAsins.length > 0" class="legend-item">
          <div class="color-box" style="background-color: #FF9800"></div>
          <span class="legend-text">任务ASIN（橙色）- {{ taskAsins.length }}个</span>
        </div>
        <div v-if="userAsins && userAsins.length > 0" class="legend-item">
          <div class="color-box" style="background-color: #9C27B0"></div>
          <span class="legend-text">关注ASIN（紫色）- {{ userAsins.length }}个</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import MatrixTable from './MatrixTable.vue'
import type { AsinColorMap } from '../types'
import { getAsinColor, ASIN_COLOR_PALETTE } from '../utils'

interface Props {
  matrix: {
    headers: string[]
    keywordMatrices: {
      [keyword: string]: {
        keyword: string
        rows: Array<{
          position: string
          positionCode: string
          pageNumber: number
          positionInPage: number
          data: string[]
        }>
      }
    }
  }
  displayMode: string
  taskAsins?: string[] // 任务中的ASIN列表
  userAsins?: string[] // 用户输入的ASIN列表
}

const props = defineProps<Props>()

// 当前激活的Tab
const activeTab = ref('')

// 关键词列表
const keywordList = computed(() => {
  return Object.keys(props.matrix.keywordMatrices)
})

// ASIN颜色映射
const asinColors = ref<AsinColorMap>({})

// 收集所有ASIN并生成颜色映射
const generateAsinColors = () => {
  const allAsins = new Set<string>()
  const newAsinColors: AsinColorMap = {}

  // 遍历所有关键词矩阵，收集ASIN
  Object.values(props.matrix.keywordMatrices).forEach((keywordMatrix) => {
    keywordMatrix.rows.forEach((row) => {
      row.data.forEach((asin) => {
        if (asin && asin !== '-') {
          allAsins.add(asin)
        }
      })
    })
  })

  // 为每个ASIN生成颜色，传入任务ASIN和用户ASIN列表
  allAsins.forEach((asin) => {
    newAsinColors[asin] = getAsinColor(asin, props.taskAsins || [], props.userAsins || [])
  })

  asinColors.value = newAsinColors
}

// 导出数据
const exportData = () => {
  try {
    // 检查是否有数据
    if (!props.matrix || Object.keys(props.matrix.keywordMatrices).length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new()

    // 为每个关键词创建工作表
    Object.entries(props.matrix.keywordMatrices).forEach(([keyword, keywordMatrix]) => {
      // 构建Excel数据
      const excelData: any[][] = []
      
      // 添加关键词信息行
      excelData.push([`关键词: ${keyword}`])
      excelData.push([`导出时间: ${new Date().toLocaleString('zh-CN')}`])
      excelData.push([`总位置数: ${keywordMatrix.rows.length}`])
      
      // 统计有数据的位置数
      const filledPositions = keywordMatrix.rows.filter(row => 
        row.data.some(asin => asin && asin !== '-')
      ).length
      excelData.push([`有数据位置: ${filledPositions}`])
      excelData.push([`数据覆盖率: ${((filledPositions / keywordMatrix.rows.length) * 100).toFixed(1)}%`])
      excelData.push([]) // 空行分隔
      
      // 添加ASIN统计信息
      if (props.taskAsins && props.taskAsins.length > 0) {
        excelData.push([`任务ASIN数量: ${props.taskAsins.length}个`])
      }
      if (props.userAsins && props.userAsins.length > 0) {
        excelData.push([`关注ASIN数量: ${props.userAsins.length}个`])
      }
      excelData.push([]) // 空行分隔
      
      // 添加表头
      excelData.push(props.matrix.headers)
      
      // 添加数据行
      keywordMatrix.rows.forEach(row => {
        const rowData = [row.position, ...row.data]
        excelData.push(rowData)
      })
      
      // 创建工作表
      const ws = XLSX.utils.aoa_to_sheet(excelData)
      
      // 设置列宽
      const colWidths = [
        { wch: 12 }, // 位置列
        ...props.matrix.headers.slice(1).map(() => ({ wch: 15 })) // 日期列，增加宽度以容纳完整ASIN
      ]
      ws['!cols'] = colWidths

      // 添加工作表到工作簿（关键词名称作为sheet名称，限制长度）
      const sheetName = keyword.length > 30 ? keyword.substring(0, 30) + '...' : keyword
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })

    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')
    const keywordCount = Object.keys(props.matrix.keywordMatrices).length
    const fileName = `关键词排名矩阵_${keywordCount}个关键词_${timestamp}.xlsx`
    
    // 下载文件
    XLSX.writeFile(wb, fileName)
    
    ElMessage.success(`成功导出 ${keywordCount} 个关键词的排名数据`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 监听矩阵数据变化
watch(
  () => props.matrix,
  () => {
    if (props.matrix && Object.keys(props.matrix.keywordMatrices).length > 0) {
      generateAsinColors()

      // 设置默认激活的Tab
      if (keywordList.value.length > 0) {
        activeTab.value = keywordList.value[0]
      }
    }
  },
  { immediate: true, deep: true }
)

// 监听ASIN列表变化
watch(
  [() => props.taskAsins, () => props.userAsins],
  () => {
    if (props.matrix && Object.keys(props.matrix.keywordMatrices).length > 0) {
      generateAsinColors()
    }
  },
  { immediate: true, deep: true }
)
</script>

<style scoped lang="scss">
.matrix-display {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
  }

  .comparison-mode {
    .comparison-header {
      margin-bottom: 20px;
    }

    .comparison-tables {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
      gap: 20px;

      .comparison-table-item {
        .table-title {
          margin-bottom: 12px;

          .el-tag {
            font-size: 14px;
            padding: 6px 12px;
          }
        }
      }
    }
  }

  .color-legend {
    margin-top: 20px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 6px;

    .legend-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #333;
    }

    .legend-items {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;

        .color-box {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          border: 1px solid #ddd;
        }

        .legend-text {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .comparison-tables {
    grid-template-columns: 1fr !important;
  }
}
</style>
