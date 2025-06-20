<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="任务ID" prop="taskId">
        <el-input v-model="formData.taskId" placeholder="请输入任务ID" />
      </el-form-item>
      <el-form-item label="关键词" prop="keyword">
        <el-input v-model="formData.keyword" placeholder="请输入关键词" />
      </el-form-item>
      <el-form-item label="关键词的哈希值" prop="keywordHash">
        <el-input v-model="formData.keywordHash" placeholder="请输入关键词的哈希值" />
      </el-form-item>
      <el-form-item label="ASIN" prop="asin">
        <el-input v-model="formData.asin" placeholder="请输入ASIN" />
      </el-form-item>
      <el-form-item label="搜索城市/地区" prop="city">
        <el-input v-model="formData.city" placeholder="请输入搜索城市/地区" />
      </el-form-item>
      <el-form-item label="排名类型" prop="rankType">
        <el-select v-model="formData.rankType" placeholder="请选择排名类型">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="整体排名位置" prop="rankPosition">
        <el-input v-model="formData.rankPosition" placeholder="请输入整体排名位置" />
      </el-form-item>
      <el-form-item label="搜索结果页码" prop="pageNumber">
        <el-input v-model="formData.pageNumber" placeholder="请输入搜索结果页码" />
      </el-form-item>
      <el-form-item label="页内位置" prop="positionInPage">
        <el-input v-model="formData.positionInPage" placeholder="请输入页内位置" />
      </el-form-item>
      <el-form-item label="广告类型" prop="adsType">
        <el-select v-model="formData.adsType" placeholder="请选择广告类型">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="是否为付费广告位" prop="isSponsored">
        <el-radio-group v-model="formData.isSponsored">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="采集时间" prop="crawlTime">
        <el-date-picker
          v-model="formData.crawlTime"
          type="date"
          value-format="x"
          placeholder="选择采集时间"
        />
      </el-form-item>
      <el-form-item label="爬取日期" prop="crawlDate">
        <el-date-picker
          v-model="formData.crawlDate"
          type="date"
          value-format="x"
          placeholder="选择爬取日期"
        />
      </el-form-item>
      <el-form-item label="备注信息" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注信息" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { KeywordRankingApi, KeywordRanking } from '@/api/amazon/keywordranking'

/** 关键词排名任务结果 表单 */
defineOptions({ name: 'KeywordRankingForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  taskId: undefined,
  keyword: undefined,
  keywordHash: undefined,
  asin: undefined,
  city: undefined,
  rankType: undefined,
  rankPosition: undefined,
  pageNumber: undefined,
  positionInPage: undefined,
  adsType: undefined,
  isSponsored: undefined,
  crawlTime: undefined,
  crawlDate: undefined,
  remark: undefined
})
const formRules = reactive({
  taskId: [{ required: true, message: '任务ID不能为空', trigger: 'blur' }],
  keyword: [{ required: true, message: '关键词不能为空', trigger: 'blur' }],
  keywordHash: [{ required: true, message: '关键词的哈希值不能为空', trigger: 'blur' }],
  asin: [{ required: true, message: 'ASIN不能为空', trigger: 'blur' }],
  city: [{ required: true, message: '搜索城市/地区不能为空', trigger: 'blur' }],
  rankType: [{ required: true, message: '排名类型不能为空', trigger: 'change' }],
  rankPosition: [{ required: true, message: '整体排名位置不能为空', trigger: 'blur' }],
  pageNumber: [{ required: true, message: '搜索结果页码不能为空', trigger: 'blur' }],
  positionInPage: [{ required: true, message: '页内位置不能为空', trigger: 'blur' }],
  crawlTime: [{ required: true, message: '采集时间不能为空', trigger: 'blur' }],
  crawlDate: [{ required: true, message: '爬取日期不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

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
      formData.value = await KeywordRankingApi.getKeywordRanking(id)
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
    const data = formData.value as unknown as KeywordRanking
    if (formType.value === 'create') {
      await KeywordRankingApi.createKeywordRanking(data)
      message.success(t('common.createSuccess'))
    } else {
      await KeywordRankingApi.updateKeywordRanking(data)
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
    taskId: undefined,
    keyword: undefined,
    keywordHash: undefined,
    asin: undefined,
    city: undefined,
    rankType: undefined,
    rankPosition: undefined,
    pageNumber: undefined,
    positionInPage: undefined,
    adsType: undefined,
    isSponsored: undefined,
    crawlTime: undefined,
    crawlDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>