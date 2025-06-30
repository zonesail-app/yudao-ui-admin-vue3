<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="任务名称" prop="taskName">
        <el-input
          v-model="queryParams.taskName"
          placeholder="请输入任务名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['amazon:keyword-task:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['amazon:keyword-task:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      row-key="id"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      @selection-change="handleRowCheckboxChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="ID" align="center" prop="id" />
      <el-table-column label="任务名称" align="center" prop="taskName" />
      <el-table-column label="任务状态" key="enabled">
        <template #default="scope">
          <el-switch
            v-model="scope.row.enabled"
            :active-value="0"
            :inactive-value="1"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>

      <el-table-column align="center" label="任务类型" prop="taskType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AMAZON_TASK_TYPE_ENUM" :value="scope.row.taskType" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="240px"
      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleView(scope.row.id)"
            v-hasPermi="['amazon:keyword-task:query']"
          >
            爬取结果
          </el-button>
          <el-button
            link
            type="primary"
            @click="handleViewAsinMatch(scope.row.id)"
            v-hasPermi="['amazon:keyword-task:query']"
          >
            ASIN匹配
          </el-button>

          <el-button
            link
            type="primary"
            @click="handleExecLog(scope.row.id)"
            v-hasPermi="['amazon:keyword-task:query']"
          >
            执行日志
          </el-button>

          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['amazon:keyword-task:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['amazon:keyword-task:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <KeywordTaskForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { isEmpty } from '@/utils/is'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { KeywordTaskApi, KeywordTask } from '@/api/amazon/keywordtask'
import KeywordTaskForm from './KeywordTaskForm.vue'
import { CommonStatusEnum } from '@/utils/constants'
import { useRouter } from 'vue-router'

/** 关键词排名任务 列表 */
defineOptions({ name: 'KeywordTask' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const router = useRouter()

const loading = ref(true) // 列表的加载中
const list = ref<KeywordTask[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskName: undefined,
  enabled: undefined,
  taskType: undefined,
  shared: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await KeywordTaskApi.getKeywordTaskPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 修改任务状态 */
const handleStatusChange = async (row: KeywordTask) => {
  // 消息弹窗
  const text = row.enabled === 0 ? '启用' : '禁用'
  try {
    await message.confirm('确认要"' + text + '""' + row.taskName + '"任务吗?')
    await KeywordTaskApi.updateKeywordTaskStatus(row.id, row.enabled)
    message.success(text + '成功')
  } catch {
    row.enabled = row.enabled === 0 ? 1 : 0
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await KeywordTaskApi.deleteKeywordTask(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 批量删除关键词排名任务 */
const handleDeleteBatch = async () => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    await KeywordTaskApi.deleteKeywordTaskList(checkedIds.value)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const checkedIds = ref<number[]>([])
const handleRowCheckboxChange = (records: KeywordTask[]) => {
  checkedIds.value = records.map((item) => item.id)
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await KeywordTaskApi.exportKeywordTask(queryParams)
    download.excel(data, '关键词排名任务.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 查看任务结果 */
const handleView = (id: number) => {
  router.push({
    path: '/amazon/keyword-ranking',
    query: {
      taskId: id
    }
  })
}

/** 查看任务结果 */
const handleViewAsinMatch = (id: number) => {
  router.push({
    path: '/amazon/keyword-asin-ranking',
    query: {
      taskId: id
    }
  })
}

/** 查看执行日志 */
const handleExecLog = (id: number) => {
  router.push({
    path: '/amazon/task-exec-log',
    query: {
      taskId: id
    }
  })
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
