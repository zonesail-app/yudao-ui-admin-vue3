<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="用户ID" prop="userId">
        <el-input v-model="formData.userId" placeholder="请输入用户ID" />
      </el-form-item>
      <el-form-item label="Amazon标准识别码" prop="asin">
        <el-input v-model="formData.asin" placeholder="请输入Amazon标准识别码" />
      </el-form-item>
      <el-form-item label="父级ASIN（用于变体商品）" prop="parentAsin">
        <el-input v-model="formData.parentAsin" placeholder="请输入父级ASIN（用于变体商品）" />
      </el-form-item>
      <el-form-item label="数据采集任务ID" prop="taskId">
        <el-input v-model="formData.taskId" placeholder="请输入数据采集任务ID" />
      </el-form-item>
      <el-form-item label="评论总数" prop="reviewNum">
        <el-input v-model="formData.reviewNum" placeholder="请输入评论总数" />
      </el-form-item>
      <el-form-item label="平均评分（1-5分）" prop="score">
        <el-input v-model="formData.score" placeholder="请输入平均评分（1-5分）" />
      </el-form-item>
      <el-form-item label="评级总数" prop="ratings">
        <el-input v-model="formData.ratings" placeholder="请输入评级总数" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { AsinReviewApi, AsinReview } from '@/api/amazon/asinreview'

/** Amazon ASIN商品评论数据 表单 */
defineOptions({ name: 'AsinReviewForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  userId: undefined,
  asin: undefined,
  parentAsin: undefined,
  taskId: undefined,
  reviewNum: undefined,
  score: undefined,
  ratings: undefined,
  remark: undefined
})
const formRules = reactive({
  userId: [{ required: true, message: '用户ID不能为空', trigger: 'blur' }],
  asin: [{ required: true, message: 'Amazon标准识别码不能为空', trigger: 'blur' }],
  taskId: [{ required: true, message: '数据采集任务ID不能为空', trigger: 'blur' }],
  reviewNum: [{ required: true, message: '评论总数不能为空', trigger: 'blur' }],
  ratings: [{ required: true, message: '评级总数不能为空', trigger: 'blur' }]
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
      formData.value = await AsinReviewApi.getAsinReview(id)
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
    const data = formData.value as unknown as AsinReview
    if (formType.value === 'create') {
      await AsinReviewApi.createAsinReview(data)
      message.success(t('common.createSuccess'))
    } else {
      await AsinReviewApi.updateAsinReview(data)
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
    userId: undefined,
    asin: undefined,
    parentAsin: undefined,
    taskId: undefined,
    reviewNum: undefined,
    score: undefined,
    ratings: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>