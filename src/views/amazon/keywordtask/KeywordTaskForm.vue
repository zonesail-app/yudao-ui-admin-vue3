<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="任务名称" prop="taskName" for="taskName">
        <el-input id="taskName" v-model="formData.taskName" placeholder="请输入任务名称" />
      </el-form-item>
      <el-form-item label="关键词列表" prop="keywords" for="keywords">
        <el-input
          id="keywords"
          v-model="formData.keywords"
          type="textarea"
          placeholder="请输入关键词列表"
        />
      </el-form-item>
      <el-form-item label="城市列表" prop="cities" for="cities">
        <el-select
          id="cities"
          v-model="formData.cities"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择城市"
          style="width: 100%"
          :filter-method="handleCityFilter"
          @visible-change="handleCityFilter('')"
        >
          <template #header>
            <el-checkbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminate"
              @change="handleSelectAllChange"
            >
              全选
            </el-checkbox>
          </template>
          <el-option
            v-for="city in cityOptions"
            :key="city.postcode"
            :label="`${city.name} (${city.postcode})`"
            :value="city.postcode"
          >
            <span style="float: left">{{ city.name }}</span>
            <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
              {{ city.postcode }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="ASIN列表" prop="asins" for="asins">
        <el-input
          id="asins"
          v-model="formData.asins"
          type="textarea"
          placeholder="请输入ASIN列表"
        />
      </el-form-item>

      <el-form-item label="任务类型" prop="taskType" for="taskType">
        <el-radio-group id="taskType" v-model="formData.taskType">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.AMAZON_TASK_TYPE_ENUM)"
            :key="dict.value + dict.label"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <template v-if="isScheduledTask">
        <el-form-item label="Cron表达式" prop="cronTab">
          <div class="cron-input-group">
            <el-input
              v-model="formData.cronTab"
              placeholder="请设置定时任务执行时间"
              readonly
              class="cron-display-input"
            />
            <el-button type="primary" @click="openCronDialog">
              <el-icon><Setting /></el-icon>
              设置
            </el-button>
          </div>
          <div v-if="formData.cronTab" class="cron-description">
            {{ getCronDescription(formData.cronTab) }}
          </div>
        </el-form-item>

        <el-form-item label="开始时间" prop="startTime" for="startTime">
          <el-date-picker
            id="startTime"
            v-model="formData.startTime"
            type="date"
            placeholder="请选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD 00:00:00"
            :shortcuts="shortcuts"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="结束时间" prop="endTime" for="endTime">
          <el-date-picker
            id="endTime"
            v-model="formData.endTime"
            type="date"
            placeholder="请选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD 23:59:59"
            :shortcuts="shortcuts"
            style="width: 100%"
          />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>

  <!-- Cron设置弹窗 -->
  <CronScheduler ref="cronSchedulerRef" @confirm="handleCronConfirm" />
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { KeywordTaskApi, KeywordTask } from '@/api/amazon/keywordtask'
import { Setting } from '@element-plus/icons-vue'
import CronScheduler from './CronScheduler.vue'

/** 关键词排名任务 表单 */
defineOptions({ name: 'KeywordTaskForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  taskName: undefined,
  keywords: '',
  cities: [],
  asins: '',
  cronTab: undefined,
  taskType: undefined,
  shared: undefined,
  description: undefined,
  startTime: undefined,
  endTime: undefined
})
const formRules = reactive({
  taskName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  keywords: [{ required: true, message: '关键词列表不能为空', trigger: 'blur' }],
  cities: [{ required: true, message: '城市列表不能为空', trigger: 'change' }],
  taskType: [{ required: true, message: '任务类型不能为空', trigger: 'blur' }],
  cronTab: [
    {
      required: true,
      message: 'Cron表达式不能为空',
      trigger: 'blur',
      validator: (rule: any, value: any, callback: any) => {
        if (isScheduledTask.value && !value) {
          callback(new Error('Cron表达式不能为空'))
        } else {
          callback()
        }
      }
    }
  ],
  startTime: [
    {
      required: true,
      message: '开始时间不能为空',
      trigger: 'blur',
      validator: (rule: any, value: any, callback: any) => {
        if (isScheduledTask.value && !value) {
          callback(new Error('开始时间不能为空'))
        } else {
          callback()
        }
      }
    }
  ],
  endTime: [
    {
      required: true,
      message: '结束时间不能为空',
      trigger: 'blur',
      validator: (rule: any, value: any, callback: any) => {
        if (isScheduledTask.value && !value) {
          callback(new Error('结束时间不能为空'))
        } else if (
          isScheduledTask.value &&
          value &&
          formData.value.startTime &&
          value <= formData.value.startTime
        ) {
          callback(new Error('结束时间必须大于开始时间'))
        } else {
          callback()
        }
      }
    }
  ]
})
const formRef = ref() // 表单 Ref
const cronSchedulerRef = ref() // Cron设置弹窗 Ref

// 计算属性：判断是否为定时任务
// 这里假设定时任务的taskType值，您可能需要根据实际字典值调整
const isScheduledTask = computed(() => {
  // 获取定时任务类型的字典选项
  const taskTypeOptions = getIntDictOptions(DICT_TYPE.AMAZON_TASK_TYPE_ENUM)
  // 查找标签包含"定时"的选项
  const scheduledTaskOption = taskTypeOptions.find(
    (option) => option.label.includes('定时') || option.label.includes('定时任务')
  )
  // 如果找到了定时任务选项，判断当前选择的任务类型是否为定时任务
  return scheduledTaskOption && formData.value.taskType === scheduledTaskOption.value
})

// Cron表达式相关方法
const openCronDialog = () => {
  cronSchedulerRef.value?.open(formData.value.cronTab)
}

const handleCronConfirm = (cron: string) => {
  formData.value.cronTab = cron
}

const getCronDescription = (cron: string) => {
  if (cron === '0 9 * * *') return '每天早上9:00执行'
  if (cron === '0 */2 * * *') return '每2小时执行一次'
  return '自定义时间执行'
}

const shortcuts = [
  {
    text: '今天',
    value: new Date()
  },
  {
    text: '7天后',
    value: () => {
      const date = new Date()
      date.setTime(date.getTime() + 3600 * 1000 * 24 * 7)
      return date
    }
  },
  {
    text: '15天后',
    value: () => {
      const date = new Date()
      date.setTime(date.getTime() + 3600 * 1000 * 24 * 15)
      return date
    }
  },
  {
    text: '30天后',
    value: () => {
      const date = new Date()
      date.setTime(date.getTime() + 3600 * 1000 * 24 * 30)
      return date
    }
  }
]

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const res = await KeywordTaskApi.getKeywordTask(id)
      // 布尔值转成数字
      res.shared = Number(res.shared)
      res.taskType = Number(res.taskType)
      // 数组转字符串
      if (Array.isArray(res.keywords)) {
        res.keywords = res.keywords.join('\n')
      }
      if (Array.isArray(res.asins)) {
        res.asins = res.asins.join('\n')
      }
      // 确保时间字段正确设置
      if (res.startTime) {
        res.startTime = res.startTime
      }
      if (res.endTime) {
        res.endTime = res.endTime
      }

      formData.value = res
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = { ...formData.value }
    // 字符串转数组
    if (data.keywords && typeof data.keywords === 'string') {
      data.keywords = data.keywords.split('\n').filter((item) => item.trim() !== '')
    }
    if (data.asins && typeof data.asins === 'string') {
      data.asins = data.asins.split('\n').filter((item) => item.trim() !== '')
    }
    if (formType.value === 'create') {
      await KeywordTaskApi.createKeywordTask(data as unknown as KeywordTask)
      message.success(t('common.createSuccess'))
    } else {
      await KeywordTaskApi.updateKeywordTask(data as unknown as KeywordTask)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    taskName: undefined,
    keywords: '',
    cities: [],
    asins: '',
    cronTab: undefined,
    taskType: undefined,
    shared: undefined,
    description: undefined,
    startTime: undefined,
    endTime: undefined
  }

  formRef.value?.resetFields()
}

const allCityPostcodes = computed(() => cities.map((item) => item.postcode))
const isAllSelected = computed(
  () => formData.value.cities.length === cities.length && cities.length > 0
)
const isIndeterminate = computed(
  () => formData.value.cities.length > 0 && formData.value.cities.length < cities.length
)

const handleSelectAllChange = (val: boolean) => {
  formData.value.cities = val ? allCityPostcodes.value : []
}

const cities = [
  {
    postcode: '10008',
    name: 'New york'
  },
  {
    postcode: '10001',
    name: 'New York'
  },
  {
    postcode: '91942',
    name: 'La Mesa'
  },
  {
    postcode: '92408',
    name: 'San Bernardino'
  },
  {
    postcode: '92551',
    name: 'Moreno Valley'
  },
  {
    postcode: '95376',
    name: 'Tracy'
  },
  {
    postcode: '95363',
    name: 'Patterson'
  },
  {
    postcode: '92374',
    name: 'Redlands'
  },
  {
    postcode: '95206',
    name: 'Stockton'
  },
  {
    postcode: '92376',
    name: 'Rialto'
  },
  {
    postcode: '95391',
    name: 'Tracy'
  },
  {
    postcode: '92518',
    name: 'March Air Reserve Base'
  },
  {
    postcode: '95837',
    name: 'Sacramento'
  },
  {
    postcode: '90001',
    name: 'Los Angeles'
  },
  {
    postcode: '90002',
    name: 'Los Angeles'
  },
  {
    postcode: '60106',
    name: 'Bensenville'
  },
  {
    postcode: '60433',
    name: 'Joliet'
  },
  {
    postcode: '60446',
    name: 'Romeoville'
  },
  {
    postcode: '60449',
    name: 'Monee'
  },
  {
    postcode: '60085',
    name: 'Waukegan'
  },
  {
    postcode: '60502',
    name: 'Aurora'
  },
  {
    postcode: '60191',
    name: 'Wood Dale'
  },
  {
    postcode: '62025',
    name: 'Edwardsville'
  },
  {
    postcode: '60601',
    name: 'Chicago'
  },
  {
    postcode: '85043',
    name: 'Phoenix'
  },
  {
    postcode: '85338',
    name: 'Goodyear'
  },
  {
    postcode: '08691',
    name: 'Robbinsville'
  },
  {
    postcode: '07001',
    name: 'Avenel'
  },
  {
    postcode: '07008',
    name: 'Carteret'
  },
  {
    postcode: '08085',
    name: 'Swedesboro'
  },
  {
    postcode: '08512',
    name: 'Cranbury'
  },
  {
    postcode: '33570',
    name: 'Ruskin'
  },
  {
    postcode: '33811',
    name: 'Lakeland'
  },
  {
    postcode: '33182',
    name: 'Miami'
  },
  {
    postcode: '32221',
    name: 'Jacksonville'
  },
  {
    postcode: '67337',
    name: 'Coffeyville'
  },
  {
    postcode: '66219',
    name: 'Lenexa'
  },
  {
    postcode: '66021',
    name: 'Edgerton'
  },
  {
    postcode: '46075',
    name: 'Whitestown'
  },
  {
    postcode: '46168',
    name: 'Plainfield'
  },
  {
    postcode: '46231',
    name: 'Indianapolis'
  },
  {
    postcode: '47130',
    name: 'Jeffersonville'
  },
  {
    postcode: '40511',
    name: 'Lexington'
  },
  {
    postcode: '42718',
    name: 'Campbellsville'
  },
  {
    postcode: '40218',
    name: 'Louisville'
  },
  {
    postcode: '40165',
    name: 'Shepherdsville'
  },
  {
    postcode: '41048',
    name: 'Hebron'
  },
  {
    postcode: '37416',
    name: 'Chattanooga'
  },
  {
    postcode: '37310',
    name: 'Charleston'
  },
  {
    postcode: '37090',
    name: 'Lebanon'
  },
  {
    postcode: '37067',
    name: 'Franklin'
  },
  {
    postcode: '37127',
    name: 'Murfreesboro'
  },
  {
    postcode: '37217',
    name: 'Nashville'
  },
  {
    postcode: '18031',
    name: 'Breinigsville'
  },
  {
    postcode: '17339',
    name: 'Lewisberry'
  },
  {
    postcode: '18202',
    name: 'Hazleton'
  },
  {
    postcode: '18424',
    name: 'Gouldsboro'
  },
  {
    postcode: '17112',
    name: 'Harrisburg'
  },
  {
    postcode: '15205',
    name: 'Pittsburgh'
  },
  {
    postcode: '18512',
    name: 'Scranton'
  },
  {
    postcode: '18643',
    name: 'Pittston'
  },
  {
    postcode: '17013',
    name: 'Carlisle'
  },
  {
    postcode: '19720',
    name: 'New Castle'
  },
  {
    postcode: '19709',
    name: 'Middletown'
  },
  {
    postcode: '75019',
    name: 'Coppell'
  },
  {
    postcode: '78154',
    name: 'Schertz'
  },
  {
    postcode: '76177',
    name: 'Fort Worth'
  },
  {
    postcode: '75261',
    name: 'Dallas'
  },
  {
    postcode: '77338',
    name: 'Humble'
  },
  {
    postcode: '76155',
    name: 'Fort Worth'
  },
  {
    postcode: '75241',
    name: 'Dallas'
  },
  {
    postcode: '77001',
    name: 'Houston'
  },
  {
    postcode: '77003',
    name: 'Houston'
  },
  {
    postcode: '77038',
    name: 'Houston'
  },
  {
    postcode: '29172',
    name: 'West Columbia'
  },
  {
    postcode: '29303',
    name: 'Spartanburg'
  },
  {
    postcode: '89408',
    name: 'Fernley'
  },
  {
    postcode: '89030',
    name: 'North Las Vegas'
  },
  {
    postcode: '23803',
    name: 'Petersburg'
  },
  {
    postcode: '23836',
    name: 'Chester'
  },
  {
    postcode: '98390',
    name: 'Sumner'
  },
  {
    postcode: '98327',
    name: 'Dupont'
  },
  {
    postcode: '98032',
    name: 'Kent'
  },
  {
    postcode: '98144',
    name: 'Seattle'
  },
  {
    postcode: '98005',
    name: 'Bellevue'
  },
  {
    postcode: '53144',
    name: 'Kenosha'
  },
  {
    postcode: '30344',
    name: 'Atlanta'
  },
  {
    postcode: '30549',
    name: 'Jeffersonville'
  },
  {
    postcode: '02720',
    name: 'Fall River'
  },
  {
    postcode: '28214',
    name: 'Charlotte'
  },
  {
    postcode: '55379',
    name: 'Shakopee'
  },
  {
    postcode: '41018',
    name: 'Erlanger'
  },
  {
    postcode: '48150',
    name: 'Livonia'
  },
  {
    postcode: '66102',
    name: 'Kansas City'
  },
  {
    postcode: '89506',
    name: 'Reno'
  },
  {
    postcode: '21224',
    name: 'Baltimore'
  },
  {
    postcode: '43125',
    name: 'Groveport'
  },
  {
    postcode: '20012',
    name: 'Washington'
  },
  {
    postcode: '08518',
    name: 'Florence'
  },
  {
    postcode: '06095',
    name: 'Windsor'
  },
  {
    postcode: '17015',
    name: 'Carlisle'
  },
  {
    postcode: '03063',
    name: 'Nashua'
  },
  {
    postcode: '20001',
    name: 'Washington'
  }
]

const cityOptions = ref(cities)
const handleCityFilter = (query: string) => {
  if (query) {
    const lowerCaseQuery = query.toLowerCase()
    cityOptions.value = cities.filter(
      (city) =>
        city.name.toLowerCase().includes(lowerCaseQuery) || city.postcode.includes(lowerCaseQuery)
    )
  } else {
    cityOptions.value = cities
  }
}
</script>

<style scoped>
.cron-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cron-display-input {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.cron-description {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
