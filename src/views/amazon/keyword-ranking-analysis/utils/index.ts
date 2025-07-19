// ASIN颜色映射工具函数

// ASIN颜色数组
export const ASIN_COLOR_PALETTE = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399',
  '#9C27B0',
  '#FF9800',
  '#4CAF50',
  '#2196F3',
  '#FF5722',
  '#795548',
  '#607D8B',
  '#FFC107',
  '#8BC34A',
  '#00BCD4',
  '#E91E63',
  '#673AB7',
  '#3F51B5',
  '#009688',
  '#8BC34A'
]

/**
 * 根据ASIN字符串和分类生成颜色
 * @param asin ASIN字符串
 * @param taskAsins 任务中的ASIN列表
 * @param userAsins 用户输入的ASIN列表
 * @returns 颜色值
 */
export const getAsinColor = (asin: string, taskAsins: string[] = [], userAsins: string[] = []): string => {
  if (!asin || asin === '-') return '#f0f0f0'

  // 紫色：用户输入的ASIN（优先级最高）
  if (userAsins.includes(asin)) {
    return '#9C27B0'
  }

  // 橙色：任务中的ASIN
  if (taskAsins.includes(asin)) {
    return '#FF9800'
  }

  // 灰色：默认颜色
  return '#f0f0f0'
}

/**
 * 根据背景色计算文字颜色
 * @param backgroundColor 背景色
 * @returns 文字颜色
 */
export const getTextColor = (backgroundColor: string): string => {
  if (!backgroundColor || backgroundColor === '#f0f0f0') return '#666'

  const hex = backgroundColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

/**
 * 格式化ASIN显示
 * @param asin ASIN字符串
 * @param maxLength 最大显示长度
 * @returns 格式化后的ASIN
 */
export const formatAsin = (asin: string, maxLength: number = 8): string => {
  if (!asin || asin === '-') return '-'
  return asin.length > maxLength ? `${asin.substring(0, maxLength - 3)}...` : asin
}

/**
 * 格式化位置编码
 * @param pageNumber 页码
 * @param positionInPage 页内位置
 * @returns 位置编码 P1-01
 */
export const formatPositionCode = (pageNumber: number, positionInPage: number): string => {
  return `P${pageNumber}-${String(positionInPage).padStart(2, '0')}`
}

/**
 * 获取覆盖率颜色
 * @param rate 覆盖率
 * @returns 颜色值
 */
export const getCoverageColor = (rate: number): string => {
  if (rate >= 80) return '#67C23A'
  if (rate >= 60) return '#E6A23C'
  if (rate >= 40) return '#F56C6C'
  return '#909399'
}

/**
 * 获取覆盖率等级
 * @param rate 覆盖率
 * @returns 等级文本
 */
export const getCoverageLevel = (rate: number): string => {
  if (rate >= 80) return '优秀'
  if (rate >= 60) return '良好'
  if (rate >= 40) return '一般'
  return '较差'
}

/**
 * 获取覆盖率标签类型
 * @param rate 覆盖率
 * @returns Element Plus 标签类型
 */
export const getCoverageTagType = (rate: number): 'success' | 'warning' | 'danger' | 'info' => {
  if (rate >= 80) return 'success'
  if (rate >= 60) return 'warning'
  if (rate >= 40) return 'danger'
  return 'info'
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间
 * @returns 防抖后的函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 导出数据为CSV格式
 * @param data 数据数组
 * @param filename 文件名
 */
export const exportToCSV = (data: any[], filename: string = 'export.csv') => {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) => headers.map((header) => `"${row[header] || ''}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * 生成模拟数据（用于开发测试）
 */
export const generateMockData = () => {
  const mockAsins = ['B08N5WRWNW', 'B07XJ8C8F5', 'B09KMVJZ3M', 'B08HLZD9XR', 'B07ZPKN6YR']
  const mockKeywords = ['wireless earbuds', 'bluetooth headphones', 'noise cancelling']
  const mockDates = ['2025-01-13', '2025-01-14', '2025-01-15', '2025-01-16', '2025-01-17']

  return {
    summary: {
      dateRange: mockDates,
      totalDays: 5,
      totalPositions: 50,
      keywords: mockKeywords,
      city: 'New York',
      rankType: 1
    },
    matrix: {
      headers: ['位置', ...mockDates],
      keywordMatrices: mockKeywords.reduce((acc, keyword) => {
        acc[keyword] = {
          keyword,
          rows: Array.from({ length: 50 }, (_, i) => ({
            position: formatPositionCode(Math.floor(i / 10) + 1, (i % 10) + 1),
            positionCode: `${Math.floor(i / 10) + 1}-${(i % 10) + 1}`,
            pageNumber: Math.floor(i / 10) + 1,
            positionInPage: (i % 10) + 1,
            data: mockDates.map(() =>
              Math.random() > 0.7 ? mockAsins[Math.floor(Math.random() * mockAsins.length)] : '-'
            )
          }))
        }
        return acc
      }, {} as any)
    },
    statistics: {
      asinFrequency: mockAsins.reduce((acc, asin) => {
        acc[asin] = Math.floor(Math.random() * 20) + 5
        return acc
      }, {} as any),
      positionStability: Array.from({ length: 20 }, (_, i) => [
        `P${Math.floor(i / 10) + 1}-${String((i % 10) + 1).padStart(2, '0')}`,
        Math.random() * 100
      ]).reduce((acc, [pos, score]) => {
        acc[pos as string] = score as number
        return acc
      }, {} as any),
      keywordCoverage: mockKeywords.reduce((acc, keyword) => {
        const covered = Math.floor(Math.random() * 30) + 10
        acc[keyword] = {
          keyword,
          coveredPositions: covered,
          totalPositions: 50,
          coverageRate: (covered / 50) * 100
        }
        return acc
      }, {} as any)
    }
  }
}
