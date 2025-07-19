<template>
  <div class="keyword-analysis">
    <!-- 查询表单 -->
    <el-card class="search-form mb-4">
      <template #header>
        <div class="card-header">
          <span>关键词排名数据分析</span>
        </div>
      </template>

      <el-form
        ref="queryFormRef"
        :model="queryForm"
        :rules="queryRules"
        label-width="80px"
        class="search-form-content"
        size="small"
      >
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="城市" prop="city" required>
              <el-select
                v-model="queryForm.city"
                placeholder="选择城市"
                size="small"
                style="width: 100%"
                :disabled="!selectedTask || availableCities.length === 0"
              >
                <el-option
                  v-for="city in availableCities"
                  :key="city"
                  :label="city"
                  :value="city"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="关键词" prop="keywords" required>
              <el-select
                v-model="queryForm.keywords"
                placeholder="选择关键词"
                size="small"
                style="width: 100%"
                multiple
                collapse-tags
                :max-collapse-tags="1"
                :disabled="!selectedTask || availableKeywords.length === 0"
              >
                <el-option
                  v-for="keyword in availableKeywords"
                  :key="keyword"
                  :label="keyword"
                  :value="keyword"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                size="small"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                format="MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="排名类型">
              <el-select
                v-model="queryForm.rankType"
                placeholder="全部（不选择查询全部）"
                size="small"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="type in RANK_TYPES"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12" class="compact-row">
          <el-col :span="3">
            <el-form-item label="位置数" label-width="60px">
              <el-input-number
                v-model="queryForm.maxPosition"
                :min="1"
                :max="200"
                size="small"
                style="width: 100%"
                :controls="false"
              />
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="聚合方式" label-width="70px">
              <el-select v-model="queryForm.aggregationType" size="small" style="width: 100%">
                <el-option
                  v-for="type in AGGREGATION_TYPES"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="5">
            <el-form-item label="关注ASIN" label-width="80px">
              <el-button
                @click="openAsinDialog"
                size="small"
                style="width: 100%"
                :type="userAsins.length > 0 ? 'primary' : 'default'"
              >
                {{ userAsins.length > 0 ? `已设置 ${userAsins.length} 个` : '设置关注ASIN' }}
              </el-button>
            </el-form-item>
          </el-col>

          <el-col :span="12" :offset="0">
            <el-form-item class="button-group" label-width="0">
              <el-button type="primary" @click="handleQuery" :loading="loading" size="small">
                查询分析
              </el-button>
              <el-button @click="handleReset" size="small">重置</el-button>
              <el-button v-if="isDevelopment" @click="loadMockData" type="warning" size="small">
                测试数据
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 结果展示区域 -->
    <div v-if="analysisData" class="analysis-results">
      <!-- 汇总信息卡片 -->
      <SummaryCard :summary="analysisData.summary" class="mb-4" />

      <!-- 矩阵数据表格 -->
      <MatrixDisplay
        :matrix="analysisData.matrix"
        :display-mode="queryForm.displayMode"
        :task-asins="taskAsins"
        :user-asins="userAsins"
        class="mb-4"
      />

      <!-- 统计图表区域 -->
      <StatisticsCharts :statistics="analysisData.statistics" class="mb-4" />

      <!-- 对比分析区域 -->
      <ComparisonAnalysis
        v-if="queryForm.displayMode === 'comparison' && analysisData.comparison"
        :comparison="analysisData.comparison"
        :comparison-type="queryForm.comparisonType"
      />
    </div>

    <!-- 无数据状态 -->
    <el-empty v-else-if="!loading && hasQueried" description="暂无数据" :image-size="200" />

    <!-- 关注ASIN设置弹窗 -->
    <el-dialog
      v-model="showAsinDialog"
      title="设置关注ASIN"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="asinFormRef" :model="asinForm" label-width="0">
        <el-form-item>
          <div class="asin-input-tips">
            <el-alert
              title="请在下方文本框中输入ASIN，每行一个"
              type="info"
              :closable="false"
              show-icon
            />
          </div>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="asinForm.asinText"
            type="textarea"
            :rows="8"
            placeholder="每行输入一个ASIN，例如：&#10;B08N5WRWNW&#10;B07XJ8C8F5&#10;B09KMVJZ3M"
            style="width: 100%"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="validAsins.length > 0">
          <div class="valid-asins-preview">
            <div class="preview-title">有效的ASIN（{{ validAsins.length }}个）：</div>
            <div class="asin-tags">
              <el-tag
                v-for="asin in validAsins"
                :key="asin"
                type="primary"
                size="small"
                class="asin-tag"
              >
                {{ asin }}
              </el-tag>
            </div>
          </div>
        </el-form-item>
        <el-form-item v-if="invalidAsins.length > 0">
          <div class="invalid-asins-preview">
            <div class="preview-title error">无效的ASIN（{{ invalidAsins.length }}个）：</div>
            <div class="asin-tags">
              <el-tag
                v-for="asin in invalidAsins"
                :key="asin"
                type="danger"
                size="small"
                class="asin-tag"
              >
                {{ asin }}
              </el-tag>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleAsinDialogCancel" size="small">取消</el-button>
          <el-button @click="handleAsinDialogClear" size="small">清空</el-button>
          <el-button type="primary" @click="handleAsinDialogConfirm" size="small">
            确定（{{ validAsins.length }}个有效）
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getKeywordRankingAnalysis } from '@/api/amazon/keyword-ranking-analysis/index'
import { KeywordTaskApi, type KeywordTask } from '@/api/amazon/keywordtask'
import SummaryCard from './components/SummaryCard.vue'
import MatrixDisplay from './components/MatrixDisplay.vue'
import StatisticsCharts from './components/StatisticsCharts.vue'
import ComparisonAnalysis from './components/ComparisonAnalysis.vue'
import type { AnalysisRequest, AnalysisResponse } from './types'
import { generateMockData } from './utils/index'
import {
  RANK_TYPES,
  AGGREGATION_TYPES,
  DISPLAY_MODES,
  COMPARISON_TYPES,
  DEFAULT_CONFIG,
  VALIDATION_RULES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from './config'

// 表单引用
const queryFormRef = ref<FormInstance>()
const asinFormRef = ref<FormInstance>()

// 状态管理
const loading = ref(false)
const hasQueried = ref(false)
const analysisData = ref<AnalysisResponse | null>(null)

// 注意：关键词输入相关的状态已移除，现在从任务中选择

// 日期范围
const dateRange = ref<[string, string]>()

// 任务相关状态
const selectedTask = ref<KeywordTask | null>(null)

// 可选择的城市和关键词列表
const availableCities = ref<string[]>([])
const availableKeywords = ref<string[]>([])

// ASIN管理
const taskAsins = ref<string[]>([]) // 任务中的ASIN列表
const userAsins = ref<string[]>([]) // 用户输入的ASIN列表

// 弹窗相关状态
const showAsinDialog = ref(false)
const asinForm = reactive({
  asinText: ''
})

// 查询表单
const queryForm = reactive<AnalysisRequest>({
  city: '',
  rankType: undefined,
  keywords: [],
  taskId: undefined,
  maxPosition: DEFAULT_CONFIG.maxPosition,
  aggregationType: DEFAULT_CONFIG.aggregationType,
  displayMode: 'single', // 固定为单关键词模式
  comparisonType: DEFAULT_CONFIG.comparisonType
})

// 表单验证规则
const queryRules: FormRules = VALIDATION_RULES

// 开发模式检测
const isDevelopment = computed(() => {
  return import.meta.env.MODE === 'development' || import.meta.env.DEV
})

// ASIN弹窗计算属性
const validAsins = computed(() => {
  if (!asinForm.asinText.trim()) return []

  const lines = asinForm.asinText
    .split('\n')
    .map((line) => line.trim().toUpperCase())
    .filter((line) => line.length > 0)

  return lines.filter((asin) => /^B[0-9A-Z]{9}$/.test(asin))
})

const invalidAsins = computed(() => {
  if (!asinForm.asinText.trim()) return []

  const lines = asinForm.asinText
    .split('\n')
    .map((line) => line.trim().toUpperCase())
    .filter((line) => line.length > 0)

  return lines.filter((asin) => !/^B[0-9A-Z]{9}$/.test(asin))
})

// 初始化默认日期范围（最近7天）
const initDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6)

  dateRange.value = [start.toISOString().split('T')[0], end.toISOString().split('T')[0]]
}

// ASIN弹窗处理方法
const openAsinDialog = () => {
  // 初始化表单内容
  asinForm.asinText = userAsins.value.join('\n')
  showAsinDialog.value = true
}

const handleAsinDialogConfirm = () => {
  userAsins.value = [...new Set(validAsins.value)] // 去重
  showAsinDialog.value = false
  ElMessage.success(`成功设置 ${userAsins.value.length} 个关注ASIN`)
}

const handleAsinDialogCancel = () => {
  // 恢复到之前的状态
  asinForm.asinText = userAsins.value.join('\n')
  showAsinDialog.value = false
}

const handleAsinDialogClear = () => {
  asinForm.asinText = ''
}

// 注意：关键词手动输入相关的函数已移除，现在通过下拉选择

// 城市数据映射（从pricetask表单复制）

const cities = [
  {
    postcode: '10008',
    name: 'New York',
    city: 'newyorkcity'
  },
  {
    postcode: '10001',
    name: 'New York',
    city: 'newyorkcity'
  },
  {
    postcode: '91942',
    name: 'Lamesa',
    city: 'lamesa'
  },
  {
    postcode: '92408',
    name: 'San Bernardino',
    city: 'sanbernardino'
  },
  {
    postcode: '92551',
    name: 'Moreno Valley',
    city: 'morenovalley'
  },
  {
    postcode: '95376',
    name: 'Tracy',
    city: 'tracy'
  },
  {
    postcode: '95363',
    name: 'Patterson',
    city: 'patterson'
  },
  {
    postcode: '92374',
    name: 'Redlands',
    city: 'redlands'
  },
  {
    postcode: '95206',
    name: 'Stockton',
    city: 'stockton'
  },
  {
    postcode: '92376',
    name: 'Rialto',
    city: 'rialto'
  },
  {
    postcode: '95391',
    name: 'Tracy',
    city: 'tracy'
  },
  {
    postcode: '92518',
    name: 'March Air Reserve Base',
    city: 'marchairforcebase'
  },
  {
    postcode: '95837',
    name: 'Sacramento',
    city: 'sacramento'
  },
  {
    postcode: '90001',
    name: 'Los Angeles',
    city: 'losangeles'
  },
  {
    postcode: '90002',
    name: 'Los Angeles',
    city: 'losangeles'
  },
  {
    postcode: '60106',
    name: 'Bensenville',
    city: 'bensenville'
  },
  {
    postcode: '60433',
    name: 'Joliet',
    city: 'joliet'
  },
  {
    postcode: '60446',
    name: 'Romeoville',
    city: 'romeoville'
  },
  {
    postcode: '60449',
    name: 'Monee',
    city: 'monee'
  },
  {
    postcode: '60085',
    name: 'Waukegan',
    city: 'waukegan'
  },
  {
    postcode: '60502',
    name: 'Aurora',
    city: 'aurora'
  },
  {
    postcode: '60191',
    name: 'Wood Dale',
    city: 'wooddale'
  },
  {
    postcode: '62025',
    name: 'Edwardsville',
    city: 'edwardsville'
  },
  {
    postcode: '60601',
    name: 'Chicago',
    city: 'chicago'
  },
  {
    postcode: '85043',
    name: 'Phoenix',
    city: 'phoenix'
  },
  {
    postcode: '85338',
    name: 'Goodyear',
    city: 'goodyear'
  },
  {
    postcode: '08691',
    name: 'Robbinsville',
    city: 'robbinsville'
  },
  {
    postcode: '07001',
    name: 'Avenel',
    city: 'avenel'
  },
  {
    postcode: '07008',
    name: 'Carteret',
    city: 'carteret'
  },
  {
    postcode: '08085',
    name: 'Swedesboro',
    city: 'swedesboro'
  },
  {
    postcode: '08512',
    name: 'Cranbury',
    city: 'cranbury'
  },
  {
    postcode: '33570',
    name: 'Ruskin',
    city: 'ruskin'
  },
  {
    postcode: '33811',
    name: 'Lakeland',
    city: 'lakeland'
  },
  {
    postcode: '33182',
    name: 'Miami',
    city: 'miami'
  },
  {
    postcode: '32221',
    name: 'Jacksonville',
    city: 'jacksonville'
  },
  {
    postcode: '67337',
    name: 'Coffeyville',
    city: 'coffeyville'
  },
  {
    postcode: '66219',
    name: 'Lenexa',
    city: 'lenexa'
  },
  {
    postcode: '66021',
    name: 'Edgerton',
    city: 'edgerton'
  },
  {
    postcode: '46075',
    name: 'Whitestown',
    city: 'whitestown'
  },
  {
    postcode: '46168',
    name: 'Plainfield',
    city: 'plainfield'
  },
  {
    postcode: '46231',
    name: 'Indianapolis',
    city: 'indianapolis'
  },
  {
    postcode: '47130',
    name: 'Jeffersonville',
    city: 'jeffersonville'
  },
  {
    postcode: '40511',
    name: 'Lexington',
    city: 'lexington'
  },
  {
    postcode: '42718',
    name: 'Campbellsville',
    city: 'campbellsville'
  },
  {
    postcode: '40218',
    name: 'Louisville',
    city: 'louisville'
  },
  {
    postcode: '40165',
    name: 'Shepherdsville',
    city: 'shepherdsville'
  },
  {
    postcode: '41048',
    name: 'Hebron',
    city: 'hebron'
  },
  {
    postcode: '37416',
    name: 'Chattanooga',
    city: 'chattanooga'
  },
  {
    postcode: '37310',
    name: 'Charleston',
    city: 'charleston'
  },
  {
    postcode: '37090',
    name: 'Lebanon',
    city: 'lebanon'
  },
  {
    postcode: '37067',
    name: 'Franklin',
    city: 'franklin'
  },
  {
    postcode: '37127',
    name: 'Murfreesboro',
    city: 'murfreesboro'
  },
  {
    postcode: '37217',
    name: 'Nashville',
    city: 'nashville'
  },
  {
    postcode: '18031',
    name: 'Breinigsville',
    city: 'breinigsville'
  },
  {
    postcode: '17339',
    name: 'Lewisberry',
    city: 'lewisberry'
  },
  {
    postcode: '18202',
    name: 'Hazleton',
    city: 'hazleton'
  },
  {
    postcode: '18424',
    name: 'Gouldsboro',
    city: 'gouldsboro'
  },
  {
    postcode: '17112',
    name: 'Harrisburg',
    city: 'harrisburg'
  },
  {
    postcode: '15205',
    name: 'Pittsburgh',
    city: 'pittsburgh'
  },
  {
    postcode: '18512',
    name: 'Scranton',
    city: 'scranton'
  },
  {
    postcode: '18643',
    name: 'Pittston',
    city: 'pittston'
  },
  {
    postcode: '17013',
    name: 'Carlisle',
    city: 'carlisle'
  },
  {
    postcode: '19720',
    name: 'New Castle',
    city: 'newcastle'
  },
  {
    postcode: '19709',
    name: 'Middletown',
    city: 'middletown'
  },
  {
    postcode: '75019',
    name: 'Coppell',
    city: 'coppell'
  },
  {
    postcode: '78154',
    name: 'Schertz',
    city: 'schertz'
  },
  {
    postcode: '76177',
    name: 'Fort Worth',
    city: 'fortworth'
  },
  {
    postcode: '75261',
    name: 'Dallas',
    city: 'dallas'
  },
  {
    postcode: '77338',
    name: 'Humble',
    city: 'humble'
  },
  {
    postcode: '76155',
    name: 'Fort Worth',
    city: 'fortworth'
  },
  {
    postcode: '75241',
    name: 'Dallas',
    city: 'dallas'
  },
  {
    postcode: '77001',
    name: 'Houston',
    city: 'houston'
  },
  {
    postcode: '77003',
    name: 'Houston',
    city: 'houston'
  },
  {
    postcode: '77038',
    name: 'Houston',
    city: 'houston'
  },
  {
    postcode: '29172',
    name: 'West Columbia',
    city: 'westcolumbia'
  },
  {
    postcode: '29303',
    name: 'Spartanburg',
    city: 'spartanburg'
  },
  {
    postcode: '89408',
    name: 'Fernley',
    city: 'fernley'
  },
  {
    postcode: '89030',
    name: 'North Las Vegas',
    city: 'northlasvegas'
  },
  {
    postcode: '23803',
    name: 'Petersburg',
    city: 'petersburg'
  },
  {
    postcode: '23836',
    name: 'Chester',
    city: 'chester'
  },
  {
    postcode: '98390',
    name: 'Sumner',
    city: 'sumner'
  },
  {
    postcode: '98327',
    name: 'Dupont',
    city: 'dupont'
  },
  {
    postcode: '98032',
    name: 'Kent',
    city: 'kent'
  },
  {
    postcode: '98144',
    name: 'Seattle',
    city: 'seattle'
  },
  {
    postcode: '98005',
    name: 'Bellevue',
    city: 'bellevue'
  },
  {
    postcode: '53144',
    name: 'Kenosha',
    city: 'kenosha'
  },
  {
    postcode: '30344',
    name: 'Atlanta',
    city: 'atlanta'
  },
  {
    postcode: '30549',
    name: 'Jeffersonville',
    city: 'jeffersonville'
  },
  {
    postcode: '02720',
    name: 'Fall River',
    city: 'fallriver'
  },
  {
    postcode: '28214',
    name: 'Charlotte',
    city: 'charlotte'
  },
  {
    postcode: '55379',
    name: 'Shakopee',
    city: 'shakopee'
  },
  {
    postcode: '41018',
    name: 'Erlanger',
    city: 'erlanger'
  },
  {
    postcode: '48150',
    name: 'Livonia',
    city: 'livonia'
  },
  {
    postcode: '66102',
    name: 'Kansas City',
    city: 'kansascity'
  },
  {
    postcode: '89506',
    name: 'Reno',
    city: 'reno'
  },
  {
    postcode: '21224',
    name: 'Baltimore',
    city: 'baltimore'
  },
  {
    postcode: '43125',
    name: 'Groveport',
    city: 'groveport'
  },
  {
    postcode: '20012',
    name: 'Washington',
    city: 'washington'
  },
  {
    postcode: '08518',
    name: 'Florence',
    city: 'florence'
  },
  {
    postcode: '06095',
    name: 'Windsor',
    city: 'windsor'
  },
  {
    postcode: '17015',
    name: 'Carlisle',
    city: 'carlisle'
  },
  {
    postcode: '03063',
    name: 'Nashua',
    city: 'nashua'
  },
  {
    postcode: '20001',
    name: 'Washington',
    city: 'washington'
  }
]

// 城市邮编转换函数 - 转换为city属性
const getCityByPostcode = (postcode: string): string => {
  const city = cities.find((c) => c.postcode === postcode)
  return city ? city.city : postcode
}

// 查询分析
const handleQuery = async () => {
  if (!queryFormRef.value) return

  try {
    await queryFormRef.value.validate()

    loading.value = true
    hasQueried.value = true

    // 构建请求参数 - 将邮编转换为城市标识符
    const cityIdentifier = getCityByPostcode(queryForm.city)
    const params: AnalysisRequest = {
      ...queryForm,
      city: cityIdentifier, // 使用转换后的城市标识符
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    }

    const response = await getKeywordRankingAnalysis(params)
    analysisData.value = response.data || response

    ElMessage.success(SUCCESS_MESSAGES.querySuccess)
  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error(ERROR_MESSAGES.serverError)
  } finally {
    loading.value = false
  }
}

// 加载模拟数据（开发模式）
const loadMockData = () => {
  try {
    loading.value = true
    hasQueried.value = true

    // 设置表单数据
    queryForm.city = 'New York'
    queryForm.rankType = 1
    queryForm.keywords = ['wireless earbuds', 'bluetooth headphones', 'noise cancelling']

    // 生成模拟数据
    setTimeout(() => {
      analysisData.value = generateMockData() as AnalysisResponse
      loading.value = false
      ElMessage.success(SUCCESS_MESSAGES.loadMockSuccess)
    }, 1000)
  } catch (error) {
    loading.value = false
    ElMessage.error('加载测试数据失败')
  }
}

// 注意：任务列表加载函数已移除，直接从URL获取taskId

// 处理任务选择变化
const handleTaskChange = async (taskId: number | null) => {
  if (!taskId) {
    selectedTask.value = null
    availableCities.value = []
    availableKeywords.value = []
    queryForm.city = ''
    queryForm.keywords = []
    return
  }

  try {
    // 获取任务详情
    const response = await KeywordTaskApi.getKeywordTask(taskId)

    // 修复API响应结构问题
    selectedTask.value = response.data || response

    // 解析并设置可选择的城市和关键词
    if (selectedTask.value) {
      // 解析城市信息
      let cities = selectedTask.value.cities
      if (typeof cities === 'string') {
        try {
          cities = JSON.parse(cities)
        } catch (e) {
          cities = [cities] // 如果解析失败，当作字符串处理
        }
      }

      if (Array.isArray(cities) && cities.length > 0) {
        availableCities.value = [...cities]
        // 默认选择第一个城市
        queryForm.city = cities[0]
      } else {
        availableCities.value = []
        queryForm.city = ''
      }

      // 解析关键词信息
      let keywords = selectedTask.value.keywords
      if (typeof keywords === 'string') {
        try {
          keywords = JSON.parse(keywords)
        } catch (e) {
          keywords = [keywords] // 如果解析失败，当作字符串处理
        }
      }

      if (Array.isArray(keywords) && keywords.length > 0) {
        availableKeywords.value = [...keywords]
        // 默认选择所有关键词
        queryForm.keywords = [...keywords]
      } else {
        availableKeywords.value = []
        queryForm.keywords = []
      }

      // 解析ASIN信息
      let asins = selectedTask.value.asins
      if (typeof asins === 'string') {
        try {
          asins = JSON.parse(asins)
        } catch (e) {
          // 如果解析失败，尝试按行分割
          asins = asins.split('\n').filter((item) => item.trim())
        }
      }

      if (Array.isArray(asins) && asins.length > 0) {
        // 验证和格式化ASIN
        const validAsins = asins
          .map((asin) => asin.trim().toUpperCase())
          .filter((asin) => /^B[0-9A-Z]{9}$/.test(asin))
        taskAsins.value = [...new Set(validAsins)] // 去重
      } else {
        taskAsins.value = []
      }

      // 强制更新UI
      await nextTick()
    }
  } catch (error) {
    console.error('获取任务详情失败:', error)
    ElMessage.error('获取任务详情失败')
  }
}

// 重置表单
const handleReset = () => {
  queryFormRef.value?.resetFields()
  queryForm.keywords = []
  queryForm.maxPosition = DEFAULT_CONFIG.maxPosition
  queryForm.aggregationType = DEFAULT_CONFIG.aggregationType
  queryForm.displayMode = DEFAULT_CONFIG.displayMode
  queryForm.comparisonType = DEFAULT_CONFIG.comparisonType
  queryForm.taskId = undefined

  selectedTask.value = null
  taskAsins.value = []
  userAsins.value = []
  asinForm.asinText = ''
  initDateRange()
  analysisData.value = null
  hasQueried.value = false

  ElMessage.success(SUCCESS_MESSAGES.resetSuccess)
}

// 获取路由参数
const route = useRoute()

// 初始化页面数据
const initPageData = async () => {
  initDateRange()

  // 检查URL参数中是否有taskId
  const taskIdFromUrl = route.query.taskId
  if (taskIdFromUrl) {
    const taskId = Number(taskIdFromUrl)
    if (!isNaN(taskId)) {
      // 设置表单中的taskId
      queryForm.taskId = taskId

      // 直接加载任务详情
      await handleTaskChange(taskId)
    }
  }
}

// 初始化
onMounted(() => {
  initPageData()
})
</script>

<style scoped lang="scss">
@use './styles/index.scss';

.keyword-analysis {
  padding: 10px 8px;
  max-width: 1400px;
  margin: 0 auto;

  .search-form {
    .search-form-content {
      padding: 16px 12px;

      :deep(.el-form-item) {
        margin-bottom: 16px;
      }

      :deep(.el-form-item__label) {
        font-size: 13px;
        font-weight: 500;
        padding-right: 8px;
      }

      :deep(.el-input__wrapper),
      :deep(.el-select__wrapper) {
        box-shadow: 0 0 0 1px #dcdfe6;
        transition: box-shadow 0.2s ease;

        &:hover {
          box-shadow: 0 0 0 1px #c0c4cc;
        }

        &.is-focus {
          box-shadow: 0 0 0 1px #409eff;
        }
      }

      .compact-row {
        margin-top: 8px;

        :deep(.el-form-item) {
          margin-bottom: 12px;
        }
      }

      .button-group {
        :deep(.el-form-item__content) {
          display: flex;
          gap: 8px;
          align-items: center;
        }
      }

      .keywords-input {
        min-height: 60px;

        .el-tag {
          margin-right: 8px;
          margin-bottom: 8px;
        }
      }
    }
  }
}

// ASIN弹窗样式
:deep(.el-dialog) {
  .asin-input-tips {
    margin-bottom: 16px;
  }

  .valid-asins-preview,
  .invalid-asins-preview {
    margin-top: 12px;
    padding: 12px;
    border-radius: 6px;
    background-color: #f8f9fa;

    .preview-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #409eff;

      &.error {
        color: #f56c6c;
      }
    }

    .asin-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .asin-tag {
        font-family: monospace;
        font-size: 11px;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
