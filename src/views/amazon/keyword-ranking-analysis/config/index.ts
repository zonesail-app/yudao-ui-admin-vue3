// Amazon关键词排名分析配置文件

// 排名类型配置
export const RANK_TYPES = [
  { label: '广告位', value: 1 },
  { label: '自然位', value: 2 }
] as const

// 聚合方式配置
export const AGGREGATION_TYPES = [
  { label: '最新数据', value: 'latest' },
  { label: '最早数据', value: 'first' },
  { label: '所有数据', value: 'all' }
] as const

// 显示模式配置
export const DISPLAY_MODES = [
  { label: '单关键词', value: 'single' },
  { label: '对比分析', value: 'comparison' }
] as const

// 对比类型配置
export const COMPARISON_TYPES = [
  { label: '位置对比', value: 'position' },
  { label: 'ASIN对比', value: 'asin' },
  { label: '覆盖度对比', value: 'coverage' }
] as const

// 默认配置
export const DEFAULT_CONFIG = {
  maxPosition: 50,
  maxKeywords: 5,
  defaultDateRange: 7, // 默认7天
  aggregationType: 'latest',
  displayMode: 'single',
  comparisonType: 'position'
} as const

// 表格配置
export const TABLE_CONFIG = {
  positionColumnWidth: 80,
  dateColumnWidth: 120,
  compactDateColumnWidth: 100,
  maxHeight: 600,
  compactMaxHeight: 400
} as const

// 图表配置
export const CHART_CONFIG = {
  defaultHeight: 300,
  compactHeight: 250,
  mobileHeight: 200,
  colors: {
    primary: '#409EFF',
    success: '#67C23A',
    warning: '#E6A23C',
    danger: '#F56C6C',
    info: '#909399'
  }
} as const

// 覆盖率等级配置
export const COVERAGE_LEVELS = [
  { min: 80, max: 100, level: '优秀', type: 'success', color: '#67C23A' },
  { min: 60, max: 79, level: '良好', type: 'warning', color: '#E6A23C' },
  { min: 40, max: 59, level: '一般', type: 'danger', color: '#F56C6C' },
  { min: 0, max: 39, level: '较差', type: 'info', color: '#909399' }
] as const

// 综合评级配置
export const OVERALL_RATINGS = [
  { min: 90, max: 100, rating: 'S', type: 'success' },
  { min: 80, max: 89, rating: 'A', type: 'primary' },
  { min: 70, max: 79, rating: 'B', type: 'warning' },
  { min: 60, max: 69, rating: 'C', type: 'danger' },
  { min: 0, max: 59, rating: 'D', type: 'info' }
] as const

// 验证规则配置
export const VALIDATION_RULES = {
  city: [{ required: true, message: '请选择城市', trigger: 'change' }],
  keywords: [
    {
      required: true,
      type: 'array',
      min: 1,
      message: '请至少选择一个关键词',
      trigger: 'change'
    }
  ],
  maxPosition: [
    { type: 'number', min: 1, max: 200, message: '位置数必须在 1 到 200 之间', trigger: 'blur' }
  ]
}

// API配置
export const API_CONFIG = {
  timeout: 30000, // 30秒超时
  retryTimes: 3, // 重试3次
  retryDelay: 1000 // 重试延迟1秒
} as const

// 缓存配置
export const CACHE_CONFIG = {
  queryResultTTL: 5 * 60 * 1000, // 查询结果缓存5分钟
  colorMapTTL: 24 * 60 * 60 * 1000, // 颜色映射缓存24小时
  keyPrefix: 'keyword-analysis-'
} as const

// 导出配置
export const EXPORT_CONFIG = {
  csvSeparator: ',',
  csvEncoding: 'utf-8-bom',
  maxExportRows: 10000,
  supportedFormats: ['csv', 'xlsx'] as const
} as const

// 响应式断点配置
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  large: 1200
} as const

// 动画配置
export const ANIMATION_CONFIG = {
  duration: 300,
  easing: 'ease-out',
  delay: 0
} as const

// 错误消息配置
export const ERROR_MESSAGES = {
  networkError: '网络连接失败，请检查网络后重试',
  serverError: '服务器错误，请稍后重试',
  paramError: '参数错误，请检查输入内容',
  timeoutError: '请求超时，请稍后重试',
  unknownError: '未知错误，请联系技术支持'
} as const

// 成功消息配置
export const SUCCESS_MESSAGES = {
  querySuccess: '查询成功',
  exportSuccess: '导出成功',
  resetSuccess: '重置成功',
  loadMockSuccess: '测试数据加载成功'
} as const
