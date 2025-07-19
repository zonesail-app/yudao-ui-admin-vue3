<template>
  <ContentWrap :body-style="{ padding: '12px' }">
    <div class="word-counter-container-full">
      <el-card class="mb-2">
        <template #header>
          <div class="card-header">
            <span>关键词统计工具</span>
            <div class="header-buttons">
              <el-button size="small" @click="clearAllData">清空数据</el-button>
              <el-button size="small" type="primary" @click="loadSampleData">加载示例</el-button>
              <el-button
                size="small"
                type="info"
                @click="exportToExcel"
                :disabled="keywords.length === 0"
              >
                <Icon icon="ep:download" class="mr-1" />
                导出Excel
              </el-button>
              <el-button size="small" type="success" @click="openEditDialog">
                <Icon icon="ep:edit" class="mr-1" />
                编辑
              </el-button>
            </div>
          </div>
        </template>

        <!-- 空状态提示 -->
        <div v-if="keywords.length === 0" class="empty-state">
          <el-empty description="暂无数据">
            <el-button type="primary" @click="openEditDialog">开始编辑内容</el-button>
          </el-empty>
        </div>
      </el-card>

      <!-- 左右分布布局 -->
      <div v-if="keywords.length > 0" class="main-layout">
        <!-- 左侧：关键词统计 -->
        <el-card class="left-panel">
          <template #header>
            <div class="card-header">
              <span>关键词统计</span>
            </div>
          </template>

          <!-- 关键词列表 -->
          <div class="keyword-stats-vertical">
            <div
              v-for="(keyword, index) in keywords"
              :key="index"
              class="keyword-item"
              :class="{ active: selectedKeyword === keyword }"
              @click="toggleKeywordHighlight(keyword)"
            >
              <div class="keyword-name">{{ keyword }}</div>
              <div class="keyword-count">
                <el-tag
                  :type="getTagType(keyword)"
                  size="small"
                  round
                  style="transform: scale(0.85)"
                >
                  {{ keywordStats[keyword] || 0 }}
                </el-tag>
              </div>
            </div>
          </div>

          <div class="keyword-help-left"> 点击关键词可以在右侧内容中高亮显示 </div>

          <!-- 统计摘要 -->
          <el-divider />
          <div class="statistics-summary-compact">
            <div class="preview-title">统计摘要</div>
            <div class="stats-compact">
              <div class="stat-compact">
                <span class="stat-label-compact">总出现次数：</span>
                <span class="stat-value">{{ totalKeywordCount }}</span>
              </div>
              <div class="stat-compact">
                <span class="stat-label-compact">匹配关键词：</span>
                <span class="stat-value">{{ matchedKeywordCount }}/{{ keywords.length }}</span>
              </div>
              <div class="stat-compact">
                <span class="stat-label-compact">覆盖率：</span>
                <span class="stat-value">{{ coverageRate }}%</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 右侧：内容预览 -->
        <el-card class="right-panel">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span>内容预览</span>
                <el-tag v-if="selectedKeyword" type="info" size="small" class="ml-2">
                  <Icon icon="ep:view" class="mr-1" />
                  正在高亮：{{ selectedKeyword }}
                </el-tag>
              </div>
              <el-button v-if="selectedKeyword" size="small" @click="clearHighlight">
                清除高亮
              </el-button>
            </div>
          </template>

          <!-- 标题预览 -->
          <div v-if="formData.title" class="preview-section">
            <div class="preview-title">标题：</div>
            <div class="content-preview" v-html="highlightKeyword(formData.title)"></div>
          </div>

          <!-- 描述预览 -->
          <div v-if="validDescriptions.length > 0">
            <div class="preview-title">描述：</div>
            <div v-for="(item, index) in validDescriptions" :key="index" class="description-item">
              <div class="description-label">第{{ item.originalIndex + 1 }}点：</div>
              <div class="content-preview" v-html="highlightKeyword(item.content)"></div>
            </div>
          </div>

          <!-- 无内容提示 -->
          <div v-if="!formData.title && validDescriptions.length === 0" class="no-content">
            <el-empty description="暂无内容" :image-size="120">
              <el-button type="primary" @click="openEditDialog">添加内容</el-button>
            </el-empty>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 编辑内容弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑内容"
      width="800px"
      :before-close="handleDialogClose"
    >
      <el-form :model="formData" label-width="100px">
        <!-- 标题输入 -->
        <el-form-item label="标题">
          <el-input
            v-model="formData.title"
            placeholder="请输入标题"
            type="textarea"
            :rows="2"
            clearable
            @input="updateStatistics"
          />
        </el-form-item>

        <!-- 五点描述输入 -->
        <el-form-item label="五点描述">
          <div class="descriptions-container">
            <div
              v-for="(desc, index) in formData.descriptions"
              :key="index"
              class="description-row"
            >
              <div class="description-number"> 第{{ index + 1 }}点 </div>
              <el-input
                v-model="formData.descriptions[index]"
                :placeholder="`请输入第${index + 1}点产品描述`"
                clearable
                @input="updateStatistics"
                class="description-input"
              />
            </div>
          </div>
          <div class="keyword-hint"> 提示：每个描述点分别输入，便于管理和优化 </div>
        </el-form-item>

        <!-- 关键词输入 -->
        <el-form-item label="关键词列表">
          <el-input
            v-model="keywordInput"
            placeholder="请输入关键词，用逗号或换行分隔"
            type="textarea"
            :rows="3"
            clearable
            @input="parseKeywords"
          />
          <div class="keyword-hint"> 提示：可以使用逗号、分号或换行来分隔多个关键词 </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAndClose">保存并关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
/**
 * 关键词统计工具
 *
 * 功能说明：
 * 1. 输入标题和五点描述
 * 2. 输入关键词列表（支持多种分隔符）
 * 3. 统计关键词在内容中的出现次数（不区分大小写）
 * 4. 点击关键词可以高亮显示在内容中的位置
 * 5. 提供统计报表：总次数、匹配数量、覆盖率等
 *
 * @author AI Assistant
 * @since 2024
 */
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@/components/Icon'
import {
  WordCounterApi,
  type WordCountExportData,
  type KeywordStatItem
} from '@/api/amazon/wordcounter'
import download from '@/utils/download'

defineOptions({ name: 'WordCounter' })

// 表单数据
const formData = reactive({
  title: '',
  descriptions: ['', '', '', '', ''] // 五点描述，分别对应5个字段
})

// 关键词输入
const keywordInput = ref('')
const keywords = ref<string[]>([])
const selectedKeyword = ref('')

// 关键词统计
const keywordStats = ref<Record<string, number>>({})

// 弹窗控制
const editDialogVisible = ref(false)

// 解析关键词
const parseKeywords = () => {
  if (!keywordInput.value.trim()) {
    keywords.value = []
    updateStatistics()
    return
  }

  // 使用正则表达式分割关键词，支持逗号、分号、换行
  const parsed = keywordInput.value
    .split(/[,，;；\n\r]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0)

  keywords.value = [...new Set(parsed)] // 去重
  updateStatistics()
}

// 更新统计数据
const updateStatistics = () => {
  const stats: Record<string, number> = {}
  const allContent = [formData.title, ...formData.descriptions].join(' ')

  keywords.value.forEach((keyword) => {
    if (keyword) {
      // 使用正则表达式进行不区分大小写的匹配
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      const matches = allContent.match(regex)
      stats[keyword] = matches ? matches.length : 0
    }
  })

  keywordStats.value = stats
}

// 切换关键词高亮
const toggleKeywordHighlight = (keyword: string) => {
  if (selectedKeyword.value === keyword) {
    selectedKeyword.value = ''
    //ElMessage.info('已取消高亮')
  } else {
    selectedKeyword.value = keyword
    //ElMessage.success(`正在高亮关键词: ${keyword}`)
  }
}

// 清除高亮
const clearHighlight = () => {
  selectedKeyword.value = ''
}

// 高亮关键词
const highlightKeyword = (text: string) => {
  if (!selectedKeyword.value || !text) return text

  // 创建正则表达式，不区分大小写
  const regex = new RegExp(
    `(${selectedKeyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  )

  return text.replace(regex, '<span class="highlight-keyword">$1</span>')
}

// 获取标签类型
const getTagType = (keyword: string) => {
  const count = keywordStats.value[keyword] || 0
  if (count === 0) return 'info'
  if (count <= 2) return 'warning'
  return 'success'
}

// 计算属性
const totalKeywordCount = computed(() => {
  return Object.values(keywordStats.value).reduce((sum, count) => sum + count, 0)
})

const matchedKeywordCount = computed(() => {
  return Object.values(keywordStats.value).filter((count) => count > 0).length
})

const coverageRate = computed(() => {
  if (keywords.value.length === 0) return 0
  return Math.round((matchedKeywordCount.value / keywords.value.length) * 100)
})

// 过滤有内容的描述，用于v-for循环
const validDescriptions = computed(() => {
  return formData.descriptions
    .map((content, index) => ({ content, originalIndex: index }))
    .filter((item) => item.content.trim())
})

// 加载示例数据
const loadSampleData = () => {
  formData.title = 'Wireless Bluetooth Headphones with Noise Cancelling and Long Battery Life'
  formData.descriptions = [
    'Experience premium sound quality with our wireless Bluetooth headphones featuring advanced noise cancelling technology.',
    'Perfect for commuting, working out, or relaxing at home with superior comfort and fit.',
    'Long-lasting 30-hour battery life ensures uninterrupted music enjoyment throughout your day.',
    'Premium materials and ergonomic design provide maximum comfort for extended wear.',
    'Compatible with all Bluetooth devices including iPhone, Android, tablets and laptops.'
  ]

  keywordInput.value =
    'wireless, Bluetooth, headphones, noise cancelling, battery, sound, quality, comfort'

  // 解析关键词并更新统计
  parseKeywords()

  ElMessage.success('示例数据已加载！现在可以点击关键词测试高亮功能')
}

// 清空所有数据
const clearAllData = () => {
  formData.title = ''
  formData.descriptions = ['', '', '', '', '']
  keywordInput.value = ''
  keywords.value = []
  selectedKeyword.value = ''
  keywordStats.value = {}
  ElMessage.info('所有数据已清空')
}

// 打开编辑弹窗
const openEditDialog = () => {
  editDialogVisible.value = true
}

// 保存并关闭弹窗
const saveAndClose = () => {
  parseKeywords()
  updateStatistics()
  editDialogVisible.value = false
  ElMessage.success('内容已保存')
}

// 处理弹窗关闭
const handleDialogClose = () => {
  editDialogVisible.value = false
}

// 检查关键词是否在特定文本中出现
const checkKeywordInText = (keyword: string, text: string): boolean => {
  if (!keyword || !text) return false
  const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  return regex.test(text)
}

// 导出到Excel
const exportToExcel = async () => {
  if (keywords.value.length === 0) {
    ElMessage.warning('请先添加关键词')
    return
  }

  try {
    // 构建关键词统计数据
    const keywordStatsData: KeywordStatItem[] = keywords.value.map((keyword) => {
      return {
        keyword: keyword,
        totalCount: keywordStats.value[keyword] || 0,
        inTitle: checkKeywordInText(keyword, formData.title),
        inDescription1: checkKeywordInText(keyword, formData.descriptions[0]),
        inDescription2: checkKeywordInText(keyword, formData.descriptions[1]),
        inDescription3: checkKeywordInText(keyword, formData.descriptions[2]),
        inDescription4: checkKeywordInText(keyword, formData.descriptions[3]),
        inDescription5: checkKeywordInText(keyword, formData.descriptions[4])
      }
    })

    // 构建导出数据
    const exportData: WordCountExportData = {
      keywordStats: keywordStatsData
    }

    ElMessage.info('正在导出Excel...')

    // 调用导出接口
    const data = await WordCounterApi.exportWordCountExcel(exportData)

    // 使用download工具下载文件
    download.excel(data, '关键词匹配统计.xls')

    ElMessage.success('Excel导出成功!')
  } catch (error) {
    console.error('导出Excel失败:', error)
    ElMessage.error('导出Excel失败，请稍后重试')
  }
}
</script>

<style scoped>
.word-counter-container-full {
  width: 100%;
  min-height: calc(100vh - 200px);
}

.keyword-stats {
  min-height: 60px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  background-color: #fafafa;
}

.cursor-pointer {
  cursor: pointer;
  transition: all 0.3s ease;
}

.cursor-pointer:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  min-height: 16px;
}

.header-buttons {
  display: flex;
  gap: 6px;
}

.descriptions-container {
  width: 100%;
}

.description-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.description-row:last-child {
  margin-bottom: 0;
}

.description-number {
  min-width: 60px;
  font-weight: 600;
  color: #606266;
  font-size: 14px;
  text-align: center;
  background-color: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  flex-shrink: 0;
}

.description-input {
  flex: 1;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
  line-height: 1.3;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.dialog-footer {
  text-align: right;
}

/* 主布局 */
.main-layout {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  height: calc(100vh - 280px);
}

.left-panel {
  flex: 0 0 320px;
  height: 100%;
  overflow-y: auto;
}

.right-panel {
  flex: 1;
  height: 100%;
  overflow-y: auto;
}

/* 垂直关键词列表 */
.keyword-stats-vertical {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.keyword-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #fff;
}

.keyword-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
  transform: translateX(1px);
}

.keyword-item.active {
  border-color: #409eff;
  background-color: #409eff;
  color: white;
  box-shadow: 0 1px 4px rgba(64, 158, 255, 0.3);
}

.keyword-name {
  font-weight: 500;
  font-size: 12px;
  line-height: 1.2;
}

.keyword-count {
  flex-shrink: 0;
}

.keyword-item.active .keyword-count .el-tag {
  background-color: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  color: white !important;
  font-weight: 700 !important;
}

.keyword-help-left {
  font-size: 11px;
  color: #909399;
  text-align: center;
  padding: 6px;
  background-color: #f5f7fa;
  border-radius: 3px;
  margin-bottom: 12px;
  line-height: 1.3;
}

/* 紧凑统计摘要 */
.statistics-summary-compact {
  margin-top: 12px;
}

.stats-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background-color: #f8f9fa;
  border-radius: 3px;
}

.stat-label-compact {
  font-size: 11px;
  color: #606266;
  line-height: 1.2;
}

.stat-value {
  font-weight: 600;
  color: #409eff;
  font-size: 12px;
}

/* 头部布局优化 */
.header-left {
  display: flex;
  align-items: center;
  font-size: 13px;
  gap: 8px;
}

.no-content {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.keyword-hint {
  font-size: 10px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.3;
}

.keyword-help {
  font-size: 10px;
  color: #606266;
  margin-top: 6px;
  line-height: 1.3;
}

.preview-section {
  margin-bottom: 10px;
}

.preview-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #303133;
  line-height: 1.3;
}

.content-preview {
  border: 1px solid #dcdfe6;
  padding: 8px 10px;
  border-radius: 3px;
  background-color: #f5f7fa;
  line-height: 1.4;
  font-size: 13px;
}

.description-item {
  margin-bottom: 6px;
}

.description-label {
  font-weight: 500;
  font-size: 10px;
  color: #606266;
  margin-bottom: 3px;
  line-height: 1.2;
}

.statistics-summary {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-blue {
  color: #409eff;
}

.stat-green {
  color: #67c23a;
}

.stat-purple {
  color: #9b59b6;
}

.stat-orange {
  color: #e6a23c;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
}

:deep(.el-textarea__inner) {
  resize: vertical;
}

:deep(.el-badge__content) {
  font-size: 9px;
  padding: 0 3px;
  min-width: 14px;
  height: 14px;
  line-height: 14px;
}

:deep(.el-tag--small) {
  height: 20px;
  line-height: 18px;
  font-size: 11px;
  padding: 0 6px;
  font-weight: 600;
}

:deep(.el-tag--info) {
  color: #ff6b00 !important;
  background-color: #fff3e6 !important;
  border-color: #ffb366 !important;
}

:deep(.el-tag--warning) {
  color: #e65100 !important;
  background-color: #fff3e0 !important;
  border-color: #ffcc80 !important;
}

:deep(.el-tag--success) {
  color: #2e7d32 !important;
  background-color: #e8f5e8 !important;
  border-color: #81c784 !important;
}

/* 高亮关键词样式 - 使用全局样式避免scoped CSS问题 */

:deep(.el-card) {
  margin-bottom: 10px;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

:deep(.el-card__header) {
  padding: 8px 12px;
  min-height: auto;
}

:deep(.el-card__body) {
  padding: 10px 12px;
}

:deep(.el-divider) {
  margin: 10px 0;
}
</style>

<style>
/* 全局样式 - 高亮关键词 */
.highlight-keyword {
  background-color: #fff2d1 !important;
  color: #e6a700 !important;
  padding: 1px 3px !important;
  border-radius: 2px !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
}
</style>
