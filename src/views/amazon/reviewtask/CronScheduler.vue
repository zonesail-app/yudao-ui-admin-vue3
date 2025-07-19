<template>
  <el-dialog v-model="dialogVisible" title="定时任务设置" width="600px" :before-close="handleClose">
    <div class="cron-scheduler">
      <div class="scheduler-header">
        <p class="scheduler-desc">选择执行时间，系统将自动生成定时任务</p>
      </div>

      <!-- 模式选择 -->
      <div class="mode-tabs">
        <el-radio-group v-model="currentMode" class="mode-selector">
          <el-radio-button value="template">
            <el-icon><Clock /></el-icon>
            快速模板
          </el-radio-button>
          <el-radio-button value="custom">
            <el-icon><Calendar /></el-icon>
            自定义时间
          </el-radio-button>
          <el-radio-button value="advanced">
            <el-icon><Setting /></el-icon>
            高级模式
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 快速模板模式 -->
      <div v-if="currentMode === 'template'" class="mode-content">
        <h3 class="section-title">选择常用时间模板</h3>
        <div class="template-list">
          <div
            v-for="template in templates"
            :key="template.id"
            @click="currentTemplate = template.id"
            :class="['template-card', { 'template-selected': currentTemplate === template.id }]"
          >
            <div class="template-info">
              <h4 class="template-name">{{ template.name }}</h4>
              <p class="template-desc">{{ template.desc }}</p>
            </div>
            <el-tag size="small" type="info">{{ template.cron }}</el-tag>
          </div>
        </div>
      </div>

      <!-- 自定义时间模式 -->
      <div v-if="currentMode === 'custom'" class="mode-content">
        <h3 class="section-title">自定义执行时间</h3>
        <div class="custom-section">
          <div class="time-section">
            <label class="field-label">执行时间</label>
            <div class="time-controls">
              <div v-for="(time, index) in customTimes" :key="index" class="time-row">
                <el-time-picker
                  v-model="customTimes[index]"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="选择时间"
                  style="width: 120px"
                  @change="(newTime: string) => handleTimeChange(index, newTime)"
                />
                <el-button
                  v-if="customTimes.length > 1"
                  @click="removeTime(index)"
                  type="danger"
                  size="small"
                  text
                >
                  删除
                </el-button>
              </div>
              <el-button @click="addTime" type="primary" size="small" text>
                + 添加时间点
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 高级模式 -->
      <div v-if="currentMode === 'advanced'" class="mode-content">
        <h3 class="section-title">高级 Cron 表达式</h3>
        <div class="advanced-section">
          <el-input v-model="advancedCron" placeholder="0 9 * * *" class="cron-input" />
          <p class="cron-help"> 格式：分钟(0-59) 小时(0-23) 日(1-31) 月(1-12) 周(0-7) </p>
        </div>
      </div>

      <!-- 预览区域 -->
      <div class="preview-section">
        <h4 class="preview-title">生成的 Cron 表达式：</h4>
        <div class="preview-content">
          <el-tag v-if="generatedCron" type="success" size="large">{{ generatedCron }}</el-tag>
          <span v-else class="preview-empty">请先选择时间设置</span>
        </div>
        <p v-if="generatedCron" class="preview-desc">
          {{ getCronDescription(generatedCron) }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!generatedCron">
          <el-icon><Check /></el-icon>
          确认设置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Clock, Calendar, Setting, Check } from '@element-plus/icons-vue'

defineOptions({ name: 'CronScheduler' })

const emit = defineEmits<{
  confirm: [cron: string]
}>()

const handleTimeChange = (index: number, newTime: string) => {
  if (!newTime) return
  const [hour, minute] = newTime.split(':')
  let h = parseInt(hour, 10)
  let m = parseInt(minute, 10)

  m = Math.round(m / 10) * 10

  if (m === 60) {
    m = 0
    h = (h + 1) % 24
  }

  customTimes.value[index] = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// 组件状态
const dialogVisible = ref(false)
const currentMode = ref('template')
const currentTemplate = ref('')
const customTimes = ref(['09:00'])
const advancedCron = ref('')

// 快速模板配置
const templates = [
  {
    id: 'daily-morning',
    name: '每天早上 9:00',
    cron: '0 9 * * *',
    desc: '适合日报、备份等'
  },
  {
    id: 'every-2hours',
    name: '每2小时执行一次',
    cron: '0 */2 * * *',
    desc: '频繁监控'
  }
]

// 计算生成的cron表达式
const generatedCron = computed(() => {
  if (currentMode.value === 'template' && currentTemplate.value) {
    const template = templates.find((t) => t.id === currentTemplate.value)
    return template?.cron || ''
  }
  if (currentMode.value === 'custom') {
    return generateCustomCron()
  }
  if (currentMode.value === 'advanced') {
    return advancedCron.value
  }
  return ''
})

// 生成自定义cron表达式
const generateCustomCron = () => {
  if (customTimes.value.length === 0) return ''

  const times = customTimes.value.map((time) => {
    const [hour, minute] = time.split(':')
    return { hour: parseInt(hour), minute: parseInt(minute) }
  })

  const minutes = [...new Set(times.map((t) => t.minute))]
  const hours = [...new Set(times.map((t) => t.hour))]

  return `${minutes.join(',')} ${hours.join(',')} * * *`
}

// 获取cron表达式描述
const getCronDescription = (cron: string) => {
  const templateMatch = templates.find((t) => t.cron === cron)
  if (templateMatch) {
    return templateMatch.name
  }

  // 简单的cron描述逻辑
  if (cron === '0 */2 * * *') return '每2小时执行一次'
  if (cron === '0 9 * * *') return '每天早上9:00执行'
  return '自定义时间执行'
}

// 时间管理方法
const addTime = () => {
  customTimes.value.push('12:00')
}

const removeTime = (index: number) => {
  customTimes.value.splice(index, 1)
}

// 对话框方法
const open = (existingCron = '') => {
  dialogVisible.value = true

  // 如果有现有的cron表达式，尝试解析并设置模式
  if (existingCron) {
    const matchedTemplate = templates.find((t) => t.cron === existingCron)
    if (matchedTemplate) {
      currentMode.value = 'template'
      currentTemplate.value = matchedTemplate.id
    } else {
      currentMode.value = 'advanced'
      advancedCron.value = existingCron
    }
  } else {
    // 重置状态
    reset()
  }
}

const reset = () => {
  currentMode.value = 'template'
  currentTemplate.value = ''
  customTimes.value = ['09:00']
  advancedCron.value = ''
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleConfirm = () => {
  if (generatedCron.value) {
    emit('confirm', generatedCron.value)
    dialogVisible.value = false
  }
}

defineExpose({
  open
})
</script>

<style scoped>
.cron-scheduler {
  padding: 8px 0;
}

.scheduler-header {
  margin-bottom: 24px;
}

.scheduler-desc {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.mode-tabs {
  margin-bottom: 24px;
}

.mode-selector {
  width: 100%;
}

.mode-selector .el-radio-button__inner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
}

.mode-content {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 16px 0;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fff;
}

.template-card:hover {
  border-color: #c0c4cc;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.template-selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.template-info {
  flex: 1;
}

.template-name {
  font-weight: 500;
  color: #303133;
  margin: 0 0 4px 0;
  font-size: 14px;
}

.template-desc {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.custom-section {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.time-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-label {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.time-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.advanced-section {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.cron-input {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.cron-help {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #909399;
}

.preview-section {
  background-color: #f0f2f5;
  padding: 16px;
  border-radius: 8px;
}

.preview-title {
  font-weight: 500;
  color: #303133;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.preview-content {
  margin-bottom: 8px;
}

.preview-empty {
  color: #c0c4cc;
  font-style: italic;
}

.preview-desc {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
