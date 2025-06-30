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
      <el-form-item label="执行状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker
          v-model="formData.startTime"
          type="date"
          value-format="x"
          placeholder="选择开始时间"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="formData.endTime"
          type="date"
          value-format="x"
          placeholder="选择结束时间"
        />
      </el-form-item>
      <el-form-item label="执行时长(秒)" prop="durationSeconds">
        <el-input v-model="formData.durationSeconds" placeholder="请输入执行时长(秒)" />
      </el-form-item>
      <el-form-item label="错误信息" prop="errorMessage">
        <el-input v-model="formData.errorMessage" placeholder="请输入错误信息" />
      </el-form-item>
      <el-form-item label="保存记录数" prop="recordsSaved">
        <el-input v-model="formData.recordsSaved" placeholder="请输入保存记录数" />
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input v-model="formData.userId" placeholder="请输入用户ID" />
      </el-form-item>
      <el-form-item label="邮编数量" prop="zipcodeNum">
        <el-input v-model="formData.zipcodeNum" placeholder="请输入邮编数量" />
      </el-form-item>
      <el-form-item label="关键词数量" prop="keywordNum">
        <el-input v-model="formData.keywordNum" placeholder="请输入关键词数量" />
      </el-form-item>
      <el-form-item label="爬取页面数量" prop="pageNum">
        <el-input v-model="formData.pageNum" placeholder="请输入爬取页面数量" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { TaskExecLogApi, TaskExecLog } from '@/api/amazon/taskexeclog'

/** Amazon任务执行日志 表单 */
defineOptions({ name: 'TaskExecLogForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  taskId: undefined,
  status: undefined,
  startTime: undefined,
  endTime: undefined,
  durationSeconds: undefined,
  errorMessage: undefined,
  recordsSaved: undefined,
  userId: undefined,
  zipcodeNum: undefined,
  keywordNum: undefined,
  pageNum: undefined
})
const formRules = reactive({
  taskId: [{ required: true, message: '任务ID不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '执行状态不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'blur' }],
  recordsSaved: [{ required: true, message: '保存记录数不能为空', trigger: 'blur' }],
  userId: [{ required: true, message: '用户ID不能为空', trigger: 'blur' }]
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
      formData.value = await TaskExecLogApi.getTaskExecLog(id)
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
    const data = formData.value as unknown as TaskExecLog
    if (formType.value === 'create') {
      await TaskExecLogApi.createTaskExecLog(data)
      message.success(t('common.createSuccess'))
    } else {
      await TaskExecLogApi.updateTaskExecLog(data)
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
    status: undefined,
    startTime: undefined,
    endTime: undefined,
    durationSeconds: undefined,
    errorMessage: undefined,
    recordsSaved: undefined,
    userId: undefined,
    zipcodeNum: undefined,
    keywordNum: undefined,
    pageNum: undefined
  }
  formRef.value?.resetFields()
}
</script>