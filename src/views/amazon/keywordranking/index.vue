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
      <el-form-item label="采集日期" prop="crawlDate">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择采集日期"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>

        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['amazon:keyword-ranking:export']"
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
      <el-table-column label="城市" align="center" prop="city" />
      <el-table-column label="关键词" align="center" prop="keyword" />
      <el-table-column label="ASIN" align="center" prop="asin" />
      <el-table-column align="center" label="排名类型" prop="rankType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AMAZON_RANK_TYPE_ENUM" :value="scope.row.rankType" />
        </template>
      </el-table-column>

      <el-table-column label="排名" align="center" prop="rankPosition" />
      <el-table-column label="位置" align="center" prop="position" />
      <el-table-column label="页码" align="center" prop="pageNumber" />
      <el-table-column label="页内位置" align="center" prop="positionInPage" />

      <el-table-column
        label="采集时间"
        align="center"
        prop="crawlTime"
        :formatter="dateFormatter"
        width="180px"
      />
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
  <KeywordRankingForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { isEmpty } from '@/utils/is'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { KeywordRankingApi, KeywordRanking } from '@/api/amazon/keywordranking'
import KeywordRankingForm from './KeywordRankingForm.vue'
import { useRoute } from 'vue-router'

/** 关键词排名任务结果 列表 */
defineOptions({ name: 'KeywordRanking' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const route = useRoute()

const loading = ref(true) // 列表的加载中
const list = ref<KeywordRanking[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedDate = ref() // 选择的日期
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: undefined,
  crawlDate: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await KeywordRankingApi.getKeywordRankingPage(queryParams)
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
  selectedDate.value = undefined
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await KeywordRankingApi.deleteKeywordRanking(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 批量删除关键词排名任务结果 */
const handleDeleteBatch = async () => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    await KeywordRankingApi.deleteKeywordRankingList(checkedIds.value)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const checkedIds = ref<number[]>([])
const handleRowCheckboxChange = (records: KeywordRanking[]) => {
  checkedIds.value = records.map((item) => item.id)
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await KeywordRankingApi.exportKeywordRanking(queryParams)
    download.excel(data, '关键词排名任务结果.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

watch(selectedDate, (newDate) => {
  if (newDate) {
    queryParams.crawlDate = newDate
  } else {
    queryParams.crawlDate = undefined
  }
})

/** 初始化 **/
onMounted(() => {
  const taskId = route.query.taskId
  if (taskId) {
    queryParams.taskId = Number(taskId)
  }
  getList()
})
</script>
