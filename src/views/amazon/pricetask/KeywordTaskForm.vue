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

      <el-form-item label="ASIN列表" prop="asins" for="asins">
        <el-input
          id="asins"
          v-model="formData.asins"
          type="textarea"
          :rows="10"
          placeholder="请输入ASIN， 每行一个ASIN。仅适用于领星中存在的asin数据。"
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
              placeholder="每天早上9:00执行"
              readonly
              class="cron-display-input"
            />
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
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { KeywordTaskApi, KeywordTask } from '@/api/amazon/keywordtask'
import { Setting } from '@element-plus/icons-vue'

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
  asins: [],
  cronTab: undefined,
  taskType: undefined,
  shared: undefined,
  description: undefined,
  startTime: undefined,
  endTime: undefined,
  scraperType: 2
})
const formRules = reactive({
  taskName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  taskType: [{ required: true, message: '任务类型不能为空', trigger: 'blur' }],
  cronTab: [
    {
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

// 监听定时任务状态变化，自动设置cron表达式
watch(isScheduledTask, (newVal) => {
  if (newVal) {
    // 当设置为定时任务时，默认设置为每天早上9点执行
    formData.value.cronTab = '0 9 * * *'
  } else {
    // 不是定时任务时，清除cron表达式
    formData.value.cronTab = undefined
  }
})

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
    if (data.asins && typeof data.asins === 'string') {
      data.asins = data.asins.split('\n').filter((item) => item.trim() !== '')
    } else if (!data.asins) {
      data.asins = []
    }
    data.scraperType = 2
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
    asins: [],
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
